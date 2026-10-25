import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarHeart,
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Newspaper,
  PackageSearch,
  PanelsTopLeft,
  Quote,
  Settings,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

/** A leaf navigation entry — always a real, existing route with a real backend permission. */
export type NavLeaf = {
  label: string;
  href: string;
  /** Full "<module-slug>.<action-slug>" permission string (verified against the live `permissions` table) gating visibility. Omitted only when `alwaysVisible` is set. */
  permission?: string;
  /** Bypasses permission gating entirely — reserved for the Dashboard link, which has no backend module. */
  alwaysVisible?: boolean;
};

/** A top-level link with no children (currently only Dashboard). */
export type NavLink = NavLeaf & { icon: LucideIcon };

/** A top-level expandable group — every group (even a single-child one) renders through the same dropdown pattern for consistency. */
export type NavGroup = {
  label: string;
  icon: LucideIcon;
  children: NavLeaf[];
};

export type NavEntry = NavLink | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

/**
 * One unified, centralized navigation list for the admin sidebar — no
 * artificial section headings. Every `permission` below is a real,
 * existing backend permission string (verified against the live
 * `permissions` table) and every `href` is unchanged from prior
 * iterations of this file — nothing invented, nothing renamed.
 */
export const NAV_ITEMS: NavEntry[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dcs-panel", alwaysVisible: true },
  {
    label: "User Management",
    icon: Users,
    children: [
      { label: "Users", href: "/dcs-panel/users", permission: "users.view" },
      { label: "Roles", href: "/dcs-panel/roles", permission: "roles.view" },
    ],
  },
  {
    label: "Leads Management",
    icon: Inbox,
    children: [
      { label: "Book an Appointment", href: "/dcs-panel/leads/appointments", permission: "book-an-appointment.view" },
      { label: "Feedback Leads", href: "/dcs-panel/leads/feedback", permission: "feedback-leads.view" },
      { label: "International Patients Leads", href: "/dcs-panel/leads/international-patients", permission: "international-patients-leads.view" },
      { label: "Book-a-Form Data", href: "/dcs-panel/leads/book-a-form", permission: "book-a-form-data.view" },
    ],
  },
  {
    label: "Location Management",
    icon: MapPin,
    children: [
      { label: "Cities", href: "/dcs-panel/cities", permission: "cities.view" },
      { label: "Locations", href: "/dcs-panel/locations", permission: "locations.view" },
    ],
  },
  {
    label: "Content Management",
    icon: FileText,
    children: [
      { label: "Languages", href: "/dcs-panel/languages", permission: "languages.view" },
      { label: "Banners", href: "/dcs-panel/banners", permission: "banners.view" },
      { label: "Menu Management", href: "/dcs-panel/menus", permission: "menu-management.view" },
      { label: "Pages", href: "/dcs-panel/pages", permission: "pages.view" },
      { label: "Doctor Pages", href: "/dcs-panel/doctor-pages", permission: "doctor-pages.view" },
      { label: "Google Reviews", href: "/dcs-panel/google-reviews", permission: "google-reviews.view" },
      { label: "General FAQs", href: "/dcs-panel/general-faqs", permission: "general-faqs.view" },
    ],
  },
  {
    label: "Speciality Management",
    icon: Stethoscope,
    children: [{ label: "Specialities", href: "/dcs-panel/specialities", permission: "specialities.view" },
    { label: "Treatments", href: "/dcs-panel/treatments", permission: "treatments.view" },
    // City-independent "global" content, shown at /dcg/{seoUrl} — separate
    // RBAC modules/permissions from Specialities/Treatments (see
    // global-treatments-management / global-specialities-management),
    // but grouped here visually since admins think about them together.
    { label: "Global Specialities", href: "/dcs-panel/global-specialities", permission: "global-specialities.view" },
    { label: "Global Treatments", href: "/dcs-panel/global-treatments", permission: "global-treatments.view" }
    ],
  },

  {
    label: "Hospitals Management",
    icon: Building2,
    children: [
      { label: "Hospitals", href: "/dcs-panel/hospitals", permission: "hospitals.view" },
      { label: "Insurance Companies", href: "/dcs-panel/insurance-companies", permission: "insurance-companies.view" },
    ],
  },
  {
    label: "Doctor Management",
    icon: UserRound,
    children: [{ label: "Doctors", href: "/dcs-panel/doctors", permission: "doctors.view" },
      { label: "Doctor Specialities", href: "/dcs-panel/doctor-specialities", permission: "doctor-specialities.view" },

    ],
  },

  {
    label: "Blogs Management",
    icon: Newspaper,
    children: [
      { label: "Blog Categories", href: "/dcs-panel/blog-categories", permission: "blog-categories.view" },
      { label: "Blogs", href: "/dcs-panel/blogs", permission: "blogs.view" },
    ],
  },
  {
    label: "Testimonial Management",
    icon: Quote,
    children: [{ label: "Testimonials", href: "/dcs-panel/testimonials", permission: "testimonials.view" }],
  },
  {
    label: "Health Check Packages",
    icon: PackageSearch,
    children: [{ label: "Packages", href: "/dcs-panel/health-packages", permission: "packages.view" }],
  },
  {
    label: "Media Management",
    icon: ImageIcon,
    children: [
      { label: "News & Media", href: "/dcs-panel/news-media", permission: "news-and-media.view" },
      { label: "Events & Calendar", href: "/dcs-panel/events", permission: "events-and-calendar.view" },
      { label: "Gallery", href: "/dcs-panel/gallery", permission: "gallery.view" },
    ],
  },
  {
    label: "Ovulation Calculator",
    icon: CalendarHeart,
    children: [{ label: "Submissions", href: "/dcs-panel/ovulation-calculator", permission: "submissions.view" }],
  },
  {
    label: "Symptom Checker",
    icon: ListChecks,
    children: [
      { label: "Parts", href: "/dcs-panel/symptom-checker/parts", permission: "parts.view" },
      { label: "Symptoms", href: "/dcs-panel/symptom-checker/symptoms", permission: "symptoms.view" },
      { label: "Articles", href: "/dcs-panel/symptom-checker/articles", permission: "articles.view" },
    ],
  },
  {
    label: "Website Content",
    icon: PanelsTopLeft,
    children: [
      { label: "Homepage Icons", href: "/dcs-panel/homepage-icons", permission: "homepage-icons.view" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "JS Configurations", href: "/dcs-panel/js-configurations", permission: "js-configurations.view" },
      { label: "AI Configurations", href: "/dcs-panel/ai-configurations", permission: "ai-configurations.view" },
      { label: "Website Appearance", href: "/dcs-panel/website-appearance", permission: "website-appearance.view" },
      { label: "Consultation Form Settings", href: "/dcs-panel/consultation-form-settings", permission: "consultation-form-settings.view" },
      { label: "Contact Page Settings", href: "/dcs-panel/contact-page-settings", permission: "contact-page-settings.view" },
      { label: "Footer Settings", href: "/dcs-panel/footer-settings", permission: "footer-settings.view" },
    ],
  },
];

/** Finds the {group, item} whose href best matches the current pathname — used to render breadcrumbs and the page title without a second, hand-maintained data source. */
export function findNavItemForPath(
  pathname: string
): { group: { label: string }; item: NavLeaf } | null {
  let best: { group: { label: string }; item: NavLeaf } | null = null;

  for (const entry of NAV_ITEMS) {
    const candidates: { group: { label: string }; item: NavLeaf }[] = isNavGroup(entry)
      ? entry.children.map((item) => ({ group: { label: entry.label }, item }))
      : [{ group: { label: entry.label }, item: entry }];

    for (const candidate of candidates) {
      const { item } = candidate;
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        if (!best || item.href.length > best.item.href.length) {
          best = candidate;
        }
      }
    }
  }

  return best;
}
