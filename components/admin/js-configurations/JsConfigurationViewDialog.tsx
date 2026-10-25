"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { JsConfiguration } from "@/types/js-configuration";

const CONFIG_FOR_LABELS: Record<JsConfiguration["config_for"], string> = {
  header: "Header",
  footer: "Footer",
};

type JsConfigurationViewDialogProps = {
  jsConfiguration: JsConfiguration | null;
  onClose: () => void;
};

export function JsConfigurationViewDialog({ jsConfiguration, onClose }: JsConfigurationViewDialogProps) {
  if (!jsConfiguration) return null;

  return (
    <DetailSheet
      open={!!jsConfiguration}
      onClose={onClose}
      title="JS Configuration Details"
      description={jsConfiguration.config_type}
      sections={[
        {
          heading: "Configuration",
          rows: [
            { label: "Config Type", value: jsConfiguration.config_type },
            { label: "Config For", value: <Badge variant="secondary">{CONFIG_FOR_LABELS[jsConfiguration.config_for]}</Badge> },
            { label: "Status", value: <StatusBadge status={jsConfiguration.status} /> },
          ],
        },
        {
          heading: "Config Code",
          rows: [
            {
              // Rendered as plain text inside a <pre> — React escapes the
              // interpolated string automatically (no dangerouslySetInnerHTML,
              // no execution), so the exact stored code is shown safely
              // regardless of whether it contains <script> tags or other markup.
              label: "Code",
              value: (
                <pre className="max-h-80 w-full overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-muted/30 p-3 font-mono text-body-sm text-foreground">
                  {jsConfiguration.config_code}
                </pre>
              ),
            },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(jsConfiguration.created_at) },
            { label: "Updated", value: formatDate(jsConfiguration.updated_at) },
          ],
        },
      ]}
    />
  );
}
