"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Breadcrumbs } from "@/components/admin/layout/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopbarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onOpenMobile: () => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export function Topbar({ collapsed, onToggleCollapsed, onOpenMobile }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      router.push("/dcs-panel/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-sm sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMobile}
        className="lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapsed}
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-4.5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
      </Tooltip>

      <div className="hidden h-5 w-px bg-border lg:block" aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-muted"
            >
              <Avatar size="sm" className="ring-2 ring-border">
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block text-label text-foreground">{user.name}</span>
                <span className="block text-caption">{user.role.name}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-foreground/70 sm:block" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                {user.role.name}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={loggingOut} onSelect={handleLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              {loggingOut ? "Logging out…" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
