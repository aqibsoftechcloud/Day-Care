import Link from "next/link";
import { ArrowRight, Building2, SearchX, Stethoscope, Syringe, UserRound, type LucideIcon } from "lucide-react";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";
import { MIN_SEARCH_LENGTH, type SearchEntityType, type SearchResponse } from "@/lib/public/search";
import { getCityUrl, getSearchUrl } from "@/lib/public/urls";

const GROUPS: { key: keyof SearchResponse["groups"]; label: string; type: SearchEntityType; icon: LucideIcon }[] = [
  { key: "doctors", label: "Doctors", type: "doctor", icon: UserRound },
  { key: "treatments", label: "Treatments", type: "treatment", icon: Syringe },
  { key: "specialities", label: "Specialities", type: "speciality", icon: Stethoscope },
  { key: "hospitals", label: "Hospitals", type: "hospital", icon: Building2 },
];

/**
 * `/search` — the full results page behind the header search: the submitted
 * query, then matches grouped by type (real, public records only), each row
 * linking to that entity's existing public page. Server-rendered from the
 * URL (`?q=&city=`), so it is shareable and refresh-safe. A query shorter
 * than the minimum, or one with no match, shows a clear empty state.
 */
export function SearchResultsPage({ results, rawQuery }: { results: SearchResponse; rawQuery: string }) {
  const { query, city, groups, total } = results;
  const tooShort = query.length < MIN_SEARCH_LENGTH;

  return (
    <div className="bg-slate-50">
      <div className="public-container pb-12 pt-6 sm:pb-16 sm:pt-8">
        <PublicBreadcrumb
          items={[
            { label: "Home", href: "/" },
            ...(city ? [{ label: city.name, href: getCityUrl(city.seoUrl) }] : []),
            { label: "Search" },
          ]}
        />

        <header className="mt-3">
          <h1 className="text-2xl font-black tracking-tight text-(--public-primary) sm:text-3xl">
            {query ? <>Search results for &ldquo;{query}&rdquo;</> : "Search"}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500" role="status">
            {tooShort
              ? `Enter at least ${MIN_SEARCH_LENGTH} characters to search doctors, treatments, specialities and hospitals.`
              : total === 0
                ? "No matches found."
                : `${total} result${total === 1 ? "" : "s"}${city ? ` · ${city.name} results first, plus nationwide treatments and specialities` : " across all cities"}`}
          </p>
        </header>

        {!tooShort && total === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-(--public-radius-card) border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
              <SearchX className="size-6" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-bold break-words text-(--public-primary)">No results for &ldquo;{rawQuery.trim() || query}&rdquo;</h2>
            <p className="max-w-md text-sm text-slate-500">
              Check the spelling, try a shorter or more general word, or browse our{" "}
              <Link href="/specialities" className="font-semibold text-(--public-accent) hover:underline">
                specialities
              </Link>
              ,{" "}
              <Link href="/treatments" className="font-semibold text-(--public-accent) hover:underline">
                treatments
              </Link>{" "}
              and{" "}
              <Link href="/doctors" className="font-semibold text-(--public-accent) hover:underline">
                doctors
              </Link>
              .
            </p>
            {city && (
              <Link href={getSearchUrl(query)} className="text-sm font-semibold text-(--public-primary) hover:text-(--public-accent) hover:underline">
                Search all cities for &ldquo;{query}&rdquo;
              </Link>
            )}
          </div>
        )}

        {total > 0 && (
          <div className="mt-8 flex flex-col gap-8">
            {GROUPS.map((group) => {
              const items = groups[group.key];
              if (items.length === 0) return null;
              return (
                <section key={group.key} aria-labelledby={`search-${group.key}`}>
                  <h2 id={`search-${group.key}`} className="flex items-center gap-2 text-base font-bold text-(--public-primary)">
                    <group.icon className="size-4.5 text-(--public-accent)" aria-hidden="true" />
                    {group.label}
                    <span className="text-sm font-normal text-slate-400">({items.length})</span>
                  </h2>
                  <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          className="group flex h-full items-center gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-4 transition-colors hover:border-(--public-accent)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                            <group.icon className="size-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-sm font-bold break-words text-slate-900">{item.title}</span>
                            {item.subtitle && <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>}
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-(--public-accent)" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
