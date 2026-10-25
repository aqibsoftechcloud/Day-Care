"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { PublicMenuItem } from "@/lib/public/menu-tree";
import type { NavSpecialityItem } from "./navigation";
import type { PublicNavLinkGroups } from "@/lib/public/public-nav-links";

type PublicMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  /** ROW 1 — Menu Management's CMS primary + secondary menu tree, whatever an admin configured there (arbitrary content, so it's kept in its own unlabeled section rather than relabeled as "Patients"/"Company"). */
  cmsRow1Items: PublicMenuItem[];
  /** ROW 2 — Specialities CMS (`getPublicNavSpecialities`), never Menu Management. */
  specialities: NavSpecialityItem[];
  /** Real "For Patients"/"Our Company" groups — the same `buildPublicNavLinkGroups()` data `PublicFooter.tsx` renders, reused here rather than duplicated. */
  navLinks: PublicNavLinkGroups;
  /** `${homeHref}#hospitals-heading` — the same in-page anchor `PublicFooter.tsx`'s own "Hospitals" link already uses (there is no dedicated `/hospitals` route). */
  hospitalsHref: string;
};

/**
 * The mobile navigation drawer — extracted out of `SecondaryNavBar.tsx`
 * (which used to own a hamburger button + this same panel) so it can be
 * triggered from the new compact mobile header (`PublicMobileHeader.tsx`)
 * instead, and enhanced with a hospital CTA + the real "For Patients"/
 * "Our Company" groups `PublicFooter.tsx` already established. Renders
 * nothing when `open` is false (no DOM presence to worry about overflow
 * from when closed).
 */
