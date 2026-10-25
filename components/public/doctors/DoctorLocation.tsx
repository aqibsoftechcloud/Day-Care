import { MapPin, Navigation } from "lucide-react";
import { SectionHeader } from "@/components/public/shared/SectionHeader";

type DoctorLocationProps = {
  /** `doctors.location_map` — an admin-entered map link, same convention/guard as `HospitalHero.tsx`'s `locationMap`. */
  locationMap: string | null;
  /** `doctors.latitude`/`doctors.longitude` — real stored coordinates, as strings (see `lib/public/doctors.ts`). */
  latitude: string | null;
  longitude: string | null;
  /** `doctors.location_id` → `locations.area` — shown as supplementary text next to the link, never invented when absent. */
  locationArea: string | null;
  cityName: string;
};

/** A usable, absolute http(s) link — guards `location_map` (free-text, unvalidated at write time) before it's used as an href, same guard `HospitalHero.tsx` uses for its own `locationMap` field. */
function isUsableHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Exported so `DoctorDetailPage.tsx` can decide whether to show the
 * "Location" in-page nav item using the EXACT same condition this
 * component uses to decide whether to render — rather than a looser
 * approximation that could show a nav link pointing at a section that
 * doesn't actually render.
 */
export function resolveDoctorDirectionsHref(
  locationMap: string | null,
  latitude: string | null,
  longitude: string | null
): string | null {
  if (locationMap && isUsableHttpUrl(locationMap)) {
    return locationMap;
  }
  if (latitude && longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`;
  }
  return null;
}

/**
 * "Location" — these coordinates/map link belong directly to the doctor's
 * own `doctors` row (`location_map`/`latitude`/`longitude`), not to any
 * associated hospital — a separate, independently-entered set of fields,
 * confirmed by inspecting the schema before wiring this in. Never
 * borrowed from `PublicDoctorHospital` (each associated hospital already
 * has its own "View Hospital" link and its own location on its own page).
 *
 * "Get Directions" prefers the admin-configured `location_map` link
 * (precise — a specific pin/place the admin picked) and only falls back
 * to a coordinate-based Google Maps search when there's no usable stored
 * map link. No third-party map embed (no API key requirement introduced)
 * — same "link out, don't embed" approach `HospitalHero.tsx` uses.
 * Hidden entirely when neither a usable map link nor coordinates exist —
 * never a fabricated or placeholder destination.
 */
export function DoctorLocation({ locationMap, latitude, longitude, locationArea, cityName }: DoctorLocationProps) {
  const directionsHref = resolveDoctorDirectionsHref(locationMap, latitude, longitude);

  if (!directionsHref) return null;

  return (
    <section
      id="doctor-location-heading"
      aria-labelledby="doctor-location-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="Visit" title="Location" headingId="doctor-location-title" />

      <div className="mt-6 flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-5">
        <p className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin className="mt-0.5 size-4 shrink-0 text-(--public-primary)/50" aria-hidden="true" />
          {locationArea ? `${locationArea}, ${cityName}` : cityName}
        </p>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-(--public-primary) transition-colors hover:border-(--public-accent)/40 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
        >
          <Navigation className="size-4" aria-hidden="true" />
          Get Directions
        </a>
      </div>
    </section>
  );
}
