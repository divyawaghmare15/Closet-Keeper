'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { compressDataUrl, fileToDataUrl } from '@/lib/imageProcess';

export function MiscPhotoPicker({
  label = 'Add photos',
  multiple = true,
  disabled = false,
  onPhotos,
}: {
  label?: string;
  multiple?: boolean;
  disabled?: boolean;
  onPhotos: (dataUrls: string[]) => void | Promise<void>;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    const files = fileList ? Array.from(fileList) : [];
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (!images.length) return;

    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of images) {
        const raw = await fileToDataUrl(file);
        urls.push(await compressDataUrl(raw));
      }
      await onPhotos(urls);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => cameraRef.current?.click()}
        className="rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Take photo'}
      </button>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => galleryRef.current?.click()}
        className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold ring-1 ring-border disabled:opacity-60"
      >
        {busy ? 'Adding…' : label}
      </button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          void handleFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}
