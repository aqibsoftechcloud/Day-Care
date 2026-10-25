"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getDoctorsUrl } from "@/lib/public/urls";
import type { PublicDoctorListingFilterOptions } from "@/lib/public/doctors";

type DoctorListingFiltersProps = {
  options: PublicDoctorListingFilterOptions;
  initialSearch: string;
  initialCityId: number | null;
  initialDoctorSpecialityId: number | null;
};

const ALL_CITIES_VALUE = "all";
const ALL_SPECIALITIES_VALUE = "all";

/**
 * The global `/doctors` directory's own filter bar — search by name,
 * narrow by city, narrow by speciality. All three are OPTIONAL: clearing
 * every filter returns to the full nationwide listing, never a
 * city-scoped one (there is no "selected city" concept here at all,
 * deliberately — see this page's own doc comment). Client Component for
 * the same reason CitySelector is: only the controlled inputs and
 * `useRouter` navigation need it, the option lists themselves are
 * server-fetched and passed in as props.
 *
 * Submitting navigates to a new `/doctors?...` URL (always resetting
 * `page` back to 1 — a changed filter set is a different result set, not
 * a continuation of the current page), which re-runs the server
 * component's own data fetch — the same "URL is the source of truth"
 * pattern `ListingPagination` already establishes for this exact page.
 */
export function DoctorListingFilters({
  options,
  initialSearch,
  initialCityId,
  initialDoctorSpecialityId,
}: DoctorListingFiltersProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [cityId, setCityId] = useState(initialCityId !== null ? String(initialCityId) : ALL_CITIES_VALUE);
  const [specialityId, setSpecialityId] = useState(
    initialDoctorSpecialityId !== null ? String(initialDoctorSpecialityId) : ALL_SPECIALITIES_VALUE
  );

  function applyFilters(next: { search?: string; cityId?: string; specialityId?: string }) {
    const params = new URLSearchParams();
    const nextSearch = (next.search ?? search).trim();
    const nextCityId = next.cityId ?? cityId;
    const nextSpecialityId = next.specialityId ?? specialityId;

    if (nextSearch) params.set("search", nextSearch);
    if (nextCityId !== ALL_CITIES_VALUE) params.set("city", nextCityId);
    if (nextSpecialityId !== ALL_SPECIALITIES_VALUE) params.set("speciality", nextSpecialityId);

    const qs = params.toString();
    router.push(qs ? `${getDoctorsUrl()}?${qs}` : getDoctorsUrl());
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters({});
      }}
      className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="relative flex min-w-0 flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" aria-hidden="true" />
        <label htmlFor="doctor-search" className="sr-only">
          Search doctors by name
        </label>
        <input
          id="doctor-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search doctors by name..."
          className="h-10 w-full min-w-0 rounded-lg bg-transparent pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--public-accent)"
        />
      </div>

      <div className="flex min-w-0 flex-1 gap-3 sm:flex-initial">
        <div className="min-w-0 flex-1 sm:w-48 sm:flex-initial">
          <label htmlFor="doctor-city-filter" className="sr-only">
            Filter by city
          </label>
          <select
            id="doctor-city-filter"
            value={cityId}
            onChange={(event) => {
              setCityId(event.target.value);
              applyFilters({ cityId: event.target.value });
            }}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-(--public-accent)"
          >
            <option value={ALL_CITIES_VALUE}>All Cities</option>
            {options.cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex-1 sm:w-56 sm:flex-initial">
          <label htmlFor="doctor-speciality-filter" className="sr-only">
            Filter by speciality
          </label>
          <select
            id="doctor-speciality-filter"
            value={specialityId}
            onChange={(event) => {
              setSpecialityId(event.target.value);
              applyFilters({ specialityId: event.target.value });
            }}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-(--public-accent)"
          >
            <option value={ALL_SPECIALITIES_VALUE}>All Specialities</option>
            {options.specialities.map((speciality) => (
              <option key={speciality.id} value={speciality.id}>
                {speciality.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="h-10 shrink-0 rounded-lg bg-(--public-primary) px-5 text-sm font-semibold text-white transition-colors hover:bg-(--public-primary)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
      >
        Search
      </button>
    </form>
  );
}
