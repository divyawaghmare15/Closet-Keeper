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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function clampCrop(next: typeof crop) {
    const width = Math.min(1, Math.max(0.15, next.width));
    const height = Math.min(1, Math.max(0.15, next.height));
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
    <div className="fixed inset-0 z-[70] flex flex-col bg-foreground/95 backdrop-blur-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-white sm:text-xl">
            Crop photo
          </h2>
          <p className="text-xs text-white/60 sm:text-sm">
            Drag to move, corner handle to resize
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="flex size-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Crop area — fills remaining space */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-2 sm:px-6">
        <div className="relative max-h-full max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Crop preview"
            draggable={false}
            className="max-h-[calc(100svh-10rem)] max-w-full select-none rounded-lg object-contain"
            onLoad={(event) => {
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
          />
          <div
            className="absolute inset-0 touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className="absolute cursor-move rounded-sm border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              onPointerDown={(event) => handlePointerDown(event, 'move')}
            >
              {/* Corner handles */}
              {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                <span
                  key={corner}
                  className={`absolute size-3 rounded-full bg-white shadow-md sm:size-3.5 ${
                    corner === 'nw' ? '-left-1.5 -top-1.5' :
                    corner === 'ne' ? '-right-1.5 -top-1.5' :
                    corner === 'sw' ? '-bottom-1.5 -left-1.5' :
                    '-bottom-1.5 -right-1.5'
                  }`}
                  aria-hidden
                />
              ))}
              {/* Resize handle (bottom-right, bigger touch target) */}
              <button
                type="button"
                aria-label="Resize crop"
                className="absolute -bottom-3 -right-3 size-8 cursor-se-resize sm:-bottom-3.5 sm:-right-3.5 sm:size-9"
                onPointerDown={(event) => {
                  event.stopPropagation();
                  handlePointerDown(event, 'resize');
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex shrink-0 gap-3 px-4 py-3 sm:justify-center sm:px-5 sm:py-4">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:max-w-[180px]"
        >
          Skip crop
        </button>
        <button
          type="button"
          onClick={confirm}
          className="flex-1 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 sm:max-w-[180px]"
        >
          Use crop
        </button>
      </div>
    </div>
  );
}
