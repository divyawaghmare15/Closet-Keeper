'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { ImageCropper } from '@/components/add-item/ImageCropper';
import {
  compressDataUrl,
  cropDataUrl,
  fileToDataUrl,
  flattenOnWhite,
  hardenCutoutAlpha,
  removeBackgroundSmart,
} from '@/lib/imageProcess';

export function ImageUploader({
  imageUrl,
  onChange,
  onProcessed,
  multiple = false,
  onMultiple,
  autoRemoveBackground,
  onAutoRemoveBackgroundChange,
}: {
  imageUrl: string;
  onChange: (dataUrl: string) => void;
  onProcessed?: (dataUrl: string) => void;
  multiple?: boolean;
  onMultiple?: (files: File[]) => void;
  autoRemoveBackground: boolean;
  onAutoRemoveBackgroundChange: (value: boolean) => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingRaw, setPendingRaw] = useState('');
  const [originalRaw, setOriginalRaw] = useState('');
  /** Cropped/original photo before background removal (for Undo BG). */
  const [preBgUrl, setPreBgUrl] = useState('');
  const [bgApplied, setBgApplied] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  async function beginWithFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setError('');
    setPreBgUrl('');
    setBgApplied(false);
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
    setIsDragOver(false);
    void handleFiles(event.dataTransfer.files);
  }

  function clearPhoto() {
    setError('');
    setPendingRaw('');
    setOriginalRaw('');
    setPreBgUrl('');
    setBgApplied(false);
    onChange('');
  }

  function reCrop() {
    if (!originalRaw) return;
    setPendingRaw(originalRaw);
  }

  async function finishProcessed(
    source: string,
    options?: { removeBackground?: boolean },
  ) {
    const shouldRemove = options?.removeBackground ?? autoRemoveBackground;
    try {
      const originalCompressed = await compressDataUrl(source);
      setPreBgUrl(originalCompressed);

      if (!shouldRemove) {
        setBusy('Saving photo…');
        setBgApplied(false);
        onChange(originalCompressed);
        onProcessed?.(originalCompressed);
        return;
      }

      setBusy('Removing background…');
      let processed = await removeBackgroundSmart(source, (update) => {
        if (update.message) setBusy(update.message);
      });
      processed = await hardenCutoutAlpha(processed);
      processed = await flattenOnWhite(processed);
      const compressed = await compressDataUrl(processed);
      setBgApplied(true);
      onChange(compressed);
      onProcessed?.(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process photo');
    } finally {
      setBusy('');
    }
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
      setBusy('');
    }
  }

  async function removeBackgroundNow() {
    if (busy) return;
    const source = preBgUrl || imageUrl;
    if (!source) return;
    await finishProcessed(source, { removeBackground: true });
  }

  function undoBackground() {
    if (!preBgUrl || busy) return;
    setError('');
    setBgApplied(false);
    onAutoRemoveBackgroundChange(false);
    onChange(preBgUrl);
    onProcessed?.(preBgUrl);
  }

  function openGallery() {
    galleryInputRef.current?.click();
  }

  return (
    <div className="flex h-full min-h-[240px] flex-col sm:min-h-[280px] md:min-h-[calc(100svh-11rem)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!imageUrl && !busy) openGallery();
        }}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ' ') && !imageUrl && !busy) {
            event.preventDefault();
            openGallery();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border-2 border-dashed p-5 transition-colors sm:p-6 ${
          isDragOver
            ? 'border-accent bg-accent-soft/60'
            : 'border-border/80 bg-surface-elevated hover:border-accent/40 hover:bg-accent-soft/30'
        } ${imageUrl ? 'min-h-[260px] cursor-default sm:min-h-[320px]' : 'min-h-[220px]'}`}
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Selected clothing preview"
              className="absolute inset-0 h-full w-full object-contain p-3 sm:p-4"
            />
            <div className="absolute right-2.5 top-2.5 flex max-w-[calc(100%-1.25rem)] flex-wrap justify-end gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
              {originalRaw && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    reCrop();
                  }}
                  disabled={Boolean(busy)}
                  className="rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60 sm:px-3 sm:text-xs"
                >
                  Re-crop
                </button>
              )}
              {bgApplied && preBgUrl ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    undoBackground();
                  }}
                  disabled={Boolean(busy)}
                  className="rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60 sm:px-3 sm:text-xs"
                >
                  Undo BG
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void removeBackgroundNow();
                  }}
                  disabled={Boolean(busy)}
                  className="rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-accent shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60 sm:px-3 sm:text-xs"
                >
                  Remove BG
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  clearPhoto();
                }}
                disabled={Boolean(busy)}
                aria-label="Delete photo"
                className="rounded-xl bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-red-700 shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60 sm:px-3 sm:text-xs"
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent sm:size-14">
              <HangerIcon />
            </div>
            <p className="mt-3 font-display text-lg font-semibold text-foreground sm:mt-4 sm:text-xl">
              Add a photo
            </p>
            <p className="mt-1 hidden text-sm text-muted sm:block">
              Drag &amp; drop, or pick from your library
            </p>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:mt-5">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                disabled={Boolean(busy)}
                className="rounded-2xl bg-accent px-3 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                Camera
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openGallery();
                }}
                disabled={Boolean(busy)}
                className="rounded-2xl border border-border/70 bg-surface-elevated px-3 py-3 text-sm font-semibold text-foreground transition hover:bg-accent-soft/50 active:scale-[0.98] disabled:opacity-60"
              >
                Gallery
              </button>
            </div>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/50 px-4 text-center text-sm font-semibold text-white">
            {busy}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <button
          type="button"
          onClick={() => onAutoRemoveBackgroundChange(!autoRemoveBackground)}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
            autoRemoveBackground
              ? 'border-accent/40 bg-accent-soft/70'
              : 'border-border/70 bg-surface'
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {autoRemoveBackground
                ? 'Remove background after crop'
                : 'Keep original photo (crop only)'}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {autoRemoveBackground
                ? 'Background will be removed after you crop. You can Undo BG afterward.'
                : 'Default: crop and keep colors as-is. Turn on only if you want a cutout.'}
            </p>
          </div>
          <span
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
              autoRemoveBackground ? 'bg-accent' : 'bg-border'
            }`}
            aria-hidden
          >
            <span
              className={`absolute left-0.5 size-6 rounded-full bg-white shadow transition ${
                autoRemoveBackground ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
        {bgApplied && (
          <button
            type="button"
            onClick={undoBackground}
            disabled={Boolean(busy) || !preBgUrl}
            className="w-full rounded-2xl border border-border/70 bg-surface px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition hover:bg-accent-soft/50 disabled:opacity-60"
          >
            Restore original photo (undo background removal)
          </button>
        )}
      </div>

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
            removeBackgroundHint={autoRemoveBackground}
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

function HangerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M12 3a2 2 0 0 1 2 2v1.5" />
      <path d="M6.5 9.5 12 6l5.5 3.5" />
      <path d="M4 20h16L12 9 4 20z" />
    </svg>
  );
}
