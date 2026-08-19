'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { ImageCropper } from '@/components/add-item/ImageCropper';
import {
  compressDataUrl,
  cropDataUrl,
  fileToDataUrl,
  softenBackground,
} from '@/lib/imageProcess';

export function ImageUploader({
  imageUrl,
  onChange,
  onProcessed,
  multiple = false,
  onMultiple,
}: {
  imageUrl: string;
  onChange: (dataUrl: string) => void;
  onProcessed?: (dataUrl: string) => void;
  multiple?: boolean;
  onMultiple?: (files: File[]) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingRaw, setPendingRaw] = useState('');
  const [originalRaw, setOriginalRaw] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function beginWithFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setError('');
    const dataUrl = await fileToDataUrl(file);
    setOriginalRaw(dataUrl);
    setPendingRaw(dataUrl);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;

    if (multiple && onMultiple && fileList.length > 1) {
      onMultiple(Array.from(fileList));
      return;
    }

    await beginWithFile(fileList[0]);
  }

  function handleCameraChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFiles(event.target.files);
    event.target.value = '';
  }

  function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFiles(event.target.files);
    event.target.value = '';
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void handleFiles(event.dataTransfer.files);
  }

  function clearPhoto() {
    setError('');
    setPendingRaw('');
    setOriginalRaw('');
    onChange('');
  }

  function reCrop() {
    if (!originalRaw) return;
    setPendingRaw(originalRaw);
  }

  async function finishProcessed(source: string) {
    setBusy('Compressing…');
    const compressed = await compressDataUrl(source);
    onChange(compressed);
    onProcessed?.(compressed);
  }

  async function applyCrop(crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) {
    try {
      setBusy('Cropping…');
      const cropped = await cropDataUrl(pendingRaw, crop);
      setPendingRaw('');
      await finishProcessed(cropped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process photo');
    } finally {
      setBusy('');
    }
  }

  async function skipCropAndProcess() {
    try {
      const source = pendingRaw;
      setPendingRaw('');
      await finishProcessed(source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process photo');
    } finally {
      setBusy('');
    }
  }

  async function softenOnDemand() {
    if (!imageUrl) return;
    try {
      setBusy('Softening background…');
      const softened = await softenBackground(imageUrl);
      const compressed = await compressDataUrl(softened);
      onChange(compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not soften background',
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <div>
      <div className="mb-2">
        <p className="text-sm font-semibold">Photo</p>
      </div>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-border bg-white sm:aspect-[4/3] md:aspect-[3/4] md:max-h-[420px]"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Selected clothing preview"
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="px-4 text-center text-sm text-muted">
            Use the camera for the sharpest catalog shots
          </span>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/50 px-4 text-center text-sm font-semibold text-white">
            {busy}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={Boolean(busy)}
          className="min-w-0 flex-1 cursor-pointer rounded-2xl bg-accent px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={Boolean(busy)}
          className="min-w-0 flex-1 cursor-pointer rounded-2xl bg-surface px-3 py-3 text-sm font-semibold ring-1 ring-border disabled:opacity-60"
        >
          {multiple ? 'Gallery / bulk' : 'From gallery'}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={clearPhoto}
            disabled={Boolean(busy)}
            aria-label="Delete photo"
            title="Delete photo"
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-surface px-3 py-3 text-red-700 ring-1 ring-border disabled:opacity-60 hover:bg-red-50"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
              <path
                d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {imageUrl && (
        <div className="mt-2 flex gap-2">
          {originalRaw && (
            <button
              type="button"
              onClick={reCrop}
              disabled={Boolean(busy)}
              className="flex-1 cursor-pointer rounded-2xl bg-surface px-3 py-3 text-sm font-semibold ring-1 ring-border disabled:opacity-60"
            >
              Re-crop
            </button>
          )}
          <button
            type="button"
            onClick={() => void softenOnDemand()}
            disabled={Boolean(busy)}
            className="flex-1 cursor-pointer rounded-2xl bg-surface px-3 py-3 text-sm font-semibold ring-1 ring-border disabled:opacity-60"
          >
            Soften BG
          </button>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleCameraChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={handleGalleryChange}
      />

      {pendingRaw &&
        createPortal(
          <ImageCropper
            imageUrl={pendingRaw}
            onCancel={() => setPendingRaw('')}
            onSkip={() => {
              void skipCropAndProcess();
            }}
            onConfirm={(crop) => {
              void applyCrop(crop);
            }}
          />,
          document.body,
        )}
    </div>
  );
}
