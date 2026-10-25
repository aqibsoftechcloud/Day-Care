"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { FormDialog } from "@/components/admin/FormDialog";
import { LoadingButton } from "@/components/admin/LoadingButton";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { ApiError } from "@/lib/api/client";
import { listTreatmentSections, updateTreatmentSection } from "@/lib/api/treatment-sections";
import { notify } from "@/lib/toast";
import { treatmentSectionsKey } from "@/components/admin/treatments/TreatmentSectionsPanel";
import type { EligibilitySectionContent } from "@/types/treatment-section";

const formSchema = z.object({
  heading: z.string().trim().max(255).optional(),
  intro: z.string().trim().max(1000).optional(),
  indicatorsText: z.string().trim().optional(),
  note: z.string().trim().max(500).optional(),
});
type FormValues = z.infer<typeof formSchema>;

type TreatmentEligibilityDialogProps = {
  open: boolean;
  treatmentId: number | null;
  treatmentName?: string;
  onOpenChange: (open: boolean) => void;
};

/** Edits the ONE `eligibility` section row's content ("Who Is a Candidate"). Indicators are entered as one per line, split/joined on save. */
export function TreatmentEligibilityDialog({ open, treatmentId, treatmentName, onOpenChange }: TreatmentEligibilityDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Eligibility"
      description={treatmentName ? `Treatment: ${treatmentName}` : undefined}
      className="sm:max-w-xl"
    >
      {open && treatmentId !== null && <TreatmentEligibilityBody treatmentId={treatmentId} onOpenChange={onOpenChange} />}
    </FormDialog>
  );
}

function TreatmentEligibilityBody({ treatmentId, onOpenChange }: { treatmentId: number; onOpenChange: (open: boolean) => void }) {
  const sectionsQuery = useQuery({ queryKey: treatmentSectionsKey(treatmentId), queryFn: () => listTreatmentSections(treatmentId) });
  const section = sectionsQuery.data?.sections.find((s) => s.section_type === "eligibility");

  if (sectionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading…
      </div>
    );
  }

  if (sectionsQuery.isError || !section) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {sectionsQuery.error instanceof ApiError ? sectionsQuery.error.message : "Failed to load content."}
      </p>
    );
  }

  return (
    <TreatmentEligibilityForm
      key={section.id}
      treatmentId={treatmentId}
      sectionId={section.id}
      initialContent={section.content as EligibilitySectionContent | null}
      onOpenChange={onOpenChange}
    />
  );
}

function TreatmentEligibilityForm({
  treatmentId,
  sectionId,
  initialContent,
  onOpenChange,
}: {
  treatmentId: number;
  sectionId: number;
  initialContent: EligibilitySectionContent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      heading: initialContent?.heading ?? "",
      intro: initialContent?.intro ?? "",
      indicatorsText: (initialContent?.indicators ?? []).join("\n"),
      note: initialContent?.note ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const indicators = (values.indicatorsText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (indicators.length === 0) {
        // An empty section is valid (hides on the public page) — send
        // status: inactive-equivalent by simply clearing content isn't
        // possible via this schema (intro/indicators are required when
        // present), so an empty state is represented by leaving the row
        // untouched at zero indicators and letting the public renderer's
        // own "indicators.length === 0 → hide" rule take over. Still
        // requires a non-empty intro if any indicator exists.
        return updateTreatmentSection(treatmentId, sectionId, {
          content: { heading: values.heading || null, intro: values.intro || "", indicators: [], note: values.note || null },
        });
      }

      return updateTreatmentSection(treatmentId, sectionId, {
        content: { heading: values.heading || null, intro: values.intro || "", indicators, note: values.note || null },
      });
    },
    onSuccess: () => {
      notify.success("Eligibility content saved.");
      queryClient.invalidateQueries({ queryKey: treatmentSectionsKey(treatmentId) });
      onOpenChange(false);
    },
    onError: (error) => notify.apiError(error),
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {mutation.isError && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutation.error instanceof ApiError ? mutation.error.message : "Something went wrong."}
        </div>
      )}

      <p className="text-helper text-muted-foreground">Leave indicators empty to hide this section on the public page.</p>

      <Field data-invalid={!!errors.heading || undefined}>
        <FieldLabel htmlFor="eligibility-heading">
          Heading <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Input id="eligibility-heading" placeholder="Who is a candidate for this treatment?" {...register("heading")} />
        <FieldError errors={[errors.heading]} />
      </Field>

      <Field data-invalid={!!errors.intro || undefined}>
        <FieldLabel htmlFor="eligibility-intro">Intro</FieldLabel>
        <Textarea id="eligibility-intro" rows={2} {...register("intro")} />
        <FieldError errors={[errors.intro]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="eligibility-indicators">
          Possible Indicators <span className="text-muted-foreground">(one per line)</span>
        </FieldLabel>
        <Textarea id="eligibility-indicators" rows={5} placeholder={"One indicator per line"} {...register("indicatorsText")} />
      </Field>

      <Field data-invalid={!!errors.note || undefined}>
        <FieldLabel htmlFor="eligibility-note">
          Closing Note <span className="text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea id="eligibility-note" rows={2} {...register("note")} />
        <FieldError errors={[errors.note]} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting || mutation.isPending}>
          Cancel
        </Button>
        <LoadingButton type="submit" disabled={isSubmitting} loading={mutation.isPending}>
          Save Changes
        </LoadingButton>
      </DialogFooter>
    </form>
  );
}
