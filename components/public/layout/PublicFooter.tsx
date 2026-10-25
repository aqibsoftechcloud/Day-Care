import Link from "next/link";
import { ArrowRight, Clock, Globe, Mail, MapPin, MessageSquare, Phone, type LucideIcon } from "lucide-react";
import { getPublicCities } from "@/lib/public/cities";
import { contactItemHref } from "@/lib/public/contact-page";
import { getPublicFooterSettings, resolveFooterColumns, resolveFooterHref } from "@/lib/public/footer";
import { getPublicMenuTree } from "@/lib/public/menu";
import { getPublicPages, isLegalPage } from "@/lib/public/pages";
import { MobileFooterGroup } from "./MobileFooterGroup";
import { FooterColumn } from "./FooterColumn";
import { getContactUsUrl } from "@/lib/public/urls";
import { SOCIAL_PLATFORM_LABELS } from "@/types/footer-settings";
import type { ContactIconKey } from "@/types/contact-page-settings";

type PublicFooterProps = {
  /** Same resolved city id every other public layout piece receives (`null` on the nationwide `/` homepage and on a generic CMS page with no city, mirroring `PublicHeader`'s own prop) — never re-derived here. */
  currentCityId: number | null;
  /**
   * Whether to render the appointment banner below. Defaults to `true` — every existing
   * caller (Homepage, City home, Treatment, Speciality, Doctor) is
   * unaffected. The Hospital Detail route and the Contact Us page pass
   * `false`: those pages carry their own CMS-driven / form-based
   * conversion UI and a second banner beneath it would be redundant. The
   * banner is ALSO controlled by Footer Settings (admin can switch it
   * off site-wide); it renders only when both allow it.
   */
  showAppointmentBanner?: boolean;
  /** Tighter vertical padding (opt-in; the Doctor Detail page). Same content and links; defaults to false so every other page is unchanged. */
  compact?: boolean;
};

const CONTACT_ICONS: Record<ContactIconKey, LucideIcon> = {
  email: Mail,
  phone: Phone,
  location: MapPin,
  clock: Clock,
  globe: Globe,
  message: MessageSquare,
};

/**
 * The shared public footer. Everything it shows is configured in Admin →
 * Settings → Footer Settings (brand/logo, description, CTA banner, column
 * headings and links, contact rows, social links, bottom links, copyright)
 * and read through `getPublicFooterSettings()`; the three footer colours
 * come from Website Appearance via CSS variables. Columns can also pull
 * automatic links — active cities, CMS pages the admin marked "Company
 * links", and Menu Management items placed in the Footer region — all
 * scoped to the current city context (a city-specific page only ever shows
 * in its own city's footer). The legal bar lists pages marked "Legal links".
 * Saved links may use `{home}` / `{contact}` tokens, resolved here so one
 * link works on the global site and in every city.
 */
