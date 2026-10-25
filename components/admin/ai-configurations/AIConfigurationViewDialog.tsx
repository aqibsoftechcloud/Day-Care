"use client";

import { DetailSheet } from "@/components/admin/DetailSheet";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { AIConfiguration, AIConfigurationProvider } from "@/types/ai-configuration";

const PROVIDER_LABELS: Record<AIConfigurationProvider, string> = {
  openrouter: "OpenRouter",
  gemini: "Gemini",
};

type AIConfigurationViewDialogProps = {
  config: AIConfiguration | null;
  onClose: () => void;
};

export function AIConfigurationViewDialog({ config, onClose }: AIConfigurationViewDialogProps) {
  if (!config) return null;

  return (
    <DetailSheet
      open={!!config}
      onClose={onClose}
      title="AI Configuration Details"
      description={PROVIDER_LABELS[config.provider]}
      sections={[
        {
          heading: "Configuration",
          rows: [
            { label: "Provider", value: PROVIDER_LABELS[config.provider] },
            { label: "Model", value: config.model },
            { label: "Base URL", value: <span className="break-all">{config.base_url}</span> },
            {
              label: "API Key",
              value: config.has_api_key ? (
                <Badge variant="secondary">Configured</Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Not configured
                </Badge>
              ),
            },
            {
              label: "Active Provider",
              value: config.is_active ? (
                <Badge>Currently active</Badge>
              ) : (
                <span className="text-muted-foreground">Not active</span>
              ),
            },
            { label: "Status", value: <StatusBadge status={config.status} /> },
          ],
        },
        {
          heading: "Timestamps",
          rows: [
            { label: "Created", value: formatDate(config.created_at) },
            { label: "Updated", value: formatDate(config.updated_at) },
          ],
        },
      ]}
    />
  );
}
