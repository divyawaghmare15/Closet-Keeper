'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { ImageCropper } from '@/components/add-item/ImageCropper';
import {
  compressDataUrl,
  cropDataUrl,
  fileToDataUrl,
  flattenOnWhite,
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
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
    setIsDragOver(false);
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
    try {
      let processed = source;
      if (autoRemoveBackground) {
        setBusy('Removing background…');
        processed = await removeBackgroundSmart(source);
        processed = await flattenOnWhite(processed);
      } else {
        setBusy('Compressing…');
      }
      const compressed = await compressDataUrl(processed);
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

  function openGallery() {
    galleryInputRef.current?.click();
  }

  return (
    <div className="flex h-full min-h-[280px] flex-col md:min-h-[calc(100svh-11rem)]">
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
        className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-colors ${
          isDragOver
            ? 'border-purple-400 bg-purple-50'
            : 'border-slate-300 bg-slate-50 hover:bg-purple-50'
        } ${imageUrl ? 'cursor-default' : ''}`}
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Selected clothing preview"
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
            <div className="absolute right-3 top-3 flex gap-2">
              {originalRaw && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    reCrop();
                  }}
                  disabled={Boolean(busy)}
                  className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60"
                >
                  Re-crop
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
                className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm ring-1 ring-border/60 backdrop-blur-sm disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-accent shadow-sm ring-1 ring-purple-100">
              <HangerIcon />
            </div>
            <p className="mt-4 max-w-xs text-sm font-bold text-foreground">
              Drag &amp; drop clothing photo, or click to browse
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                cameraInputRef.current?.click();
              }}
              disabled={Boolean(busy)}
              className="mt-3 text-sm font-semibold text-accent underline-offset-2 hover:underline disabled:opacity-60"
            >
              📷 Use Camera
            </button>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-foreground/50 px-4 text-center text-sm font-semibold text-white">
            {busy}
          </div>
        )}

        <label
          className={`absolute bottom-4 left-1/2 flex -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 transition ${
            autoRemoveBackground
              ? 'bg-accent text-white ring-accent/40'
              : 'bg-white/95 text-muted ring-border/60 hover:text-foreground'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={autoRemoveBackground}
            onChange={(event) =>
              onAutoRemoveBackgroundChange(event.target.checked)
            }
          />
          <span aria-hidden>✨</span>
          Auto-remove background
        </label>
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
