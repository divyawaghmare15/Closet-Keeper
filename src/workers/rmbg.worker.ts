/// <reference lib="webworker" />

/**
 * Dedicated Web Worker for BRIA RMBG-1.4 via Transformers.js.
 */
import {
  AutoModel,
  AutoProcessor,
  RawImage,
  Tensor,
  env,
  type PreTrainedModel,
  type Processor,
} from '@huggingface/transformers';
import {
  RMBG_MODEL_ID,
  type RmbgMainToWorkerMessage,
  type RmbgWorkerToMainMessage,
} from '@/lib/rmbg/types';

declare const self: DedicatedWorkerGlobalScope;

env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.proxy = false;
}

let model: PreTrainedModel | null = null;
let processor: Processor | null = null;
let initPromise: Promise<void> | null = null;

function post(message: RmbgWorkerToMainMessage, transfer?: Transferable[]) {
  if (transfer?.length) {
    self.postMessage(message, transfer);
  } else {
    self.postMessage(message);
  }
}

async function ensureModel(): Promise<void> {
  if (model && processor) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    post({
      type: 'progress',
      phase: 'loading-model',
      progress: 0,
      message: 'Downloading RMBG-1.4 (~44MB, cached after first time)…',
    });

    model = await AutoModel.from_pretrained(RMBG_MODEL_ID, {
      config: { model_type: 'custom' } as never,
      progress_callback: (event) => {
        const progress =
          typeof event === 'object' &&
          event !== null &&
          'progress' in event &&
          typeof (event as { progress?: unknown }).progress === 'number'
            ? Math.max(
                0,
                Math.min(100, Math.round((event as { progress: number }).progress)),
              )
            : 0;
        const file =
          typeof event === 'object' &&
          event !== null &&
          'file' in event &&
          typeof (event as { file?: unknown }).file === 'string'
            ? (event as { file: string }).file
            : undefined;

        post({
          type: 'progress',
          phase: 'loading-model',
          progress,
          message: file
            ? `Downloading model file: ${file}`
            : `Loading model ${progress}%`,
          file,
        });
      },
    });

    processor = await AutoProcessor.from_pretrained(RMBG_MODEL_ID, {
      revision: 'main',
      config: {
        do_normalize: true,
        do_pad: false,
        do_rescale: true,
        do_resize: true,
        image_mean: [0.5, 0.5, 0.5],
        image_std: [1.0, 1.0, 1.0],
        feature_extractor_type: 'ImageFeatureExtractor',
        resample: 2,
        rescale_factor: 1 / 255,
        size: { width: 1024, height: 1024 },
      },
    });

    post({
      type: 'ready',
      message: 'RMBG-1.4 ready',
    });
  })().catch((error) => {
    initPromise = null;
    model = null;
    processor = null;
    throw error;
  });

  return initPromise;
}

/** Min-max normalize matte to 0–255 uint8 (BRIA Python postprocess). */
function matteTensorToUint8(tensor: Tensor): Tensor {
  const data = tensor.data as Float32Array | Uint8Array | Int32Array;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < data.length; i++) {
    const v = Number(data[i]);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1e-8, max - min);
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = Math.max(
      0,
      Math.min(255, Math.round(((Number(data[i]) - min) / range) * 255)),
    );
  }
  return new Tensor('uint8', out, [...tensor.dims]);
}

async function ensureSingleChannelMask(mask: RawImage): Promise<RawImage> {
  if (mask.channels === 1) return mask;
  return mask.grayscale();
}

async function processDataUrl(imageDataUrl: string): Promise<{
  pngBuffer: ArrayBuffer;
  width: number;
  height: number;
}> {
  await ensureModel();
  if (!model || !processor) {
    throw new Error('RMBG model failed to initialize');
  }

  post({
    type: 'progress',
    phase: 'processing',
    progress: 10,
    message: 'Loading image…',
  });

  const img = await RawImage.fromURL(imageDataUrl);
  if (img.width < 8 || img.height < 8) {
    throw new Error('Image is too small for background removal');
  }

  post({
    type: 'progress',
    phase: 'processing',
    progress: 30,
    message: 'Preprocessing for RMBG-1.4…',
  });

  const { pixel_values } = await processor(img);

  post({
    type: 'progress',
    phase: 'processing',
    progress: 55,
    message: 'Running segmentation…',
  });

  const result = (await model({ input: pixel_values })) as {
    output?: Tensor[];
  };

  const outputTensor = result.output?.[0];
  if (!outputTensor) {
    throw new Error('RMBG model returned an empty mask');
  }

  post({
    type: 'progress',
    phase: 'processing',
    progress: 75,
    message: 'Building clean alpha mask…',
  });

  const uint8Matte = matteTensorToUint8(outputTensor);
  let mask = await RawImage.fromTensor(uint8Matte);
  mask = await mask.resize(img.width, img.height);
  mask = await ensureSingleChannelMask(mask);

  const cutout = img.clone().rgba().putAlpha(mask);

  post({
    type: 'progress',
    phase: 'processing',
    progress: 92,
    message: 'Encoding transparent PNG…',
  });

  const blob = (await cutout.toBlob('image/png')) as Blob;
  const pngBuffer = await blob.arrayBuffer();

  return { pngBuffer, width: img.width, height: img.height };
}

function disposeModel() {
  model = null;
  processor = null;
  initPromise = null;
}

self.onmessage = async (event: MessageEvent<RmbgMainToWorkerMessage>) => {
  const message = event.data;

  try {
    if (message.type === 'init') {
      await ensureModel();
      return;
    }

    if (message.type === 'dispose') {
      disposeModel();
      return;
    }

    if (message.type === 'process') {
      const { pngBuffer, width, height } = await processDataUrl(
        message.imageDataUrl,
      );
      post(
        {
          type: 'result',
          id: message.id,
          pngBuffer,
          width,
          height,
        },
        [pngBuffer],
      );
    }
  } catch (error) {
    post({
      type: 'error',
      id: message.type === 'process' ? message.id : undefined,
      message:
        error instanceof Error ? error.message : 'Background removal failed',
    });
  }
};
