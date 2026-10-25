import { prisma } from "@/lib/prisma";
import { HeroBannerView, type HeroBannerData } from "./HeroBannerView";

interface HeroBannerProps {
  currentCityId: number | null;
  cityName?: string | null;
  /** Threaded straight through to `HeroBannerView` — see its own doc comment. Defaults to `true` (city pages' existing, unchanged behavior). */
  transparentOverHero?: boolean;
}

export async function HeroBanner({ currentCityId, cityName, transparentOverHero }: HeroBannerProps) {
  let banner: HeroBannerData | null = null;

  try {
    const activeBanner = await prisma.banners.findFirst({
      where: {
        status: "active",
        // If on a city route, scope by city_id; if on nationwide route, do not filter by city
        ...(currentCityId !== null ? { city_id: currentCityId } : {}),
      },
      orderBy: [
        { sorting_order: "asc" },
        { id: "desc" },
      ],
      select: {
        id: true,
        banner_name: true,
        banner_url: true,
        banner_image: true,
        mobile_banner_image: true,
      },
    });

    if (activeBanner) {
      banner = {
        id: activeBanner.id,
        name: activeBanner.banner_name,
        url: activeBanner.banner_url,
        desktopImage: activeBanner.banner_image,
        mobileImage: activeBanner.mobile_banner_image,
      };
    }
  } catch (error) {
    console.error("[HeroBanner] Failed to fetch active banner:", error);
  }

  return <HeroBannerView banner={banner} cityName={cityName} transparentOverHero={transparentOverHero} />;
}