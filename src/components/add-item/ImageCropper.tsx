'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';

export function ImageCropper({
  imageUrl,
  onCancel,
  onSkip,
  onConfirm,
}: {
  imageUrl: string;
  onCancel: () => void;
  onSkip: () => void;
  onConfirm: (crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  const dragRef = useRef<{
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    origin: typeof crop;
  } | null>(null);

  useEffect(() => {
    setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
  }, [imageUrl]);

  function clampCrop(next: typeof crop) {
    const width = Math.min(1, Math.max(0.2, next.width));
    const height = Math.min(1, Math.max(0.2, next.height));
    const x = Math.min(1 - width, Math.max(0, next.x));
    const y = Math.min(1 - height, Math.max(0, next.y));
    return { x, y, width, height };
  }

  function handlePointerDown(
    event: PointerEvent,
    mode: 'move' | 'resize',
  ) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      origin: crop,
    };
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragRef.current || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const dx = (event.clientX - dragRef.current.startX) / rect.width;
    const dy = (event.clientY - dragRef.current.startY) / rect.height;
    const { origin, mode } = dragRef.current;

    if (mode === 'move') {
      setCrop(clampCrop({ ...origin, x: origin.x + dx, y: origin.y + dy }));
    } else {
      setCrop(
        clampCrop({
          ...origin,
          width: origin.width + dx,
          height: origin.height + dy,
        }),
      );
    }
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  function confirm() {
    if (!natural.width || !natural.height) return;
    onConfirm({
      x: crop.x * natural.width,
      y: crop.y * natural.height,
      width: crop.width * natural.width,
      height: crop.height * natural.height,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/45 p-3 sm:items-center sm:p-4">
      <div className="animate-modal-in max-h-[92svh] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-[1.5rem] bg-surface-elevated shadow-xl sm:rounded-[1.75rem]">
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="font-display text-xl font-semibold">Crop photo</h2>
          <p className="text-sm text-muted">Drag to frame the garment.</p>
        </div>

        <div className="relative bg-foreground/5 p-4">
          <div className="relative mx-auto max-h-[55vh] overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="mx-auto max-h-[55vh] w-full object-contain"
              onLoad={(event) => {
                setNatural({
                  width: event.currentTarget.naturalWidth,
                  height: event.currentTarget.naturalHeight,
                });
              }}
            />
            <div
              className="absolute inset-0"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div
                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgba(18,32,44,0.45)]"
                style={{
                  left: `${crop.x * 100}%`,
                  top: `${crop.y * 100}%`,
                  width: `${crop.width * 100}%`,
                  height: `${crop.height * 100}%`,
                }}
                onPointerDown={(event) => handlePointerDown(event, 'move')}
              >
                <button
                  type="button"
                  aria-label="Resize crop"
                  className="absolute right-0 bottom-0 size-5 translate-x-1/2 translate-y-1/2 rounded-full bg-accent"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    handlePointerDown(event, 'resize');
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ring-border"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ring-border"
          >
            Skip crop
          </button>
          <button
            type="button"
            onClick={confirm}
            className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white"
          >
            Use crop
          </button>
        </div>
      </div>
    </div>
  );
}
