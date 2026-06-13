"use client";

// Animated overall-score ring. 150px SVG, 8px gradient stroke (--grad-a →
// --grad-c). On mount the number and the arc count up 0 → score over ~1.5s via
// requestAnimationFrame. Honors prefers-reduced-motion (jumps to the final
// value). The value itself is static (Stage 2 output) — it only ever animates
// to the same number.

import { useEffect, useRef, useState } from "react";

const SIZE = 150;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DURATION = 1500;

interface ScoreRingProps {
  score: number;
}

export default function ScoreRing({ score }: ScoreRingProps) {
  const target = Math.max(0, Math.min(100, Math.round(score)));
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced || target === 0) {
      setDisplay(target);
      return;
    }

    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / DURATION, 1);
      // easeOutCubic for a natural settle.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target]);

  const offset = CIRCUMFERENCE * (1 - display / 100);

  return (
    <div
      role="img"
      aria-label={`Overall score: ${target} out of 100`}
      className="relative"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--grad-a)" />
            <stop offset="100%" stopColor="var(--grad-c)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        {/* Progress arc — starts at 12 o'clock */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#scoreRingGrad)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-heading text-[21px] font-bold text-[var(--text)]"
      >
        {display}
      </span>
    </div>
  );
}
