'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  isRmbgWorkerReady,
  preloadRmbgModel,
  removeBackgroundWithRmbg,
  subscribeRmbgProgress,
  terminateRmbgWorker,
} from '@/lib/rmbg/rmbgClient';
import type { RmbgProgressPhase } from '@/lib/rmbg/types';

export type UseRmbgWorkerOptions = {
  preload?: boolean;
  terminateOnUnmount?: boolean;
};

export function useRmbgWorker(options: UseRmbgWorkerOptions = {}) {
  const { preload = false, terminateOnUnmount = false } = options;

  const [phase, setPhase] = useState<RmbgProgressPhase>(
    isRmbgWorkerReady() ? 'ready' : 'idle',
  );
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    const unsubscribe = subscribeRmbgProgress((update) => {
      if (!aliveRef.current) return;
      setPhase(update.phase);
      setProgress(update.progress);
      setMessage(update.message);
      if (update.phase === 'error') setError(update.message);
    });

    if (preload) {
      void preloadRmbgModel().catch((err) => {
        if (!aliveRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load RMBG model');
        setPhase('error');
      });
    }

    return () => {
      aliveRef.current = false;
      unsubscribe();
      if (terminateOnUnmount) terminateRmbgWorker();
    };
  }, [preload, terminateOnUnmount]);

  const removeBackground = useCallback(
    async (imageDataUrl: string, signal?: AbortSignal) => {
      setError(null);
      setPhase('processing');
      try {
        const result = await removeBackgroundWithRmbg(imageDataUrl, { signal });
        if (aliveRef.current) {
          setPhase('complete');
          setProgress(100);
        }
        return result;
      } catch (err) {
        const text =
          err instanceof Error ? err.message : 'Background removal failed';
        if (aliveRef.current) {
          setError(text);
          setPhase('error');
        }
        throw err;
      }
    },
    [],
  );

  const preloadModel = useCallback(async () => {
    setError(null);
    await preloadRmbgModel();
  }, []);

  return {
    phase,
    progress,
    message,
    error,
    isReady: phase === 'ready' || phase === 'complete' || isRmbgWorkerReady(),
    isBusy: phase === 'loading-model' || phase === 'processing',
    preloadModel,
    removeBackground,
    terminate: terminateRmbgWorker,
  };
}
