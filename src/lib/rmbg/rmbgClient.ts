import type {
  RmbgMainToWorkerMessage,
  RmbgProgressCallback,
  RmbgProgressPhase,
  RmbgWorkerToMainMessage,
} from '@/lib/rmbg/types';

type PendingJob = {
  resolve: (dataUrl: string) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let workerGeneration = 0;
let ready = false;
let initInFlight: Promise<void> | null = null;
const pending = new Map<string, PendingJob>();
const progressListeners = new Set<RmbgProgressCallback>();

function emitProgress(
  phase: RmbgProgressPhase,
  progress: number,
  message: string,
  file?: string,
) {
  for (const listener of progressListeners) {
    listener({ phase, progress, message, file });
  }
}

function arrayBufferToPngDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

function handleWorkerMessage(event: MessageEvent<RmbgWorkerToMainMessage>) {
  const message = event.data;

  switch (message.type) {
    case 'progress':
      emitProgress(message.phase, message.progress, message.message, message.file);
      break;
    case 'ready':
      ready = true;
      emitProgress('ready', 100, message.message);
      break;
    case 'result': {
      const job = pending.get(message.id);
      if (!job) return;
      pending.delete(message.id);
      emitProgress('complete', 100, 'Background removed');
      job.resolve(arrayBufferToPngDataUrl(message.pngBuffer));
      break;
    }
    case 'error': {
      if (message.id) {
        const job = pending.get(message.id);
        if (job) {
          pending.delete(message.id);
          job.reject(new Error(message.message));
        }
      }
      emitProgress('error', 0, message.message);
      break;
    }
    default:
      break;
  }
}

function handleWorkerError(event: ErrorEvent) {
  const err = new Error(event.message || 'RMBG worker crashed');
  for (const [id, job] of pending) {
    pending.delete(id);
    job.reject(err);
  }
  ready = false;
  initInFlight = null;
  worker = null;
  emitProgress('error', 0, err.message);
}

function createWorker(): Worker {
  const next = new Worker(new URL('../../workers/rmbg.worker.ts', import.meta.url), {
    type: 'module',
    name: 'rmbg-1.4',
  });
  next.addEventListener('message', handleWorkerMessage);
  next.addEventListener('error', handleWorkerError);
  return next;
}

function ensureWorker(): Worker {
  if (typeof window === 'undefined') {
    throw new Error('RMBG worker is browser-only');
  }
  if (!worker) {
    worker = createWorker();
    workerGeneration += 1;
    ready = false;
  }
  return worker;
}

function postToWorker(message: RmbgMainToWorkerMessage) {
  ensureWorker().postMessage(message);
}

export function subscribeRmbgProgress(listener: RmbgProgressCallback): () => void {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

export async function preloadRmbgModel(): Promise<void> {
  if (ready) return;
  if (initInFlight) return initInFlight;

  const generation = workerGeneration;
  initInFlight = new Promise<void>((resolve, reject) => {
    const unsubscribe = subscribeRmbgProgress((update) => {
      if (workerGeneration !== generation) {
        unsubscribe();
        reject(new Error('RMBG worker was replaced'));
        return;
      }
      if (update.phase === 'ready') {
        unsubscribe();
        resolve();
      }
      if (update.phase === 'error') {
        unsubscribe();
        reject(new Error(update.message));
      }
    });

    try {
      postToWorker({ type: 'init' });
    } catch (error) {
      unsubscribe();
      reject(error instanceof Error ? error : new Error('Failed to start RMBG worker'));
    }
  }).finally(() => {
    initInFlight = null;
  });

  return initInFlight;
}

export async function removeBackgroundWithRmbg(
  imageDataUrl: string,
  options?: { onProgress?: RmbgProgressCallback; signal?: AbortSignal },
): Promise<string> {
  if (!imageDataUrl) {
    throw new Error('Missing image for background removal');
  }

  await preloadRmbgModel();

  const id = crypto.randomUUID();
  const unsubscribeProgress = options?.onProgress
    ? subscribeRmbgProgress(options.onProgress)
    : null;

  return new Promise<string>((resolve, reject) => {
    const onAbort = () => {
      pending.delete(id);
      unsubscribeProgress?.();
      reject(new DOMException('Background removal aborted', 'AbortError'));
    };

    if (options?.signal?.aborted) {
      onAbort();
      return;
    }

    options?.signal?.addEventListener('abort', onAbort, { once: true });

    pending.set(id, {
      resolve: (dataUrl) => {
        options?.signal?.removeEventListener('abort', onAbort);
        unsubscribeProgress?.();
        resolve(dataUrl);
      },
      reject: (error) => {
        options?.signal?.removeEventListener('abort', onAbort);
        unsubscribeProgress?.();
        reject(error);
      },
    });

    try {
      postToWorker({ type: 'process', id, imageDataUrl });
    } catch (error) {
      pending.delete(id);
      options?.signal?.removeEventListener('abort', onAbort);
      unsubscribeProgress?.();
      reject(error instanceof Error ? error : new Error('Failed to post to RMBG worker'));
    }
  });
}

export function terminateRmbgWorker(): void {
  const err = new Error('RMBG worker terminated');
  for (const [id, job] of pending) {
    pending.delete(id);
    job.reject(err);
  }

  if (worker) {
    try {
      worker.postMessage({ type: 'dispose' } satisfies RmbgMainToWorkerMessage);
    } catch {
      // ignore
    }
    worker.removeEventListener('message', handleWorkerMessage);
    worker.removeEventListener('error', handleWorkerError);
    worker.terminate();
    worker = null;
  }

  ready = false;
  initInFlight = null;
  workerGeneration += 1;
  emitProgress('idle', 0, 'Worker terminated');
}

export function isRmbgWorkerReady(): boolean {
  return ready;
}
