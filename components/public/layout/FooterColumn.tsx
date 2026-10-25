import Link from "next/link";

export type FooterLink = {
  label: string;
  href: string;
};

type FooterColumnProps = {
  title: string;
  links: FooterLink[];
};

/** One static navigation column in the desktop footer grid (`hidden lg:block` — see `PublicFooter`, which renders the same `links` inside a `MobileFooterGroup` for small screens). */
export function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <nav aria-label={title}>
      <h3 className="text-sm font-bold tracking-wide text-(--color-footer-heading) uppercase">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-(--color-footer-link) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-footer-link) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-footer-background)"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
