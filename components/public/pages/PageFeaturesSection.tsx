"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import type { PublicFeaturesSection } from "@/lib/public/page-sections";

function FeatureIcon({ imageUrl }: { imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--public-primary)/5 text-(--public-primary)">
      {showImage ? (
        <Image
          src={imageUrl as string}
          alt=""
          width={24}
          height={24}
          className="size-6 object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <CheckCircle2 className="size-5" aria-hidden="true" />
      )}
    </div>
  );
}

export function PageFeaturesSection({ section }: { section: PublicFeaturesSection }) {
  return (
    <section aria-labelledby={`page-features-${section.id}`} className="public-container py-16 sm:py-20">
      <h2
        id={`page-features-${section.id}`}
        className="text-center text-3xl font-black tracking-tight text-(--public-primary) sm:text-4xl"
      >
        {section.heading}
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {section.items.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="flex flex-col gap-4 rounded-(--public-radius-card) border border-slate-200 bg-white p-6"
          >
            <FeatureIcon imageUrl={item.imageUrl} />
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            {item.description && <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
