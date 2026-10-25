"use client";

import { useQuery } from "@tanstack/react-query";
import { FormDialog } from "@/components/admin/FormDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { rolesKeys } from "@/components/admin/roles/queries";
import { listRoles } from "@/lib/api/roles";
import { formatDate } from "@/lib/format-date";
import type { User } from "@/types/user";

type UserViewDialogProps = {
  user: User | null;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="text-caption">{label}</dt>
      <dd className="min-w-0 truncate text-body-sm text-foreground">{value}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-label text-foreground">{title}</h3>
      <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-muted/30 p-3">{children}</div>
    </section>
  );
}

export function UserViewDialog({ user, onClose }: UserViewDialogProps) {
  const rolesQuery = useQuery({ queryKey: rolesKeys.all, queryFn: listRoles, enabled: !!user });
  const roleName = user
    ? rolesQuery.data?.roles.find((role) => role.id === user.role_id)?.name ?? `Role #${user.role_id}`
    : "";

  if (!user) return null;

  return (
    <FormDialog open={!!user} onOpenChange={(open) => !open && onClose()} title="User Details" description={user.name}>
      <div className="flex flex-col gap-4">
        <DetailSection title="User Information">
          <DetailRow label="Name" value={user.name} />
          <DetailRow label="Email" value={user.email} />
        </DetailSection>

        <DetailSection title="Role & Status">
          <DetailRow label="Role" value={roleName} />
          <DetailRow label="Status" value={<StatusBadge status={user.status} />} />
        </DetailSection>

        <DetailSection title="Timestamps">
          <DetailRow label="Created" value={formatDate(user.created_at)} />
          <DetailRow label="Updated" value={formatDate(user.updated_at)} />
        </DetailSection>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </FormDialog>
  );
}
