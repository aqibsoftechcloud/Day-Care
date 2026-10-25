import type { Metadata } from "next";
import { Clock, Globe, Mail, MapPin, MessageSquare, Phone, type LucideIcon } from "lucide-react";
import { PublicHeader } from "@/components/public/layout/PublicHeader";
import { PublicFooter } from "@/components/public/layout/PublicFooter";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { contactItemHref, getPublicContactPage } from "@/lib/public/contact-page";
import { buildPublicMetadata } from "@/lib/public/seo";
import { getContactUsUrl } from "@/lib/public/urls";
import type { ContactIconKey } from "@/types/contact-page-settings";
import { cn } from "@/lib/utils";
import { PublicBreadcrumb } from "@/components/public/shared/PublicBreadcrumb";

type ContactUsPageProps = {
  searchParams: Promise<{ city?: string | string[]; treatment?: string | string[] }>;
};

const ICONS: Record<ContactIconKey, LucideIcon> = {
  email: Mail,
  phone: Phone,
  location: MapPin,
  clock: Clock,
  globe: Globe,
  message: MessageSquare,
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Title, description and keywords come from Admin → Settings → Contact Page Settings. */
export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicContactPage();
  const metadata = buildPublicMetadata({
    title: settings.meta_title || "Contact Us",
    description: settings.meta_description || undefined,
    // Always the bare path: ?city=/?treatment= only preselect form values, they are not distinct content.
    canonicalPath: getContactUsUrl(),
    keywords: settings.meta_keyword ? settings.meta_keyword.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
  });
  return metadata;
}

/**
 * `/contact-us` — the global, city-independent page every appointment /
 * consultation CTA links to (the old `/book-appointment` redirects here).
 *
 * Two independent, admin-managed sources:
 *  - the left column (badge, heading, description, contact rows, SEO) from
 *    Contact Page Settings;
 *  - the form from Consultation Form Settings, rendered by the shared
 *    `AppointmentLeadForm` (`contact` variant = presentation only).
 *
 * `?city=` / `?treatment=` are only hints: parsed to strict shapes here,
 * applied by the form only when they match a real active option, and the
 * server re-validates every submitted id regardless.
 */
export default async function ContactUsRoute({ searchParams }: ContactUsPageProps) {
  const params = await searchParams;
  const cityParam = first(params.city);
  const treatmentParam = first(params.treatment);
  const cityId = cityParam && /^\d{1,10}$/.test(cityParam) ? Number(cityParam) : null;
  const treatment = treatmentParam && /^(city|global):\d{1,10}$/.test(treatmentParam) ? treatmentParam : null;

  const { settings, loadError } = await getPublicContactPage();
  const items = settings.show_contact_details ? settings.contact_items.filter((item) => item.visible) : [];
  const formFirst = settings.form_position === "left";

  return (
    <>
      <PublicHeader currentCityId={null} />
      <main className="bg-white">
        <section aria-labelledby="contact-us-heading">
          <div className="public-container pt-6">
            <PublicBreadcrumb items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />
          </div>
          <div className="public-container grid items-center gap-10 pb-12 pt-6 sm:pb-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
            <div className={cn("max-w-xl", formFirst && "lg:order-2")}>
              {settings.show_badge && settings.badge_text && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 shadow-xs">
                  <Mail className="size-3.5 text-slate-500" aria-hidden="true" />
                  {settings.badge_text}
                </span>
              )}

              <h1 id="contact-us-heading" className="mt-5 max-w-md text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                {settings.heading}
              </h1>
              <p className="mt-5 max-w-sm text-base text-slate-500">{settings.description}</p>

              {loadError && (
                <p role="alert" className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Our contact details couldn&apos;t be loaded right now. The form below still works.
                </p>
              )}

              {items.length > 0 && (
                <ul className="mt-8 flex flex-col gap-5" aria-label="Contact details">
                  {items.map((item, index) => {
                    const Icon = ICONS[item.icon];
                    const href = contactItemHref(item);
                    return (
                      <li key={`${item.icon}-${index}`} className="flex items-center gap-4">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-(--public-accent)/10 text-(--public-accent)">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{item.label}</p>
                          {href ? (
                            <a href={href} className="block text-sm font-semibold text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--public-accent) focus-visible:ring-offset-2">
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div id="contact-us-form" className={cn("w-full scroll-mt-24 lg:max-w-lg", formFirst ? "lg:order-1 lg:justify-self-start" : "lg:justify-self-end")}>
              <AppointmentLeadForm
                variant="contact"
                showHeading={settings.show_form_heading}
                defaultCityId={cityId}
                defaultTreatment={treatment}
              />
            </div>
          </div>
        </section>
      </main>
      <PublicFooter currentCityId={null} showAppointmentBanner={false} />
    </>
  );
}