export async function PublicFooter({ currentCityId, showAppointmentBanner = true, compact = false }: PublicFooterProps) {
  const [settings, cities, pages] = await Promise.all([
    getPublicFooterSettings(),
    getPublicCities(),
    getPublicPages(currentCityId),
  ]);

  const currentCity = cities.find((city) => city.id === currentCityId) ?? null;
  // `getPublicMenuTree` needs the resolved city's `seo_url` (to build the
  // one city-scoped listing link, `hospitals` — see that function's own
  // doc comment), so this fetch runs after `cities` resolves `currentCity`.
  const menuTree = await getPublicMenuTree({ cityId: currentCityId, citySeoUrl: currentCity?.seoUrl ?? null });
  const linkContext = {
    homeHref: currentCity ? currentCity.href : "/",
    contactHref: getContactUsUrl({ cityId: currentCityId }),
  };

  const columns = resolveFooterColumns(settings, { ...linkContext, cities, pages, menuTree });
  const legalLinks = [
    ...pages.filter(isLegalPage).map((page) => ({ label: page.title, href: page.href })),
    ...settings.bottom_links.map((link) => ({ label: link.label, href: resolveFooterHref(link.href, linkContext) })),
  ];
  const contactItems = settings.contact_items.filter((item) => item.visible);
  const socialLinks = settings.social_links.filter((link) => link.visible);
  const ctaHref = settings.cta_button_url ? resolveFooterHref(settings.cta_button_url, linkContext) : linkContext.contactHref;
  const copyright = settings.copyright_text.replaceAll("{year}", String(new Date().getFullYear()));

  return (
    <footer className="bg-(--color-footer-background) text-white">
      {/* ---------------- Appointment CTA banner ---------------- */}
      {showAppointmentBanner && settings.cta_enabled && (
        <div className="border-b border-white/10">
          <div className={`public-container flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left ${compact ? "py-7" : "py-10"}`}>
            <div>
              <p className="text-xl font-black tracking-tight sm:text-2xl text-(--color-footer-heading)">{settings.cta_heading}</p>
              {settings.cta_description && <p className="mt-1.5 text-sm text-white/70">{settings.cta_description}</p>}
            </div>
            <Link
              href={ctaHref}
              className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-footer-background)"
            >
              {settings.cta_button_label}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      {/* ---------------- Brand + navigation columns ---------------- */}
      <div className={`public-container ${compact ? "py-9" : "py-14"}`}>
        {/* Desktop grid: the brand block plus one equal column per visible footer column (4 columns = the original layout). */}
        <div
          className="lg:grid lg:gap-8 lg:[grid-template-columns:var(--footer-grid)]"
          style={{ "--footer-grid": `minmax(0,1.3fr) repeat(${Math.max(columns.length, 1)}, minmax(0,1fr))` } as React.CSSProperties}
        >
          <div className="max-w-sm lg:mr-2">
            <Link
              href="/"
              className="inline-flex items-center text-xl font-black tracking-tight text-(--color-footer-heading) focus-visible:outline-none"
            >
              {settings.logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo of unknown dimensions, served from /uploads.
                <img src={settings.logo} alt={`${settings.brand_primary} ${settings.brand_accent}`.trim()} className="h-10 w-auto max-w-56 object-contain" />
              ) : (
                <>
                  {settings.brand_primary}
                  {settings.brand_accent && <span className="ml-1.5 text-(--color-footer-link)">{settings.brand_accent}</span>}
                </>
              )}
            </Link>
            {settings.description && <p className="mt-4 text-sm leading-relaxed text-white/70">{settings.description}</p>}

            {contactItems.length > 0 && (
              <ul className="mt-5 flex flex-col gap-2.5" aria-label="Contact details">
                {contactItems.map((item, index) => {
                  const Icon = CONTACT_ICONS[item.icon];
                  const href = contactItemHref(item);
                  return (
                    <li key={`${item.icon}-${index}`} className="flex items-start gap-2.5 text-sm text-white/70">
                      <Icon className="mt-0.5 size-4 shrink-0 text-(--color-footer-link)" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="sr-only">{item.label} </span>
                        {href ? (
                          <a href={href} className="transition-colors hover:text-(--color-footer-link)">
                            {item.value}
                          </a>
                        ) : (
                          item.value
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {socialLinks.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Social media">
                {socialLinks.map((link) => (
                  <li key={link.platform + link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80 transition-colors hover:border-(--color-footer-link) hover:text-(--color-footer-link) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-footer-link)"
                    >
                      {SOCIAL_PLATFORM_LABELS[link.platform]}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Desktop: static columns (`contents` makes each a direct grid cell next to the brand block) */}
          <div className="mt-10 hidden lg:mt-0 lg:contents">
            {columns.map((column) => (
              <FooterColumn key={column.title} title={column.title} links={column.links} />
            ))}
          </div>
        </div>

        {/* Mobile / tablet: collapsible groups */}
        <div className="mt-8 lg:hidden">
          {columns.map((column) => (
            <MobileFooterGroup key={column.title} title={column.title}>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/70 transition-colors hover:text-(--color-footer-link)"
                >
                  {link.label}
                </Link>
              ))}
            </MobileFooterGroup>
          ))}
        </div>
      </div>

      {/* ---------------- Bottom bar ---------------- */}
      <div className="border-t border-white/10">
        <div className={`public-container flex flex-col items-center justify-between gap-3 text-center text-xs text-white/60 sm:flex-row sm:text-left ${compact ? "py-4" : "py-6"}`}>
          <p>{copyright}</p>
          {legalLinks.length > 0 && (
            <nav aria-label="Legal">
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
