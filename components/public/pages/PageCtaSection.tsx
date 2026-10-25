import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicCtaSection } from "@/lib/public/page-sections";

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

export function PageCtaSection({ section }: { section: PublicCtaSection }) {
  const external = isExternalUrl(section.buttonUrl);

  return (
    <section aria-labelledby={`page-cta-${section.id}`} className="bg-(--public-primary)">
      <div className="public-container flex flex-col items-center gap-6 py-16 text-center sm:py-20">
        <h2 id={`page-cta-${section.id}`} className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {section.heading}
        </h2>
        {section.description && <p className="max-w-xl text-base text-white/70 sm:text-lg">{section.description}</p>}
        {external ? (
          <a
            href={section.buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-lg bg-(--public-accent) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
          >
            {section.buttonText}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </a>
        ) : (
          <Link
            href={section.buttonUrl}
            className="group inline-flex items-center gap-2 rounded-lg bg-(--public-accent) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
          >
            {section.buttonText}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />

          </Link>
        )}
      </div>
    </section>
  );
}
