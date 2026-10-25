"use client";

import { useState } from "react";
import { Plus, ShieldOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { BlogsTable } from "@/components/admin/blogs/BlogsTable";
import { BlogFormDialog } from "@/components/admin/blogs/BlogFormDialog";
import { BlogViewDialog } from "@/components/admin/blogs/BlogViewDialog";
import { DeleteBlogDialog } from "@/components/admin/blogs/DeleteBlogDialog";
import { blogsKeys } from "@/components/admin/blogs/queries";
import { blogCategoriesKeys } from "@/components/admin/blog-categories/queries";
import { usePermission } from "@/hooks/usePermission";
import { ApiError } from "@/lib/api/client";
import { listBlogs } from "@/lib/api/blogs";
import { listBlogCategories } from "@/lib/api/blog-categories";
import type { Blog } from "@/types/blog";

export default function BlogsPage() {
  const { canView, canCreate, canUpdate, canDelete } = usePermission();
  const hasViewAccess = canView("blogs");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [formModal, setFormModal] = useState<{ mode: "create" } | { mode: "edit"; blogId: number } | null>(null);
  const [viewTarget, setViewTarget] = useState<Blog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  const blogsQuery = useQuery({
    queryKey: blogsKeys.all,
    queryFn: () => listBlogs(),
    enabled: hasViewAccess,
  });

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
          You don&apos;t have permission to view Blogs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Blogs"
        description="Manage blogs, their categories, and their content."
        action={
          canCreate("blogs") && (
            <Button onClick={() => setFormModal({ mode: "create" })}>
              <Plus className="size-4" aria-hidden="true" />
              Add Blog
            </Button>
          )
        }
      />

      <BlogsTable
        blogs={blogsQuery.data?.blogs ?? []}
        blogCategories={blogCategoriesQuery.data?.blogCategories ?? []}
        loading={blogsQuery.isLoading}
        error={
          blogsQuery.isError
            ? blogsQuery.error instanceof ApiError
              ? blogsQuery.error.message
              : "Unable to load blogs. Please try again."
            : null
        }
        onRetry={() => blogsQuery.refetch()}
        canView={hasViewAccess}
        canUpdate={canUpdate("blogs")}
        canDelete={canDelete("blogs")}
        canCreate={canCreate("blogs")}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        onCreate={() => setFormModal({ mode: "create" })}
        onView={(blog) => setViewTarget(blog)}
        onEdit={(blog) => setFormModal({ mode: "edit", blogId: blog.id })}
        onDelete={(blog) => setDeleteTarget(blog)}
      />

      <BlogFormDialog
        open={!!formModal}
        mode={formModal?.mode ?? "create"}
        blogId={formModal?.mode === "edit" ? formModal.blogId : null}
        onOpenChange={(open) => !open && setFormModal(null)}
      />

      <BlogViewDialog blog={viewTarget} onClose={() => setViewTarget(null)} />

      <DeleteBlogDialog blog={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
