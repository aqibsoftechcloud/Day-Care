import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  /** Set on the `<h2>` and referenced by the section's own `aria-labelledby` — the caller still owns the `<section>` element. */
  headingId: string;
  description?: ReactNode;
  /** `"left"` (default) pairs the eyebrow/heading/description block with an optional trailing `action` in a row that stacks on mobile; `"center"` drops the row and centers the block alone (no `action` slot — none of the centered sections use one today). */
  align?: "left" | "center";
  /** Smaller heading and tighter spacing for dense pages (Doctor Detail). Defaults to false, so every existing section is unchanged. */
  compact?: boolean;
  /** Rendered at the end of the row in the `"left"` layout only (e.g. a "View All" link or badge next to the heading). */
  action?: ReactNode;
};

/**
 * The eyebrow + heading + description block repeated, byte-for-byte
 * identical, at the top of Specialized Care, Hospitals-adjacent sections
 * (Doctors, Reviews, Blogs), and FAQ before this extraction — one shared
 * component now instead of five independently-maintained copies that
 * could silently drift. Hospitals' own header isn't built from this: its
 * split navy/carousel layout (white heading text, a bullet list, a
 * primary CTA button all inside the same left column) is a genuinely
 * different composition, not a variant of this eyebrow/heading/
 * description/action shape.
 */
export function SectionHeader({ eyebrow, title, headingId, description, align = "left", compact = false, action }: SectionHeaderProps) {
  const heading = (
    <>
      <span className="text-xs font-bold tracking-[0.2em] text-(--public-accent) uppercase">{eyebrow}</span>
      <h2
        id={headingId}
        className={compact ? "mt-1.5 text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl" : "mt-3 text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl"}
      >
        {title}
      </h2>
      {description && <p className={compact ? "mt-2 text-sm text-slate-600 sm:text-base" : "mt-4 text-base text-slate-600 sm:text-lg"}>{description}</p>}
    </>
  );

  if (align === "center") {
    return <div className="mx-auto max-w-2xl text-center">{heading}</div>;
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">{heading}</div>
      {action}
    </div>
  );
}
