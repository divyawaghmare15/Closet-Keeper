'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  {
    title: 'Add your clothes',
    desc: 'Take a photo or pick from gallery. AI will auto-tag category, color, and more.',
    icon: '📸',
  },
  {
    title: 'Browse your closet',
    desc: 'Filter by category, occasion, or season. See everything at a glance.',
    icon: '👗',
  },
  {
    title: 'Get outfit ideas',
    desc: 'AI suggests outfits based on what you own. Save your favorites!',
    icon: '✨',
  },
];

const LS_KEY = 'ck_onboarding_done';

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    localStorage.setItem(LS_KEY, '1');
    setShow(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.5rem] bg-surface-elevated p-6 shadow-xl">
        {/* Progress dots */}
        <div className="mb-5 flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition ${
                i === step ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center">
          <span className="text-4xl">{current.icon}</span>
          <h2 className="mt-3 font-display text-xl font-semibold">{current.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{current.desc}</p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 cursor-pointer rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-muted ring-1 ring-border transition hover:text-foreground"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="flex-1 cursor-pointer rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {step < STEPS.length - 1 ? 'Next' : 'Get started'}
          </button>
        </div>
      </div>
    </div>
  );
}