export function PublicMobileMenu({ open, onClose, cmsRow1Items, specialities, navLinks, hospitalsHref }: PublicMobileMenuProps) {
  // Accordion state — one speciality/menu item open at a time, so a long
  // list doesn't turn into one huge scroll of every treatment at once.
  const [expandedSpecialityId, setExpandedSpecialityId] = useState<number | null>(null);
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);
  const [patientsOpen, setPatientsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const hasRow1 = cmsRow1Items.length > 0;
  const hasRow2 = specialities.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div aria-hidden="true" className="fixed inset-0 bg-black/60 transition-opacity" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto"
      >
        {/* ---------------- Menu header: logo + close ---------------- */}
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-slate-200 bg-(--public-primary) text-white">
          <Link href="/" onClick={onClose} className="font-black tracking-tight text-lg focus-visible:outline-none">
            DAY CARE <span className="text-(--public-accent)">SURGERIES</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="shrink-0 p-1 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* ---------------- Hospital CTA ---------------- */}
        <div className="px-4 py-4 border-b border-slate-100 bg-(--public-primary)/[0.04]">
          <p className="text-sm font-semibold text-slate-800">Find Your Nearest Day Care Surgeries Hospital</p>
          <Link
            href={hospitalsHref}
            onClick={onClose}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-(--public-primary) px-4 py-2 text-xs font-bold tracking-wide text-white uppercase hover:bg-(--public-primary)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2"
          >
            Our Hospitals
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="p-4 space-y-3">
          {/* ROW 1 — Menu Management's CMS primary menu tree, entirely
              CMS-driven. A top-level item with active children gets a
              toggle button (aria-expanded/aria-controls) instead of
              always-expanded children; its own label/link, if any, stays
              independently clickable. */}
          {hasRow1 &&
            cmsRow1Items.map((item) => {
              const hasChildren = item.children.length > 0;
              const isExpanded = expandedMenuId === item.id;
              const panelId = `mobile-menu-${item.id}-children`;

              return (
                <div key={item.id} className="border-b border-slate-100 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    {item.href ? (
                      <Link href={item.href} onClick={onClose} className="flex-1 font-bold text-sm text-slate-800 hover:text-(--public-accent) py-1">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="flex-1 font-bold text-sm text-slate-800 py-1">{item.label}</span>
                    )}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => setExpandedMenuId(isExpanded ? null : item.id)}
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label} menu`}
                        className="shrink-0 rounded-sm p-1.5 text-slate-400 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
                      >
                        <ChevronDown className={`size-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {hasChildren && isExpanded && (
                    <div id={panelId} className="pl-3 mt-1 space-y-1">
                      {item.children.map((child) =>
                        child.href ? (
                          <Link key={child.id} href={child.href} onClick={onClose} className="block text-xs text-slate-600 hover:text-(--public-accent) py-1">
                            {child.label}
                          </Link>
                        ) : (
                          <span key={child.id} className="block text-xs text-slate-400 py-1 cursor-default">
                            {child.label}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* "Our Specialities" — each row shows the speciality name on
              the left and its real `short_description` on the right
              (when the admin has set one), with a chevron accordion when
              it has active treatments. The speciality name always stays
              a direct link; only the chevron toggles the accordion. */}
          {hasRow2 && (
            <div className="border-b border-slate-100 pb-2">
              <span className="block font-bold text-sm text-slate-800 py-1">Our Specialities</span>
              <div className="space-y-1">
                {specialities.map((speciality) => {
                  const hasTreatments = speciality.treatments.length > 0;
                  const isExpanded = expandedSpecialityId === speciality.id;
                  const panelId = `mobile-speciality-${speciality.id}-treatments`;

                  return (
                    <div key={speciality.id} className="pl-1">
                      <div className="flex items-center justify-between gap-2">
                        <Link href={speciality.href} onClick={onClose} className="flex-1 min-w-0 py-1.5">
                          <span className="block text-sm font-semibold text-slate-700 hover:text-(--public-accent)">{speciality.title}</span>
                          {speciality.shortDescription && (
                            <span className="block truncate text-xs text-slate-400">{speciality.shortDescription}</span>
                          )}
                        </Link>
                        {hasTreatments && (
                          <button
                            type="button"
                            onClick={() => setExpandedSpecialityId(isExpanded ? null : speciality.id)}
                            aria-expanded={isExpanded}
                            aria-controls={panelId}
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${speciality.title} treatments`}
                            className="shrink-0 rounded-sm p-1.5 text-slate-400 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
                          >
                            <ChevronDown className={`size-4 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      {hasTreatments && isExpanded && (
                        <div id={panelId} className="pl-3 mt-1 space-y-1">
                          {speciality.treatments.map((treatment) => (
                            <Link key={treatment.id} href={treatment.href} onClick={onClose} className="block text-xs text-slate-600 hover:text-(--public-accent) py-1">
                              {treatment.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* "For Patients" — the same real, pre-existing anchor links
              `PublicFooter.tsx` already renders. */}
          <div className="border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setPatientsOpen((value) => !value)}
              aria-expanded={patientsOpen}
              aria-controls="mobile-menu-patients"
              className="flex w-full items-center justify-between gap-2 py-1 text-left font-bold text-sm text-slate-800 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
            >
              For Patients
              <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-150 ${patientsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {patientsOpen && (
              <div id="mobile-menu-patients" className="pl-3 mt-1 space-y-1">
                {navLinks.patients.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className="block text-xs text-slate-600 hover:text-(--public-accent) py-1">
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* "Our Company" — real CMS footer-placement menu items + admin
              Company Pages. Omitted entirely when both are empty, same
              as `PublicFooter.tsx`'s own guard. */}
          {navLinks.company.length > 0 && (
            <div className="border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => setCompanyOpen((value) => !value)}
                aria-expanded={companyOpen}
                aria-controls="mobile-menu-company"
                className="flex w-full items-center justify-between gap-2 py-1 text-left font-bold text-sm text-slate-800 hover:text-(--public-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent)"
              >
                Our Company
                <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform duration-150 ${companyOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {companyOpen && (
                <div id="mobile-menu-company" className="pl-3 mt-1 space-y-1">
                  {navLinks.company.map((link) => (
                    <Link key={link.href} href={link.href} onClick={onClose} className="block text-xs text-slate-600 hover:text-(--public-accent) py-1">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
