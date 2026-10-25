"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import {
  Building2,
  CheckCircle2,
  HeartHandshake,
  Hospital,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { PublicTreatmentJourney, PublicTreatmentJourneyStep, PublicTreatmentWhyChooseUsIconKey } from "@/lib/public/treatments";

/** Same controlled icon allowlist as Why Choose Us/Final CTA — own local copy per this codebase's established convention. */
const ICON_MAP: Record<PublicTreatmentWhyChooseUsIconKey, LucideIcon> = {
  stethoscope: Stethoscope,
  building: Building2,
  heart: HeartHandshake,
  message: MessageCircle,
  shield: ShieldCheck,
  doctor: UsersRound,
  hospital: Hospital,
  check: CheckCircle2,
};

function resolveIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey as PublicTreatmentWhyChooseUsIconKey] ?? Sparkles;
}

/** This project's actual public tokens (`--public-accent`/`--public-primary`, app/globals.css) as literal color strings — `useTransform`'s callback returns a plain CSS color string per frame (a threshold step function, not a gradient), so a `var(...)` reference works fine here (no numeric color interpolation is happening), but the glow's `rgba()` needs a real value, hence this literal copy of the accent hex. */
const ACCENT = "var(--public-accent)";
const PRIMARY = "var(--public-primary)";
const ACCENT_GLOW = "0 4px 14px 0 rgba(255, 114, 0, 0.35)";
const DISCHARGE_COLOR = "#10b981"; // emerald-500 — same distinct "completed" color used elsewhere on this page

type RailMetrics = { top: number; height: number };

/**
 * PHASE 1 (UI ONLY): fed `DEMO_JOURNEY`. Upgraded interaction, adapted
 * from a supplied React/Motion reference implementation (per-step color
 * transforms driven by a shared `scrollYProgress`) — the reference's
 * markup/classnames/assets were not copied, only its interaction
 * technique, rebuilt with this project's own tokens, icon allowlist, and
 * layout conventions (wide `public-container`, not a narrow `max-w-4xl`).
 *
 * Architecture note (rules-of-hooks): each step's `useTransform` call
 * lives in its own child component (`TreatmentJourneyStepItem`), invoked
 * once per step via `.map()` at the JSX level — this is NOT a hook
 * called inside a loop/callback (that would break the rules of hooks);
 * it's a component instantiated multiple times, each unconditionally
 * calling its own hooks at its own top level, same pattern the supplied
 * reference itself uses (`TimelineStepItem`).
 *
 * Step marker thresholds are measured from the real DOM (not assumed
 * evenly spaced via `index / (length - 1)` like the reference) so the
 * fill and each step's activation can't visually desync even when steps
 * have different content heights (this project's own improvement over
 * the reference).
 *
 * Fully dynamic step count — reads `journey.steps` from
 * `treatment_sections`' own `journey` row content; the scroll animation
 * (measured thresholds, continuous fill, per-step activation, distinct
 * discharge state on the LAST step) works identically regardless of how
 * many steps an admin has configured.
 */
export function TreatmentJourney({ treatmentName, journey }: { treatmentName: string; journey: PublicTreatmentJourney }) {
  const steps = journey?.steps ?? [];

  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [rail, setRail] = useState<RailMetrics>({ top: 0, height: 0 });
  const [thresholds, setThresholds] = useState<number[]>([]);

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackRect = track.getBoundingClientRect();
    const centers = markerRefs.current.map((el) => {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2 - trackRect.top;
    });
    if (centers.length === 0) return;

    const top = centers[0];
    const bottom = centers[centers.length - 1];
    const height = Math.max(bottom - top, 1);
    setRail({ top, height });
    setThresholds(centers.map((center) => (center - top) / height));
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, steps.length]);

  // When there are no steps, this component renders nothing below (see
  // the early return) — `trackRef` never gets attached to a DOM node in
  // that case, so `target` is omitted rather than pointed at a ref that
  // will never hydrate (avoids Motion's "Target ref is defined but not
  // hydrated" warning). The resulting `scrollYProgress` is simply never
  // read when there are no steps.
  const { scrollYProgress } = useScroll(steps.length > 0 ? { target: trackRef, offset: ["start center", "end center"] } : {});

  if (steps.length === 0) return null;

  const heading = journey?.heading || `What Happens During ${treatmentName}?`;

  return (
    <section aria-labelledby="treatment-journey-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-journey-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        {heading}
      </h2>

      <div ref={trackRef} className="relative mt-8 max-w-240 sm:mt-10">
        {rail.height > 0 && (
          <div className="pointer-events-none absolute left-7 w-px" style={{ top: rail.top, height: rail.height }} aria-hidden="true">
            <div className="absolute inset-0 bg-slate-200" />
            <motion.div
              className="absolute inset-x-0 top-0 h-full origin-top bg-(--public-accent)"
              style={{ scaleY: prefersReducedMotion ? 1 : scrollYProgress }}
            />
          </div>
        )}

        <ol className="relative flex flex-col gap-10">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const Icon = resolveIcon(step.iconKey);
            return (
              <TreatmentJourneyStepItem
                key={step.title}
                step={step}
                isLast={isLast}
                icon={isLast ? <CheckCircle2 className="size-6" aria-hidden="true" /> : <Icon className="size-6" aria-hidden="true" />}
                threshold={thresholds[index] ?? index / Math.max(steps.length - 1, 1)}
                scrollYProgress={scrollYProgress}
                prefersReducedMotion={Boolean(prefersReducedMotion)}
                markerRef={(el) => {
                  markerRefs.current[index] = el;
                }}
              />
            );
          })}
        </ol>
      </div>
    </section>
  );
}

