"use client";

import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { FormFieldGrid } from "@/components/admin/FormFieldGrid";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { createMenu, getMenu, listMenus, updateMenu } from "@/lib/api/menus";
import { listLanguages } from "@/lib/api/languages";
import { listCities } from "@/lib/api/cities";
import { notify } from "@/lib/toast";
import { menusKeys } from "@/components/admin/menus/queries";
import { languagesKeys } from "@/components/admin/languages/queries";
import { citiesKeys } from "@/components/admin/cities/queries";
import { TargetPicker } from "@/components/admin/menus/TargetPicker";
import { CITY_SCOPED_MENU_TARGET_TYPES } from "@/types/menu";
import type { CreateMenuInput, Menu, MenuPlacement, MenuTargetType } from "@/types/menu";

const NO_PARENT_VALUE = "none";
const NO_TARGET_VALUE = "none";
const LISTING_TARGET_VALUE = "listing";
/** Sentinel for the City select's "no city" option — Radix Select has no built-in way to deselect back to an empty value once one is chosen, so this gives the admin an explicit way to revert an existing city-specific menu to global while editing. Maps back to `""` (the form's own "empty = global" convention) in the handler below; never submitted as a literal value. */
const GLOBAL_CITY_VALUE = "global";

const TARGET_TYPE_OPTIONS: { value: MenuTargetType; label: string }[] = [
  { value: "none", label: "No Link / Group" },
  { value: "listing", label: "Listing / System Page" },
  { value: "speciality", label: "Speciality" },
  { value: "treatment", label: "Treatment" },
  { value: "hospital", label: "Hospital" },
  { value: "doctor", label: "Doctor" },
  { value: "doctor_speciality", label: "Doctor Speciality" },
  { value: "blog", label: "Blog" },
  { value: "blog_category", label: "Blog Category" },
  { value: "page", label: "Page" },
  { value: "global_speciality", label: "Global Speciality" },
];

/** Mirrors validators/menu.validator.ts's menuListingKeySchema — the fixed set of nationwide/system routes a "Listing" menu item can point at. */
const LISTING_KEY_OPTIONS: { value: string; label: string }[] = [
  { value: "specialities", label: "Specialities" },
  { value: "treatments", label: "Treatments" },
  { value: "hospitals", label: "Hospitals" },
  { value: "doctors", label: "Doctors" },
  { value: "find_a_doctor", label: "Find a Doctor" },
  { value: "health_packages", label: "Health Packages" },
  { value: "blogs", label: "Blogs" },
  { value: "testimonials", label: "Patient Reviews" },
  { value: "contact_us", label: "Contact Us" },
];

/** Mirrors validators/menu.validator.ts's menuPlacementSchema — which row/region of the public navigation a top-level item renders in. Only meaningful on a top-level item; a child always renders wherever its parent renders. */
const PLACEMENT_OPTIONS: { value: MenuPlacement; label: string }[] = [
  { value: "primary", label: "Primary navigation (top header row)" },
  { value: "secondary", label: "Secondary navigation (category row)" },
  { value: "footer", label: "Footer" },
];

// Mirrors validators/menu.validator.ts's createMenuSchema exactly.
const menuFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255, "Title is too long"),
    seo_url: z.string().trim().min(1, "SEO URL is required").max(255, "SEO URL is too long"),
    language_id: z.string().min(1, "Language is required"),
    // Optional: an empty string means a GLOBAL menu (no city) — see the
    // submit payload below, which maps "" to `null`. Not `.min(1, ...)`
    // anymore; leaving this field untouched is a valid, intentional choice,
    // not a validation error.
    city_id: z.string(),
    parent_id: z.string(),
    target_type: z.enum([
      "none",
      "listing",
      "speciality",
      "treatment",
      "hospital",
      "doctor",
      "doctor_speciality",
      "blog",
      "blog_category",
      "page",
      "global_speciality",
    ]),
    target_id: z.string(),
    listing_key: z.string(),
    placement: z.enum(["primary", "secondary", "footer"]),
    sorting_order: z.string().trim().refine((v) => v === "" || /^-?\d+$/.test(v), "Enter a whole number"),
    status: z.enum(["active", "inactive"]),
  })
  .refine(
    (data) =>
      data.target_type === NO_TARGET_VALUE ||
      data.target_type === LISTING_TARGET_VALUE ||
      data.target_id !== "",
    { message: "Select a target for this link type", path: ["target_id"] }
  )
  .refine((data) => data.target_type !== LISTING_TARGET_VALUE || data.listing_key !== "", {
    message: "Select which listing/system page this links to",
    path: ["listing_key"],
  });

type MenuFormValues = z.infer<typeof menuFormSchema>;

type MenuFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  menuId: number | null;
  onOpenChange: (open: boolean) => void;
};

export function MenuFormDialog({ open, mode, menuId, onOpenChange }: MenuFormDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Add Menu" : "Edit Menu"}
      description={mode === "create" ? "Create a new menu item." : "Update this menu item's details."}
      className="sm:max-w-4xl"
    >
      {/* Keyed by menu so re-opening for a different menu remounts with
          fresh defaultValues instead of needing a reset-in-effect. */}
      {open && (
        <MenuFormBody
          key={mode === "edit" ? (menuId ?? "edit") : "create"}
          mode={mode}
          menuId={menuId}
          onOpenChange={onOpenChange}
        />
      )}
    </FormDialog>
  );
}

function MenuFormBody({
  mode,
  menuId,
  onOpenChange,
}: {
  mode: "create" | "edit";
  menuId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const menuQuery = useQuery({
    queryKey: menusKeys.detail(menuId ?? -1),
    queryFn: () => getMenu(menuId as number),
    enabled: mode === "edit" && menuId !== null,
  });

  if (mode === "edit" && menuQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading menu…
      </div>
    );
  }

  if (mode === "edit" && menuQuery.isError) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {menuQuery.error instanceof ApiError ? menuQuery.error.message : "Failed to load menu."}
      </p>
    );
  }

  return (
    <MenuForm mode={mode} menuId={menuId} initialMenu={menuQuery.data?.menu} onOpenChange={onOpenChange} />
  );
}

