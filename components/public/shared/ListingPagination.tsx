import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type ListingPaginationProps = {
  page: number;
  totalPages: number;
  /** Builds the href for a given page number — the caller owns its own base URL (`/doctors`, `/hospitals`, `/treatments`, `/specialities`). */
  buildHref: (page: number) => string;
};

/**
 * Generic numbered `1 2 … N` pagination, extracted from
 * `components/public/blogs/BlogPagination.tsx`'s own logic (kept there
 * untouched — Blogs is locked) so the four new global listings don't each
 * carry their own near-duplicate copy. Same shadcn `Pagination`
 * primitives, same real `<a href>` links (crawlable, server-rendered —
 * never client-only state), same "always show 1, current±1, and the last
 * page, with an ellipsis filling the gap" shape.
 */
export function ListingPagination({ page, totalPages, buildHref }: ListingPaginationProps) {
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = Array.from(pages).sort((a, b) => a - b);

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={buildHref(page - 1)} />
          </PaginationItem>
        )}

        {sorted.map((p, index) => {
          const previous = sorted[index - 1];
          const showEllipsisBefore = previous !== undefined && p - previous > 1;

          return (
            <PaginationItem key={p} className="flex items-center">
              {showEllipsisBefore && <PaginationEllipsis className="mr-0.5" />}
              <PaginationLink href={buildHref(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext href={buildHref(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
