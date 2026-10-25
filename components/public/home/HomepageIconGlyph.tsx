import Image from "next/image";
import type { RenderableIcon } from "@/lib/public/homepage-icons";
import { cn } from "@/lib/utils";

type HomepageIconGlyphProps = {
  icon: RenderableIcon;
  /** The exact size classes the call site previously passed straight to a `<Icon />` (e.g. `"size-5 sm:size-6"`) — applied to whichever element actually renders, so container dimensions/layout are byte-identical to before this feature existed. */
  className?: string;
};

/**
 * Renders ONE resolved homepage icon, whichever type it is — a Lucide
 * component (unchanged, same `aria-hidden` decorative-icon convention
 * every icon in these three sections already used) or a custom uploaded
 * asset (`next/image`, `fill` + `object-contain` so it's never cropped
 * or stretched regardless of its real aspect ratio, inside a `relative`
 * wrapper sized to the exact same classes). Every icon in Hero
 * Statistics / Why Choose Us / Our Locations sits directly beside real
 * visible text (a count, a card title, a city name) that already
 * conveys the icon's meaning — same reasoning the pre-existing Lucide
 * icons already used for `aria-hidden="true"` — so a custom image is
 * decorative here too, not given redundant alt text.
 *
 * Uploaded images are intentionally never recolored. An earlier version
 * of this component used CSS `mask-image` to repaint a custom icon with
 * the Website Appearance "Icon Color" token, but that relied on
 * `--color-icon-foreground` resolving at paint time with no static CSS
 * fallback anywhere in the stylesheet (unlike `--public-primary`, which
 * has one in app/globals.css) — if that variable wasn't reliably defined
 * when the mask painted, the icon silently rendered as fully transparent
 * instead of falling back to anything visible. Uploaded PNGs now keep
 * whatever colors they were saved with; admins upload icons with their
 * final colors already applied.
 */
export function HomepageIconGlyph({ icon, className }: HomepageIconGlyphProps) {
  if (icon.type === "custom") {
    return (
      <span className={cn("relative block", className)} aria-hidden="true">
        <Image src={icon.src} alt="" fill sizes="48px" className="object-contain" />
      </span>
    );
  }

  const Icon = icon.Icon;
  return <Icon className={className} aria-hidden="true" />;
}