type TreatmentJourneyStepItemProps = {
  step: PublicTreatmentJourneyStep;
  isLast: boolean;
  /** The already-resolved icon element (`<Icon className=... />`), rendered by the parent's `.map()` — resolving/rendering a dynamic icon component from inside this component's own body would trip the "components must not be created during render" React Compiler lint rule (a plain function-component-in-a-map, like the identical pattern in `SpecialityWhyChooseUs.tsx`, doesn't trigger it, but a properly named component like this one does get that stricter scrutiny). */
  icon: ReactNode;
  threshold: number;
  scrollYProgress: MotionValue<number>;
  prefersReducedMotion: boolean;
  markerRef: (el: HTMLDivElement | null) => void;
};

/**
 * One step's icon marker + content. The marker's background/border/icon
 * color/glow are bound directly to `scrollYProgress` via `useTransform` —
 * a per-frame style update outside React's render cycle (smooth, no
 * per-step `setState`), exactly the technique the supplied reference
 * uses. Each callback is a threshold step function (< threshold vs >=
 * threshold), not a continuous gradient, so plain CSS color strings
 * (including this project's own `var(--public-accent)`/`var(--public-primary)`
 * tokens) work as the returned values without needing Motion's numeric
 * color interpolation.
 */
function TreatmentJourneyStepItem({
  step,
  isLast,
  icon,
  threshold,
  scrollYProgress,
  prefersReducedMotion,
  markerRef,
}: TreatmentJourneyStepItemProps) {
  const background = useTransform(scrollYProgress, (v) => {
    if (prefersReducedMotion) return isLast ? "#ffffff" : ACCENT;
    if (v < threshold) return "#ffffff";
    return isLast ? "#ffffff" : ACCENT;
  });
  const borderColor = useTransform(scrollYProgress, (v) => {
    if (prefersReducedMotion) return isLast ? DISCHARGE_COLOR : ACCENT;
    if (v < threshold) return "#e2e8f0"; // slate-200
    return isLast ? DISCHARGE_COLOR : ACCENT;
  });
  const iconColor = useTransform(scrollYProgress, (v) => {
    if (prefersReducedMotion) return isLast ? DISCHARGE_COLOR : "#ffffff";
    if (v < threshold) return PRIMARY;
    return isLast ? DISCHARGE_COLOR : "#ffffff";
  });
  const boxShadow = useTransform(scrollYProgress, (v) => {
    const reached = prefersReducedMotion || v >= threshold;
    return reached && !isLast ? ACCENT_GLOW : "none";
  });
  const contentOpacity = useTransform(scrollYProgress, (v) => (prefersReducedMotion || v >= threshold - 0.04 ? 1 : 0.6));

  return (
    <li className="relative flex gap-6">
      <motion.div
        ref={markerRef}
        className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full border-2"
        style={{ backgroundColor: background, borderColor, color: iconColor, boxShadow }}
      >
        {icon}
      </motion.div>

      <motion.div className="flex-1 pt-2" style={{ opacity: contentOpacity }}>
        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLast ? "bg-emerald-50 text-emerald-600" : "bg-(--public-primary)/8 text-(--public-primary)"
          }`}
        >
          {step.duration}
        </span>
        <h3 className="mt-2 text-base font-bold text-slate-900 sm:text-lg">{step.title}</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {step.points.map((point) => (
            <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-(--public-accent)" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      </motion.div>
    </li>
  );
}
