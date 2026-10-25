"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { BlogCategoriesTable } from "@/components/admin/blog-categories/BlogCategoriesTable";
import { BlogCategoryFormDialog } from "@/components/admin/blog-categories/BlogCategoryFormDialog";
import { BlogCategoryViewDialog } from "@/components/admin/blog-categories/BlogCategoryViewDialog";
import { DeleteBlogCategoryDialog } from "@/components/admin/blog-categories/DeleteBlogCategoryDialog";
import { blogCategoriesKeys } from "@/components/admin/blog-categories/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listBlogCategories } from "@/lib/api/blog-categories";
import type { BlogCategory } from "@/types/blog-category";

export default function BlogCategoriesPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("blog-categories");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formModal, setFormModal] = useState<
    { mode: "create" } | { mode: "edit"; blogCategoryId: number } | null
  >(null);
  const [viewTarget, setViewTarget] = useState<BlogCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogCategory | null>(null);

  const blogCategoriesQuery = useQuery({
    queryKey: blogCategoriesKeys.all,
    queryFn: () => listBlogCategories(),
    enabled: hasViewAccess,
  });

  if (!hasViewAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-6 py-20 text-center shadow-xs">
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldOff className="size-5" aria-hidden="true" />
        </span>
        <p className="text-subtitle text-foreground">Access restricted</p>
        <p className="mt-1 max-w-sm text-body-sm text-muted-foreground">
          You don&apos;t have permission to view Blog Categories.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Blog Categories"
        description="Manage the categories blogs can be organized under."
        action={
          canCreate("blog-categories") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Blog Category
            </Button>
          )
        }
      />

      <BlogCategoriesTable
        blogCategories={blogCategoriesQuery.data?.blogCategories ?? []}
        loading={blogCategoriesQuery.isLoading}
        error={
          blogCategoriesQuery.isError
            ? blogCategoriesQuery.error instanceof ApiError
              ? blogCategoriesQuery.error.message
              : "Unable to load blog categories. Please try again."
            : null
        }
        onRetry={() => blogCategoriesQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("blog-categories")}
        canDelete={canDelete("blog-categories")}
        canCreate={canCreate("blog-categories")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(blogCategory) => setViewTarget(blogCategory)}
        onEdit={(blogCategory) => setFormModal({ mode: "edit", blogCategoryId: blogCategory.id })}
        onDelete={(blogCategory) => setDeleteTarget(blogCategory)}
      />

      <BlogCategoryFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        blogCategoryId={formModal?.mode === "edit" ? formModal.blogCategoryId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <BlogCategoryViewDialog blogCategory={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteBlogCategoryDialog blogCategory={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
