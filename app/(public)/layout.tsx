import { Inter } from "next/font/google";
import { getPublicTheme, themeTokensToCssText } from "@/lib/public/theme";
import { getPublicConsultationForm } from "@/lib/public/consultation-form";
import { ConsultationFormConfigProvider } from "@/components/public/home/ConsultationFormConfigContext";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * Minimal public site shell for Phase 1 (header only). Applies Inter via
 * `inter.className` (next/font's own generated class) rather than the
 * Tailwind `font-sans` utility — that utility resolves to
 * `--font-geist-sans` at the theme level (set for the admin CMS in
 * app/globals.css), so using it here would silently render Geist instead.
 *
 * The header itself is NOT rendered here: it needs the current route's
 * resolved city id (see `PublicHeader`'s `currentCityId` prop), and a
 * layout above the `[rootSlug]` segment has no way to read that segment's
 * params. Each route renders `PublicHeader` itself with the city context
 * it resolves — see `app/(public)/page.tsx` and
 * `app/(public)/[rootSlug]/page.tsx`.
 *
 * The admin-editable design theme (Admin → Settings → Website Appearance)
 * is resolved exactly ONCE here, at the root of every public route, and
 * emitted as a `:root` CSS variable block above the page content — never
 * fetched again inside Header/Footer/Hero/CTA/Card/FAQ/etc. Those
 * components simply reference the same variable names they already used
 * (`--public-primary`, `--public-accent`, and the newer `--color-*`
 * tokens) via Tailwind's `bg-(--token-name)` arbitrary-value syntax; this
 * `<style>` tag is what makes an admin change visible without touching
 * every consumer. See lib/public/theme.ts for the full token list and
 * why colorPrimary/colorAccent reuse the pre-existing variable names.
 *
 * The shared AppointmentLeadForm's admin-editable title/description
 * (Admin → Settings → Consultation Form Settings) is resolved here too,
 * for the same reason: that form is a client component rendered from
 * several different server components deep in the tree, so resolving it
 * once here and handing it down via `ConsultationFormConfigProvider`
 * avoids both prop-drilling through every Hero/Final-CTA call site and
 * each form instance independently fetching the same two strings.
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [theme, consultationFormConfig] = await Promise.all([
    getPublicTheme(),
    getPublicConsultationForm(),
  ]);

  return (
    <div className={inter.className}>
      <style dangerouslySetInnerHTML={{ __html: themeTokensToCssText(theme) }} />
      <ConsultationFormConfigProvider config={consultationFormConfig}>{children}</ConsultationFormConfigProvider>
    </div>
  );
}
