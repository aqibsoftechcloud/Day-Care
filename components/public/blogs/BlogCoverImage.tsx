"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

/** How long the optimised (resized, WebP/AVIF) version gets before the original file is used instead. */
const OPTIMIZER_TIMEOUT_MS = 6000;

type BlogCoverImageProps = {
  /** Same-origin `/uploads/...` path from the CMS, or null when the blog has no cover image. */
  src: string | null;
  alt: string;
  sizes: string;
  /** Eager-load (above-the-fold featured image). */
  priority?: boolean;
  className?: string;
};

type Mode = "optimized" | "original" | "failed";

/**
 * A blog cover that can never end up as a blank grey block.
 *
 * - The container ALWAYS paints a branded healthcare placeholder (navy
 *   gradient + stethoscope) underneath, so a missing, slow or broken image
 *   just looks like the designed fallback.
 * - The image is served through Next's optimizer first. That request can
 *   stall (no response at all, which never triggers `onError`), so if it
 *   hasn't loaded within a few seconds the SAME file is requested
 *   un-optimised; if that fails too, the image is dropped and only the
 *   placeholder remains. Blog covers are small admin uploads, so serving the
 *   original as a fallback is cheap.
 * - Fixed by its parent's aspect ratio (this component is `absolute
 *   inset-0`), so there is no layout shift while loading.
 */
export function BlogCoverImage({ src, alt, sizes, priority = false, className }: BlogCoverImageProps) {
  const [mode, setMode] = useState<Mode>(src ? "optimized" : "failed");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (mode !== "optimized" || loaded) return;
    const timer = window.setTimeout(() => setMode("original"), OPTIMIZER_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [mode, loaded]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-(--color-hero-background) to-(--public-primary)/80">
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/10 text-white/70 ring-1 ring-white/15">
          <Stethoscope className="size-8" strokeWidth={1.5} />
        </span>
      </div>

      {src && mode !== "failed" && (
        <Image
          key={mode}
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={mode === "original"}
          onLoad={() => setLoaded(true)}
          onError={() => setMode((current) => (current === "optimized" ? "original" : "failed"))}
          className={cn("object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
        />
      )}
    </div>
  );
}
