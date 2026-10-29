import React, { useEffect, useRef, useState } from 'react';

type BootPhase = 'run' | 'exit' | 'done';

/** Set by the router when the user launches the simulator from the landing page. */
let bootReplayRequested = false;

export const requestBootReplay = () => {
  bootReplayRequested = true;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const shouldRunOnMount = () => {
  if (typeof document === 'undefined') return true;
  if (bootReplayRequested) return true;
  return document.documentElement.dataset.boot !== 'done';
};

/**
 * First-paint boot sequence. The wordmark wipes in from the left, wipes out to
 * the right, then wipes in once more before the curtain lifts — the same
 * rhythm as the reference site.
 *
 * It plays on first load and again when the landing page hands off to the
 * simulator; ordinary in-app tab changes never replay it.
 */
export const BootScreen: React.FC = () => {
  const [phase, setPhase] = useState<BootPhase>(() => (shouldRunOnMount() ? 'run' : 'done'));
  const [pct, setPct] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    const replay = bootReplayRequested;
    bootReplayRequested = false;

    if (!replay && root.dataset.boot === 'done') {
      setPhase('done');
      return;
    }

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      root.dataset.boot = 'done';
      document.body.style.removeProperty('overflow');
      setPhase('done');
    };

    if (prefersReducedMotion()) {
      root.dataset.boot = 'done';
      setPhase('done');
      return;
    }

    root.dataset.boot = 'pending';
    document.body.style.setProperty('overflow', 'hidden');

    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      // rAF timestamps can predate startedAt on the first frame; clamp to [0, 1]
      // so the readout never flashes a negative percentage.
      const progress = Math.max(0, Math.min(1, (now - startedAt) / 1750));
      setPct(Math.round(progress * 100));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const exitTimer = window.setTimeout(() => {
      if (!doneRef.current) setPhase('exit');
    }, 1900);
    const doneTimer = window.setTimeout(finish, 2430);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') finish();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener('keydown', onKey);
      document.body.style.removeProperty('overflow');
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`qr-boot qr-boot--${phase}`}
      role="status"
      aria-live="polite"
      aria-label="Loading QuantumRoute"
    >
      <div className="qr-boot-lines" aria-hidden="true" />
      <div className="qr-boot-glow" aria-hidden="true" />

      <div className="qr-boot-inner">
        <span className="qr-boot-eyebrow">Quantum network simulator</span>

        <div className="qr-boot-word" aria-hidden="true">
          <span>Q</span>
          <span>u</span>
          <span>a</span>
          <span>n</span>
          <span>t</span>
          <span>u</span>
          <span>m</span>
        </div>

        <div className="qr-boot-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${pct / 100})` }} />
        </div>

        <div className="qr-boot-meta">
          <span className="qr-boot-pct">{String(pct).padStart(3, '0')}</span>
          <span>Initialising Aer engine</span>
        </div>
      </div>

      <button
        type="button"
        className="qr-boot-skip"
        onClick={() => {
          doneRef.current = true;
          document.documentElement.dataset.boot = 'done';
          document.body.style.removeProperty('overflow');
          setPhase('done');
        }}
      >
        Skip intro
      </button>
    </div>
  );
};

export default BootScreen;
