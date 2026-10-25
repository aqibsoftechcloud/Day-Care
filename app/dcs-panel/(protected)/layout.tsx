"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Topbar } from "@/components/admin/layout/Topbar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();

  // Plain React state, not persisted — see the auth architecture notes
  // in lib/auth/storage.ts for why nothing beyond dcs_user_id is written
  // to localStorage. Client-side navigation within this layout doesn't
  // remount it, so this still "sticks" during normal admin use; it only
  // resets on a full page reload.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/dcs-panel/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <QueryProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-screen bg-muted/30">
          <Sidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar
              collapsed={collapsed}
              onToggleCollapsed={() => setCollapsed((v) => !v)}
              onOpenMobile={() => setMobileOpen(true)}
            />

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
          </div>
        </div>
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </QueryProvider>
  );
}
