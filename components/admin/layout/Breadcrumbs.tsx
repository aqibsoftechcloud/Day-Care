"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { findNavItemForPath } from "@/lib/navigation";

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/dcs-panel") {
    return (
      <Breadcrumb>
        <BreadcrumbList className="flex-nowrap gap-1.5 overflow-x-auto text-[13px]">
          <BreadcrumbItem>
            <LayoutDashboard className="size-4 text-muted-foreground" aria-hidden="true" />
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-foreground">Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const match = findNavItemForPath(pathname);

  if (!match) {
    return null;
  }

  const { group, item } = match;
  const isSubPage = pathname !== item.href;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap gap-1.5 overflow-x-auto text-[13px]">
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/dcs-panel">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <span className="whitespace-nowrap text-muted-foreground">{group.label}</span>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isSubPage ? (
            <BreadcrumbLink asChild className="text-muted-foreground hover:text-foreground">
              <Link href={item.href}>{item.label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="font-semibold text-foreground">{item.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
