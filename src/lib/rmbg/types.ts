/** Shared message types between the RMBG worker and the main thread. */

export const RMBG_MODEL_ID = 'briaai/RMBG-1.4' as const;

export type RmbgProgressPhase =
  | 'idle'
  | 'loading-model'
  | 'ready'
  | 'processing'
  | 'complete'
  | 'error';

export type RmbgMainToWorkerMessage =
  | { type: 'init' }
  | { type: 'process'; id: string; imageDataUrl: string }
  | { type: 'dispose' };

export type RmbgWorkerToMainMessage =
  | {
      type: 'progress';
      phase: Extract<RmbgProgressPhase, 'loading-model' | 'processing'>;
      progress: number;
      message: string;
      file?: string;
    }
  | { type: 'ready'; message: string }
  | {
      type: 'result';
      id: string;
      pngBuffer: ArrayBuffer;
      width: number;
      height: number;
    }
  | { type: 'error'; id?: string; message: string };

export type RmbgProgressCallback = (update: {
  phase: RmbgProgressPhase;
  progress: number;
  message: string;
  file?: string;
}) => void;
