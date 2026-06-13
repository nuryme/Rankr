// Reusable step header: eyebrow + title + subtitle. Typography per
// DESIGN_QUICK_REF (mono eyebrow, Space Grotesk title, DM Sans subtitle).

export interface StepHeadProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export default function StepHead({ eyebrow, title, subtitle }: StepHeadProps) {
  return (
    <header className="mb-[var(--gap-xl)]">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-[clamp(28px,4vw,32px)] font-bold tracking-[-0.02em] text-[var(--text)]">
        {title}
      </h2>
      <p className="mt-2 text-[15px] leading-[1.55] text-[var(--muted)]">
        {subtitle}
      </p>
    </header>
  );
}
