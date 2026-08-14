'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { MiscPhotoPicker } from '@/components/misc/MiscPhotoPicker';
import { miscCoverStyle } from '@/lib/miscCover';
import type { MiscCard, MiscPiece } from '@/types';

function emptyCard(title = ''): MiscCard {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    coverImageUrl: '',
    notes: '',
    pieces: [],
    createdDate: now,
    updatedDate: now,
  };
}

function pieceFromPhotos(cardTitle: string, urls: string[], startIndex: number) {
  const base = cardTitle.replace(/\s+I have$/i, '').trim() || 'Item';
  return urls.map((imageUrl, index) => ({
    id: crypto.randomUUID(),
    title: `${base} ${startIndex + index + 1}`,
    imageUrl,
    notes: '',
    quantity: 1,
  }));
}

export function MiscCardSheet({
  card,
  isNew = !card,
  onClose,
  onSave,
  onDelete,
}: {
  card: MiscCard | null;
  isNew?: boolean;
  onClose: () => void;
  onSave: (card: MiscCard) => Promise<MiscCard | void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<MiscCard>(() => card ?? emptyCard());
  const [view, setView] = useState<'create' | 'gallery' | 'add'>(
    isNew ? 'create' : 'gallery',
  );
  const [pending, setPending] = useState<MiscPiece[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setDraft(card ?? emptyCard(card?.title ?? ''));
    setView(isNew ? 'create' : 'gallery');
    setPending([]);
    setError('');
    setSelectedId(null);
  }, [card, isNew]);

  const cover = miscCoverStyle(draft.title, draft.id);
  const count = draft.pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const selected = draft.pieces.find((piece) => piece.id === selectedId);

  async function persist(next: MiscCard) {
    setSaving(true);
    setError('');
    try {
      const saved = await onSave({
        ...next,
        title: next.title.trim(),
        notes: next.notes.trim(),
        coverImageUrl: '',
        updatedDate: new Date().toISOString(),
      });
      if (saved) setDraft(saved);
      else setDraft(next);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!draft.title.trim()) {
      setError('Give this card a name, like “Sandals I have”.');
      return;
    }
    const ok = await persist(draft);
    if (ok) setView('gallery');
  }

  async function handleAddPending() {
    if (pending.length === 0) {
      setError('Add at least one photo.');
      return;
    }
    const next = { ...draft, pieces: [...draft.pieces, ...pending] };
    const ok = await persist(next);
    if (ok) {
      setPending([]);
      setView('gallery');
    }
  }

  async function handleRemovePiece(id: string) {
    const next = {
      ...draft,
      pieces: draft.pieces.filter((piece) => piece.id !== id),
    };
    const ok = await persist(next);
    if (ok) setSelectedId(null);
  }

  async function handleUpdatePiece(id: string, patch: Partial<MiscPiece>) {
    const next = {
      ...draft,
      pieces: draft.pieces.map((piece) =>
        piece.id === id ? { ...piece, ...patch } : piece,
      ),
    };
    setDraft(next);
    await persist(next);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="misc-sheet-title"
        className="animate-modal-in relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.75rem] bg-surface-elevated shadow-xl sm:rounded-[1.75rem]"
      >
        {view === 'create' ? (
          <>
            <SheetHeader
              title="New extras card"
              subtitle="Name the card first. You’ll add sandals, caps, and photos next."
              onClose={onClose}
            />
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Card name</span>
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Sandals I have"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Notes (optional)</span>
                <textarea
                  value={draft.notes}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  rows={2}
                  placeholder="Anything you want to remember about this group"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </label>
              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </div>
            <SheetFooter>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ring-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleCreate()}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? 'Creating…' : 'Create card'}
              </button>
            </SheetFooter>
          </>
        ) : view === 'add' ? (
          <>
            <SheetHeader
              title={`Add to ${draft.title || 'this card'}`}
              subtitle="Pick photos, name them, then save. They’ll show with the rest."
              onClose={onClose}
              extra={
                <button
                  type="button"
                  onClick={() => {
                    setPending([]);
                    setError('');
                    setView('gallery');
                  }}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft"
                >
                  Back
                </button>
              }
            />
            <div className="space-y-4 overflow-y-auto px-5 py-5">
              <MiscPhotoPicker
                label={pending.length ? 'Add more photos' : 'Choose photos'}
                disabled={saving}
                onPhotos={(urls) => {
                  setError('');
                  setPending((prev) => [
                    ...prev,
                    ...pieceFromPhotos(
                      draft.title,
                      urls,
                      draft.pieces.length + prev.length,
                    ),
                  ]);
                }}
              />

              {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-12 text-center text-sm text-muted">
                  No photos selected yet. Tap Choose photos to add what you
                  have.
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {pending.map((piece) => (
                    <li
                      key={piece.id}
                      className="overflow-hidden rounded-2xl border border-border/60 bg-surface"
                    >
                      <div className="aspect-square bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={piece.imageUrl}
                          alt={piece.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="space-y-2 p-2.5">
                        <input
                          value={piece.title}
                          onChange={(event) =>
                            setPending((prev) =>
                              prev.map((entry) =>
                                entry.id === piece.id
                                  ? { ...entry, title: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          className="w-full rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-sm"
                        />
                        <input
                          value={piece.notes}
                          onChange={(event) =>
                            setPending((prev) =>
                              prev.map((entry) =>
                                entry.id === piece.id
                                  ? { ...entry, notes: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          placeholder="Color, size…"
                          className="w-full rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPending((prev) =>
                              prev.filter((entry) => entry.id !== piece.id),
                            )
                          }
                          className="text-xs font-semibold text-muted hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <p className="text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </div>
            <SheetFooter>
              <button
                type="button"
                onClick={() => {
                  setPending([]);
                  setView('gallery');
                }}
                className="rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ring-border"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || pending.length === 0}
                onClick={() => void handleAddPending()}
                className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving
                  ? 'Saving…'
                  : `Save ${pending.length || ''} item${
                      pending.length === 1 ? '' : 's'
                    }`}
              </button>
            </SheetFooter>
          </>
        ) : (
          <>
            <div
              className="border-b border-border/60 px-5 py-4"
              style={{
                background: `linear-gradient(120deg, ${cover.from}, ${cover.to})`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-foreground/55 uppercase">
                    Extras
                  </p>
                  <h2
                    id="misc-sheet-title"
                    className="mt-1 font-display text-2xl font-semibold tracking-tight"
                  >
                    {draft.title}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/70">
                    {count === 0
                      ? 'Nothing added yet'
                      : `${count} ${count === 1 ? 'piece' : 'pieces'} inside`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-foreground"
                >
                  Close
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPending([]);
                  setError('');
                  setView('add');
                }}
                className="mt-4 w-full rounded-2xl bg-accent py-3 text-sm font-semibold text-white shadow-sm"
              >
                Add
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5">
              {draft.notes && (
                <p className="mb-4 text-sm text-muted">{draft.notes}</p>
              )}

              {draft.pieces.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-14 text-center">
                  <p className="font-display text-lg font-semibold">
                    This card is empty
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                    Tap Add to put every sandal, cap, or extra you have in one
                    place.
                  </p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {draft.pieces.map((piece) => (
                    <li key={piece.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(piece.id)}
                        className="w-full overflow-hidden rounded-2xl border border-border/60 bg-white text-left"
                      >
                        <div className="aspect-square bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={piece.imageUrl}
                            alt={piece.title}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="space-y-0.5 px-2.5 py-2">
                          <p className="truncate text-sm font-semibold">
                            {piece.title}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {piece.notes ||
                              (piece.quantity > 1
                                ? `Qty ${piece.quantity}`
                                : 'Tap for details')}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              {onDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void onDelete(draft.id)}
                  className="mt-6 text-sm font-semibold text-muted hover:text-red-700 disabled:opacity-60"
                >
                  Delete this card
                </button>
              )}
            </div>

            {selected && (
              <div className="absolute inset-0 z-10 flex items-end bg-foreground/40 sm:items-center sm:justify-center sm:p-8">
                <div className="w-full rounded-t-[1.5rem] bg-surface-elevated p-5 sm:max-w-md sm:rounded-[1.5rem]">
                  <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.imageUrl}
                      alt={selected.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <input
                    value={selected.title}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        pieces: prev.pieces.map((piece) =>
                          piece.id === selected.id
                            ? { ...piece, title: event.target.value }
                            : piece,
                        ),
                      }))
                    }
                    onBlur={() =>
                      void handleUpdatePiece(selected.id, {
                        title: selected.title,
                      })
                    }
                    className="mt-3 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-semibold"
                  />
                  <input
                    value={selected.notes}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        pieces: prev.pieces.map((piece) =>
                          piece.id === selected.id
                            ? { ...piece, notes: event.target.value }
                            : piece,
                        ),
                      }))
                    }
                    onBlur={() =>
                      void handleUpdatePiece(selected.id, {
                        notes: selected.notes,
                      })
                    }
                    placeholder="Color, size, note…"
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                  />
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRemovePiece(selected.id)}
                      className="text-sm font-semibold text-red-700"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SheetHeader({
  title,
  subtitle,
  onClose,
  extra,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {extra}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-accent-soft"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function SheetFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/60 px-5 py-4">
      {children}
    </div>
  );
}
