"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { PublicHeroSection } from "@/lib/public/page-sections";

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

export function PageHeroSection({ section }: { section: PublicHeroSection }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(section.imageUrl) && !imageFailed;

  return (
    <section aria-labelledby={`page-hero-${section.id}`} className="relative w-full overflow-x-clip bg-(--public-primary)">
      <div className="public-container grid grid-cols-1 items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 id={`page-hero-${section.id}`} className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {section.title}
          </h1>
          {section.subtitle && <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">{section.subtitle}</p>}
          {section.ctaText && section.ctaUrl && (
            <div className="mt-7">
              {isExternalUrl(section.ctaUrl) ? (
                <a
                  href={section.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-lg bg-(--public-accent) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
                >
                  {section.ctaText}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
              ) : (
                <Link
                  href={section.ctaUrl}
                  className="group inline-flex items-center gap-2 rounded-lg bg-(--public-accent) px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--public-accent)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--public-primary)"
                >
                  {section.ctaText}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--public-radius-card)">
          {showImage ? (
            <Image
              src={section.imageUrl as string}
              alt={section.title}
              fill
              sizes="(min-width: 1024px) 48vw, 100vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/5">
              <FileText className="size-16 text-white/20" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
