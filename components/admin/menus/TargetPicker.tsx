"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "cn";
import { listSpecialities } from "@/lib/api/specialities";
import { listTreatments } from "@/lib/api/treatments";
import { listHospitals } from "@/lib/api/hospitals";
import { listDoctors } from "@/lib/api/doctors";
import { listDoctorSpecialities } from "@/lib/api/doctor-specialities";
import { listBlogs } from "@/lib/api/blogs";
import { listBlogCategories } from "@/lib/api/blog-categories";
import { listPages } from "@/lib/api/pages";
import { listGlobalSpecialities } from "@/lib/api/global-specialities";
import { CITY_SCOPED_MENU_TARGET_TYPES } from "@/types/menu";
import type { MenuTargetType } from "@/types/menu";

type TargetOption = { id: number; label: string; status: string };

/**
 * One entry per entity `menus.target_type` can point at. Each queryFn
 * reuses the existing admin `listX()` API client for that module — the
 * same data already backing that module's own management page — so the
 * picker never introduces a second source of truth for entity names.
 *
 * City-scoped types (see CITY_SCOPED_MENU_TARGET_TYPES) receive the
 * currently-selected menu city and filter their options to it, so an
 * admin physically cannot pick a target that belongs to a different city
 * than the menu item itself — doctor_speciality/blog_category are
 * nationwide taxonomies with no `city_id`, so their queryFn ignores it.
 */
const TARGET_CONFIG: Record<
  Exclude<MenuTargetType, "none" | "listing">,
  { queryKey: string; queryFn: (cityId: number | null) => Promise<TargetOption[]> }
> = {
  speciality: {
    queryKey: "menu-target-specialities",
    queryFn: async (cityId) => {
      const { specialities } = await listSpecialities(cityId !== null ? { city_id: cityId } : undefined);
      return specialities.map((s) => ({
        id: s.id,
        label: s.speciality_title?.trim() || s.speciality_name,
        status: s.status,
      }));
    },
  },
  treatment: {
    queryKey: "menu-target-treatments",
    queryFn: async (cityId) => {
      const { treatments } = await listTreatments(cityId !== null ? { city_id: cityId } : undefined);
      return treatments.map((t) => ({
        id: t.id,
        label: t.sub_speciality_title?.trim() || t.sub_speciality_name,
        status: t.status,
      }));
    },
  },
  hospital: {
    queryKey: "menu-target-hospitals",
    queryFn: async (cityId) => {
      const { hospitals } = await listHospitals(cityId !== null ? { city_id: cityId } : undefined);
      return hospitals.map((h) => ({ id: h.id, label: h.hospital_name, status: h.status }));
    },
  },
  doctor: {
    queryKey: "menu-target-doctors",
    queryFn: async (cityId) => {
      const { doctors } = await listDoctors(cityId !== null ? { city_id: cityId } : undefined);
      return doctors.map((d) => ({ id: d.id, label: d.doctor_name, status: d.status }));
    },
  },
  doctor_speciality: {
    queryKey: "menu-target-doctor-specialities",
    queryFn: async () => {
      const { doctorSpecialities } = await listDoctorSpecialities();
      return doctorSpecialities.map((d) => ({ id: d.id, label: d.speciality_name, status: d.status }));
    },
  },
  blog: {
    queryKey: "menu-target-blogs",
    queryFn: async (cityId) => {
      const { blogs } = await listBlogs(cityId !== null ? { city_id: cityId } : { scope: "global" });
      return blogs.map((b) => ({ id: b.id, label: b.blog_title, status: b.blog_status }));
    },
  },
  blog_category: {
    queryKey: "menu-target-blog-categories",
    queryFn: async () => {
      const { blogCategories } = await listBlogCategories();
      return blogCategories.map((c) => ({ id: c.id, label: c.category_name, status: c.status }));
    },
  },
  page: {
    queryKey: "menu-target-pages",
    queryFn: async (cityId) => {
      const { pages } = await listPages(cityId !== null ? { city_id: cityId } : { scope: "global" });
      return pages.map((p) => ({ id: p.id, label: p.title, status: p.status }));
    },
  },
  // Not in CITY_SCOPED_MENU_TARGET_TYPES — a global speciality has no
  // `city_id` at all, so its options are never filtered by the menu's
  // own city (ignores `cityId`, same as doctor_speciality/blog_category).
  global_speciality: {
    queryKey: "menu-target-global-specialities",
    queryFn: async () => {
      const { globalSpecialities } = await listGlobalSpecialities();
      return globalSpecialities.map((s) => ({
        id: s.id,
        label: s.speciality_title?.trim() || s.speciality_name,
        status: s.status,
      }));
    },
  },
};

/**
 * City-scoped target types that ALSO have genuinely global rows. A global
 * menu (`city_id: null`) may only point at a row whose own city is null
 * (the authoritative rule is `ensureValidTarget` in services/menu.service.ts),
 * and only CMS pages and blogs can be global (`city_id` NULL). Every other
 * city-scoped type is always tied to a city, so for those a global menu has
 * nothing valid to list.
 */
const GLOBAL_CAPABLE_TARGET_TYPES: MenuTargetType[] = ["page", "blog"];

type TargetPickerProps = {
  targetType: Exclude<MenuTargetType, "none" | "listing">;
  /** The menu's currently-selected city — `null` while no city has been picked yet OR when Global is chosen (see `isGlobal`). Ignored for target types outside CITY_SCOPED_MENU_TARGET_TYPES. */
  cityId: number | null;
  /** True only when the admin explicitly chose "Global (No City)" — distinguishes it from "nothing chosen yet". */
  isGlobal?: boolean;
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
};

/**
 * Searchable target selector — no target-ID typing, per the requirement
 * that admins must pick from real CMS rows. Built on the existing
 * Popover/Input/Button primitives rather than adding a combobox
 * dependency; filtering happens client-side over the already-small
 * per-module lists these pages already load in full.
 */
export function TargetPicker({ targetType, cityId, isGlobal = false, value, onChange, disabled }: TargetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const config = TARGET_CONFIG[targetType];
  const isCityScoped = CITY_SCOPED_MENU_TARGET_TYPES.includes(targetType);
  // A city-scoped type with no city chosen yet has nothing valid to list —
  // waiting (rather than fetching the unfiltered/nationwide set) is what
  // actually prevents the cross-city selection this exists to stop.
  // Exception: an explicit Global choice on a global-capable type (pages) lists the GLOBAL rows.
  const globalListing = isCityScoped && cityId === null && isGlobal && GLOBAL_CAPABLE_TARGET_TYPES.includes(targetType);
  const blockedByMissingCity = isCityScoped && cityId === null && !globalListing;
  const blockedMessage = isGlobal ? "Not available for global menus" : "Select a city first…";

  const query = useQuery({
    queryKey: [config.queryKey, isCityScoped ? (globalListing ? "global" : cityId) : null],
    queryFn: () => config.queryFn(isCityScoped ? cityId : null),
    enabled: !blockedByMissingCity,
  });
  const options = useMemo(() => query.data ?? [], [query.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, search]);

  const selected = options.find((option) => option.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || query.isLoading || blockedByMissingCity}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {blockedByMissingCity
              ? blockedMessage
              : query.isLoading
                ? "Loading…"
                : selected
                  ? selected.label
                  : "Select a target…"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <div className="flex flex-col">
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">No matches</p>
            )}
            {filtered.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              >
                <span className="flex flex-col truncate">
                  <span className="truncate">{option.label}</span>
                  {option.status !== "active" && (
                    <span className="text-xs text-muted-foreground">Inactive</span>
                  )}
                </span>
                {option.id === value && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