function MenuForm({
  mode,
  menuId,
  initialMenu,
  onOpenChange,
}: {
  mode: "create" | "edit";
  menuId: number | null;
  initialMenu?: Menu;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const languagesQuery = useQuery({ queryKey: languagesKeys.all, queryFn: listLanguages });
  const citiesQuery = useQuery({ queryKey: citiesKeys.all, queryFn: listCities });

  const languages = languagesQuery.data?.languages ?? [];
  const cities = citiesQuery.data?.cities ?? [];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      title: initialMenu?.title ?? "",
      seo_url: initialMenu?.seo_url ?? "",
      language_id: initialMenu ? String(initialMenu.language_id) : "",
      // Create: starts truly empty so the placeholder shows until the
      // admin makes a choice either way. Edit of an existing GLOBAL menu:
      // explicitly shows the "Global (No City)" sentinel rather than a
      // blank placeholder, since that menu does have a definite state.
      // Edit of a city-specific menu: unchanged, shows that city.
      city_id: !initialMenu ? "" : initialMenu.city_id === null ? GLOBAL_CITY_VALUE : String(initialMenu.city_id),
      parent_id: initialMenu?.parent_id ? String(initialMenu.parent_id) : NO_PARENT_VALUE,
      target_type: initialMenu?.target_type ?? "none",
      target_id: initialMenu?.target_id ? String(initialMenu.target_id) : "",
      listing_key: initialMenu?.listing_key ?? "",
      placement: initialMenu?.placement ?? "primary",
      sorting_order: initialMenu ? String(initialMenu.sorting_order) : "0",
      status: initialMenu?.status === "inactive" ? "inactive" : "active",
    },
  });

  const targetType = watch("target_type");
  const targetId = watch("target_id");
  const cityIdValue = watch("city_id");
  const selectedCityId =
    cityIdValue === "" || cityIdValue === GLOBAL_CITY_VALUE ? null : Number(cityIdValue);
  const isGlobalMenu = cityIdValue === GLOBAL_CITY_VALUE;
  const parentIdValue = watch("parent_id");
  const placementValue = watch("placement");
  // Primary navigation (e.g. "For Patients"/"Our Company") is now a
  // single canonical GLOBAL source of truth — see lib/public/menu.ts's
  // getPublicMenuTree, which drops any city-specific top-level `primary`
  // menu from the public site entirely. This is a non-blocking nudge, not
  // a hard validation rule: the admin can still save this (e.g. while
  // migrating content, or for a genuinely one-off city exception), but
  // should know it will not actually appear in primary navigation.
  const showsCityPrimaryDuplicateWarning =
    selectedCityId !== null && placementValue === "primary" && parentIdValue === NO_PARENT_VALUE;

  // Parent Menu options are scoped to the SAME scope as the menu being
  // created/edited: a real city's own menus, or — when this menu is
  // global (city_id: null) — the global menu set. A menu can only parent
  // another menu within its own scope (see services/menu.service.ts's
  // ensureParentExists, which enforces this authoritatively). Re-fetches
  // whenever the city changes; always enabled, since both a real city and
  // "global" are valid, fetchable scopes.
  const parentMenusQuery = useQuery({
    queryKey:
      selectedCityId !== null ? menusKeys.parentOptions(selectedCityId) : menusKeys.parentOptionsGlobal(),
    queryFn: () =>
      selectedCityId !== null
        ? listMenus({ city_id: selectedCityId, status: "active" })
        : listMenus({ cityIdIsNull: true, status: "active" }),
  });

  // Excludes the menu itself and, when editing, every one of its
  // descendants (children, grandchildren, ...) — picking one of those as
  // this menu's own parent would create a cycle. The backend's
  // ensureNoCycle already rejects this authoritatively on submit; this is
  // purely a UX improvement so the admin never sees an invalid option in
  // the first place. Every candidate here comes from the same fetched
  // scope (city or global), so walking parent_id links can never cross
  // into the other scope.
  const parentOptions = useMemo(() => {
    const allMenus = parentMenusQuery.data?.menus ?? [];
    if (menuId === null) return allMenus;

    const excluded = new Set<number>([menuId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const menu of allMenus) {
        if (menu.parent_id !== null && excluded.has(menu.parent_id) && !excluded.has(menu.id)) {
          excluded.add(menu.id);
          changed = true;
        }
      }
    }
    return allMenus.filter((menu) => !excluded.has(menu.id));
  }, [parentMenusQuery.data, menuId]);

  // If the city changes (or on first load, once real data for that city
  // has arrived) and the currently-selected parent no longer belongs to
  // it, reset to "None (top-level)" rather than silently submitting a
  // stale cross-city parent_id. Waits for `parentMenusQuery.data` so it
  // never judges validity against an empty placeholder while loading.
  useEffect(() => {
    if (!parentMenusQuery.data) return;
    if (parentIdValue === NO_PARENT_VALUE) return;
    const stillValid = parentOptions.some((menu) => String(menu.id) === parentIdValue);
    if (!stillValid) {
      setValue("parent_id", NO_PARENT_VALUE, { shouldValidate: true });
    }
  }, [parentMenusQuery.data, parentOptions, parentIdValue, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: MenuFormValues) => {
      const payload = {
        title: values.title,
        seo_url: values.seo_url,
        language_id: Number(values.language_id),
        // Never touching the field ("") or explicitly picking "Global (No
        // City)" both mean a GLOBAL menu — explicitly `null`, never a
        // default/fallback city silently assigned.
        city_id:
          values.city_id === "" || values.city_id === GLOBAL_CITY_VALUE ? null : Number(values.city_id),
        parent_id: values.parent_id === NO_PARENT_VALUE ? null : Number(values.parent_id),
        target_type: values.target_type,
        target_id:
          values.target_type === NO_TARGET_VALUE || values.target_type === LISTING_TARGET_VALUE
            ? null
            : Number(values.target_id),
        listing_key:
          values.target_type === LISTING_TARGET_VALUE
            ? (values.listing_key as CreateMenuInput["listing_key"])
            : null,
        placement: values.placement,
        sorting_order: values.sorting_order === "" ? 0 : Number(values.sorting_order),
        status: values.status,
      };
      if (mode === "create") {
        return createMenu(payload);
      }
      return updateMenu(menuId as number, payload);
    },
    onSuccess: () => {
      notify.success(mode === "create" ? "Menu created successfully." : "Menu updated successfully.");
      queryClient.invalidateQueries({ queryKey: menusKeys.all });
      onOpenChange(false);
    },
    onError: (error) => {
      notify.apiError(error);
    },
  });

  const onSubmit = (values: MenuFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {mutation.isError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <FormFieldGrid>
        <Field className="sm:col-span-2" data-invalid={!!errors.title || undefined}>
          <FieldLabel htmlFor="menu-title">
            Title <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="menu-title"
            placeholder="e.g. About Us"
            aria-invalid={!!errors.title || undefined}
            {...register("title")}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={!!errors.language_id || undefined}>
          <FieldLabel htmlFor="menu-language">
            Language <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="language_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled={languagesQuery.isLoading}>
                <SelectTrigger id="menu-language" className="w-full">
                  <SelectValue placeholder={languagesQuery.isLoading ? "Loading…" : "Select a language"} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.id} value={String(language.id)}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.language_id]} />
        </Field>

        <Field data-invalid={!!errors.city_id || undefined}>
          <FieldLabel htmlFor="menu-city">City</FieldLabel>
          <Controller
            name="city_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value === "" ? undefined : field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  // Changing the city can leave a previously-selected
                  // city-scoped target (Speciality/Treatment/Hospital/
                  // Doctor/Blog/Page) pointing at the wrong city — clear it
                  // so the admin must re-pick from the new city's own
                  // options rather than silently keeping a stale target.
                  // Switching TO global (no city) must clear it too, for
                  // the same reason: a city-scoped target can never belong
                  // to a global menu.
                  if (CITY_SCOPED_MENU_TARGET_TYPES.includes(targetType)) {
                    setValue("target_id", "", { shouldValidate: true });
                  }
                }}
                disabled={citiesQuery.isLoading}
              >
                <SelectTrigger id="menu-city" className="w-full">
                  <SelectValue placeholder={citiesQuery.isLoading ? "Loading…" : "Select a city"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL_CITY_VALUE}>Global (No City)</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.city_id]} />
        </Field>

        <Field data-invalid={!!errors.parent_id || undefined}>
          <FieldLabel htmlFor="menu-parent">Parent Menu</FieldLabel>
          <Controller
            name="parent_id"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={parentMenusQuery.isLoading}
              >
                <SelectTrigger id="menu-parent" className="w-full">
                  <SelectValue placeholder={parentMenusQuery.isLoading ? "Loading…" : undefined} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PARENT_VALUE}>None (top-level)</SelectItem>
                  {parentOptions.length === 0 && !parentMenusQuery.isLoading ? (
                    <SelectItem value="__no_eligible_parents__" disabled>
                      {selectedCityId === null
                        ? "No other global menus yet"
                        : "No other menus in this city yet"}
                    </SelectItem>
                  ) : (
                    parentOptions.map((menu) => (
                      <SelectItem key={menu.id} value={String(menu.id)}>
                        {menu.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.parent_id]} />
        </Field>

        <Field data-invalid={!!errors.placement || undefined}>
          <FieldLabel htmlFor="menu-placement">Placement</FieldLabel>
          <Controller
            name="placement"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="menu-placement" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.placement]} />
          {showsCityPrimaryDuplicateWarning && (
            <p className="text-xs text-amber-600">
              Primary navigation is managed globally now. A city-specific top-level primary menu like this
              one will not appear on the public site — use the Global (No City) parent instead, or change
              Placement to Secondary/Footer if this item is genuinely city-specific.
            </p>
          )}
        </Field>

        <Field data-invalid={!!errors.target_type || undefined}>
          <FieldLabel htmlFor="menu-target-type">Link Type</FieldLabel>
          <Controller
            name="target_type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setValue("target_id", "");
                  setValue("listing_key", "");
                }}
              >
                <SelectTrigger id="menu-target-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.target_type]} />
        </Field>

        {targetType === LISTING_TARGET_VALUE && (
          <Field data-invalid={!!errors.listing_key || undefined}>
            <FieldLabel htmlFor="menu-listing-key">
              Listing <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              name="listing_key"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="menu-listing-key" className="w-full">
                    <SelectValue placeholder="Select a listing/system page" />
                  </SelectTrigger>
                  <SelectContent>
                    {LISTING_KEY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.listing_key]} />
          </Field>
        )}

        {targetType !== NO_TARGET_VALUE && targetType !== LISTING_TARGET_VALUE && (
          <Field data-invalid={!!errors.target_id || undefined}>
            <FieldLabel htmlFor="menu-target-id">
              Target <span className="text-destructive">*</span>
            </FieldLabel>
            <TargetPicker
              targetType={targetType}
              cityId={selectedCityId}
              isGlobal={isGlobalMenu}
              value={targetId ? Number(targetId) : null}
              onChange={(id) => setValue("target_id", id ? String(id) : "", { shouldValidate: true })}
            />
            <FieldError errors={[errors.target_id]} />
          </Field>
        )}

        <Field data-invalid={!!errors.sorting_order || undefined}>
          <FieldLabel htmlFor="menu-sorting-order">Sorting Order</FieldLabel>
          <Input
            id="menu-sorting-order"
            type="number"
            step="1"
            aria-invalid={!!errors.sorting_order || undefined}
            {...register("sorting_order")}
          />
          <FieldError errors={[errors.sorting_order]} />
        </Field>

        <Field data-invalid={!!errors.seo_url || undefined}>
          <FieldLabel htmlFor="menu-seo-url">
            SEO URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="menu-seo-url"
            placeholder="e.g. about-us"
            aria-invalid={!!errors.seo_url || undefined}
            {...register("seo_url")}
          />
          <FieldError errors={[errors.seo_url]} />
        </Field>

        <Field data-invalid={!!errors.status || undefined}>
          <FieldLabel htmlFor="menu-status">Status</FieldLabel>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="menu-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[errors.status]} />
        </Field>
      </FormFieldGrid>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting || mutation.isPending}
        >
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          {mode === "create" ? "Create Menu" : "Save Changes"}
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
