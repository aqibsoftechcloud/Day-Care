"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { RichTextEditor } from "@/components/admin/editor/RichTextEditor";
import { SectionImageField, type SectionImageValue } from "./SectionImageField";
import { uploadPageSectionImage } from "@/lib/api/page-sections";
import {
  heroSectionContentSchema,
  aboutSectionContentSchema,
  featuresSectionContentSchema,
  contentSectionContentSchema,
  ctaSectionContentSchema,
  hospitalListingSectionContentSchema,
} from "@/validators/page-section.validator";
import type {
  AboutSectionContent,
  ContentSectionContent,
  CtaSectionContent,
  FeaturesSectionContent,
  HeroSectionContent,
  HospitalListingSectionContent,
  PageSectionType,
} from "@/types/page-section";

type FieldsProps<T> = {
  initialContent: T;
  onSave: (content: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

type PageSectionFieldsFormProps = {
  sectionType: PageSectionType;
  initialContent: unknown;
  onSave: (content: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

/**
 * Switches on `section_type` to render the right content editor — each
 * section type's fields mirror its own validator schema in
 * validators/page-section.validator.ts exactly (imported and reused
 * directly via `zodResolver`, not re-declared) so client and server
 * validation can never drift apart.
 */
export function PageSectionFieldsForm({ sectionType, initialContent, onSave, onCancel, saving }: PageSectionFieldsFormProps) {
  switch (sectionType) {
    case "hero":
      return <HeroFields initialContent={initialContent as HeroSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
    case "about":
      return <AboutFields initialContent={initialContent as AboutSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
    case "features":
      return <FeaturesFields initialContent={initialContent as FeaturesSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
    case "content":
      return <ContentFields initialContent={initialContent as ContentSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
    case "cta":
      return <CtaFields initialContent={initialContent as CtaSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
    case "hospital_listing":
      return <HospitalListingFields initialContent={initialContent as HospitalListingSectionContent} onSave={onSave} onCancel={onCancel} saving={saving} />;
  }
}

/**
 * A plain `<button type="button" onClick>` rather than `type="submit"` —
 * every section's field editor is intentionally NOT a real `<form>`
 * element (see the `<div>` wrappers below), since it always renders
 * nested inside `PageFormDialog`'s own outer `<form>`; a real inner
 * `<form>` there is invalid HTML and previously caused a hydration
 * error. `onSave` is the react-hook-form `handleSubmit(...)`-wrapped
 * callback, safe to invoke directly from a click handler.
 */
function SectionFormActions({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <LoadingButton type="button" size="sm" loading={saving} onClick={onSave}>
        Save Section
      </LoadingButton>
    </div>
  );
}

function HeroFields({ initialContent, onSave, onCancel, saving }: FieldsProps<HeroSectionContent>) {
  const [image, setImage] = useState<SectionImageValue>({ path: initialContent.image ?? null });
  const [uploading, setUploading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HeroSectionContent>({
    resolver: zodResolver(heroSectionContentSchema),
    defaultValues: {
      title: initialContent.title ?? "",
      subtitle: initialContent.subtitle ?? "",
      cta_text: initialContent.cta_text ?? "",
      cta_url: initialContent.cta_url ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    let imagePath = image.path;
    if (image.pendingFile) {
      setUploading(true);
      try {
        imagePath = (await uploadPageSectionImage(image.pendingFile)).path;
      } finally {
        setUploading(false);
      }
    }
    await onSave({ ...values, image: imagePath });
  });

  const busy = saving || uploading;

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!errors.title || undefined}>
        <FieldLabel htmlFor="section-hero-title">
          Title <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="section-hero-title" {...register("title")} />
        <FieldError errors={[errors.title]} />
      </Field>
      <Field data-invalid={!!errors.subtitle || undefined}>
        <FieldLabel htmlFor="section-hero-subtitle">
          Subtitle <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="section-hero-subtitle" {...register("subtitle")} />
        <FieldError errors={[errors.subtitle]} />
      </Field>
      <SectionImageField label="Image" value={image} onChange={setImage} disabled={busy} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.cta_text || undefined}>
          <FieldLabel htmlFor="section-hero-cta-text">
            CTA Text <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input id="section-hero-cta-text" {...register("cta_text")} />
          <FieldError errors={[errors.cta_text]} />
        </Field>
        <Field data-invalid={!!errors.cta_url || undefined}>
          <FieldLabel htmlFor="section-hero-cta-url">
            CTA URL <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input id="section-hero-cta-url" placeholder="/hyderabad or https://…" {...register("cta_url")} />
          <FieldError errors={[errors.cta_url]} />
        </Field>
      </div>
      <SectionFormActions onCancel={onCancel} onSave={submit} saving={busy} />
    </div>
  );
}

function AboutFields({ initialContent, onSave, onCancel, saving }: FieldsProps<AboutSectionContent>) {
  const [image, setImage] = useState<SectionImageValue>({ path: initialContent.image ?? null });
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AboutSectionContent>({
    resolver: zodResolver(aboutSectionContentSchema),
    defaultValues: { heading: initialContent.heading ?? "", content: initialContent.content ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    let imagePath = image.path;
    if (image.pendingFile) {
      setUploading(true);
      try {
        imagePath = (await uploadPageSectionImage(image.pendingFile)).path;
      } finally {
        setUploading(false);
      }
    }
    await onSave({ ...values, image: imagePath });
  });

  const busy = saving || uploading;

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="section-about-heading">
          Heading <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="section-about-heading" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>
      <Field data-invalid={!!errors.content || undefined}>
        <FieldLabel htmlFor="section-about-content">
          Content <span className="text-destructive">*</span>
        </FieldLabel>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id="section-about-content"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Write this section's content…"
              error={!!errors.content}
            />
          )}
        />
        <FieldError errors={[errors.content]} />
      </Field>
      <SectionImageField label="Image" value={image} onChange={setImage} disabled={busy} />
      <SectionFormActions onCancel={onCancel} onSave={submit} saving={busy} />
    </div>
  );
}

function ContentFields({ initialContent, onSave, onCancel, saving }: FieldsProps<ContentSectionContent>) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContentSectionContent>({
    resolver: zodResolver(contentSectionContentSchema),
    defaultValues: { heading: initialContent.heading ?? "", content: initialContent.content ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    await onSave({ ...values });
  });

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="section-content-heading">
          Heading <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="section-content-heading" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>
      <Field data-invalid={!!errors.content || undefined}>
        <FieldLabel htmlFor="section-content-body">
          Rich Text <span className="text-destructive">*</span>
        </FieldLabel>
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <RichTextEditor
              id="section-content-body"
              value={field.value ?? ""}
              onChange={field.onChange}
              placeholder="Write this section's content…"
              error={!!errors.content}
            />
          )}
        />
        <FieldError errors={[errors.content]} />
      </Field>
      <SectionFormActions onCancel={onCancel} onSave={submit} saving={saving} />
    </div>
  );
}

function CtaFields({ initialContent, onSave, onCancel, saving }: FieldsProps<CtaSectionContent>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CtaSectionContent>({
    resolver: zodResolver(ctaSectionContentSchema),
    defaultValues: {
      heading: initialContent.heading ?? "",
      description: initialContent.description ?? "",
      button_text: initialContent.button_text ?? "",
      button_url: initialContent.button_url ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSave({ ...values });
  });

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="section-cta-heading">
          Heading <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="section-cta-heading" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>
      <Field data-invalid={!!errors.description || undefined}>
        <FieldLabel htmlFor="section-cta-description">
          Description <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea id="section-cta-description" rows={2} {...register("description")} />
        <FieldError errors={[errors.description]} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field data-invalid={!!errors.button_text || undefined}>
          <FieldLabel htmlFor="section-cta-button-text">
            Button Text <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="section-cta-button-text" {...register("button_text")} />
          <FieldError errors={[errors.button_text]} />
        </Field>
        <Field data-invalid={!!errors.button_url || undefined}>
          <FieldLabel htmlFor="section-cta-button-url">
            Button URL <span className="text-destructive">*</span>
          </FieldLabel>
          <Input id="section-cta-button-url" placeholder="/hyderabad or https://…" {...register("button_url")} />
          <FieldError errors={[errors.button_url]} />
        </Field>
      </div>
      <SectionFormActions onCancel={onCancel} onSave={submit} saving={saving} />
    </div>
  );
}

function FeaturesFields({ initialContent, onSave, onCancel, saving }: FieldsProps<FeaturesSectionContent>) {
  const [itemImages, setItemImages] = useState<SectionImageValue[]>(
    initialContent.items.map((item) => ({ path: item.image ?? null }))
  );
  const [uploading, setUploading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FeaturesSectionContent>({
    resolver: zodResolver(featuresSectionContentSchema),
    defaultValues: {
      heading: initialContent.heading ?? "",
      items: initialContent.items.length > 0 ? initialContent.items : [{ title: "", description: "", image: null }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const submit = handleSubmit(async (values) => {
    setUploading(true);
    try {
      const items = await Promise.all(
        values.items.map(async (item, index) => {
          const image = itemImages[index];
          const imagePath = image?.pendingFile
            ? (await uploadPageSectionImage(image.pendingFile)).path
            : (image?.path ?? null);
          return { ...item, image: imagePath };
        })
      );
      await onSave({ heading: values.heading, items });
    } finally {
      setUploading(false);
    }
  });

  const busy = saving || uploading;

  return (
    <div className="flex flex-col gap-4">
      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="section-features-heading">
          Heading <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="section-features-heading" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold text-foreground">Feature {index + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    remove(index);
                    setItemImages((current) => current.filter((_, i) => i !== index));
                  }}
                  disabled={busy}
                  aria-label={`Remove feature ${index + 1}`}
                  className="rounded-sm text-muted-foreground hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <Field data-invalid={!!errors.items?.[index]?.title || undefined}>
              <FieldLabel htmlFor={`section-feature-title-${index}`}>
                Title <span className="text-destructive">*</span>
              </FieldLabel>
              <Input id={`section-feature-title-${index}`} {...register(`items.${index}.title` as const)} />
              <FieldError errors={[errors.items?.[index]?.title]} />
            </Field>

            <Field data-invalid={!!errors.items?.[index]?.description || undefined}>
              <FieldLabel htmlFor={`section-feature-description-${index}`}>
                Description <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Textarea id={`section-feature-description-${index}`} rows={2} {...register(`items.${index}.description` as const)} />
              <FieldError errors={[errors.items?.[index]?.description]} />
            </Field>

            <SectionImageField
              label="Icon / Image"
              value={itemImages[index] ?? { path: null }}
              onChange={(value) =>
                setItemImages((current) => {
                  const next = [...current];
                  next[index] = value;
                  return next;
                })
              }
              disabled={busy}
            />
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={busy || fields.length >= 12}
        onClick={() => {
          append({ title: "", description: "", image: null });
          setItemImages((current) => [...current, { path: null }]);
        }}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add Feature
      </Button>

      <SectionFormActions onCancel={onCancel} onSave={submit} saving={busy} />
    </div>
  );
}

function HospitalListingFields({ initialContent, onSave, onCancel, saving }: FieldsProps<HospitalListingSectionContent>) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HospitalListingSectionContent>({
    resolver: zodResolver(hospitalListingSectionContentSchema),
    defaultValues: {
      heading: initialContent.heading ?? "",
      description: initialContent.description ?? "",
      columns: initialContent.columns ?? 3,
      initial_count: initialContent.initial_count ?? 6,
      load_more: initialContent.load_more ?? true,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSave({ ...values });
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-body-sm text-muted-foreground">
        Shows a card for every active hospital in every city, straight from Hospital Management. There is nothing to copy in by hand.
        Use the Active switch on the section to turn the whole listing on or off.
      </p>
      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel>Heading *</FieldLabel>
        <Input {...register("heading")} maxLength={255} />
        <FieldError errors={[errors.heading]} />
      </Field>
      <Field data-invalid={!!errors.description || undefined}>
        <FieldLabel>Description</FieldLabel>
        <Textarea {...register("description")} rows={3} maxLength={1000} />
        <FieldError errors={[errors.description]} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel>Cards per row (large screens)</FieldLabel>
          <Controller
            name="columns"
            control={control}
            render={({ field }) => (
              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            )}
          />
        </Field>
        <Field data-invalid={!!errors.initial_count || undefined}>
          <FieldLabel>Hospitals shown first</FieldLabel>
          <Input type="number" min={1} max={48} {...register("initial_count", { valueAsNumber: true })} />
          <FieldError errors={[errors.initial_count]} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-body-sm text-foreground">
        <input type="checkbox" className="size-4" {...register("load_more")} />
        Show a &ldquo;Load more&rdquo; button for the remaining hospitals
      </label>
      <SectionFormActions onCancel={onCancel} onSave={submit} saving={saving} />
    </div>
  );
}
