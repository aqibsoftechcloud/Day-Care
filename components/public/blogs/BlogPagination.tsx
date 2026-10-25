import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getBlogsUrl } from "@/lib/public/urls";

type BlogPaginationProps = {
  page: number;
  totalPages: number;
};

function pageHref(page: number): string {
  return page <= 1 ? getBlogsUrl() : `${getBlogsUrl()}?page=${page}`;
}

/**
 * Numbered `1 2 … N` pagination for `/blogs`, built on the existing
 * (previously unused by any public page) shadcn `Pagination` primitives
 * in `components/ui/pagination.tsx` — real `<a href="/blogs?page=N">`
 * links, not client-only state, so each page is its own crawlable,
 * server-rendered URL. Only rendered by the caller when `totalPages > 1`.
 */
export function BlogPagination({ page, totalPages }: BlogPaginationProps) {
  // Always show: 1, the current page +/-1, and the last page, with an
  // ellipsis filling any gap — the same "don't list all 69 pages" shape
  // the reference itself uses ("1 2 … 69").
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
  const sorted = Array.from(pages).sort((a, b) => a - b);

  return (
    <Pagination>
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious href={pageHref(page - 1)} />
          </PaginationItem>
        )}

        {sorted.map((p, index) => {
          const previous = sorted[index - 1];
          const showEllipsisBefore = previous !== undefined && p - previous > 1;

          return (
            <PaginationItem key={p} className="flex items-center">
              {showEllipsisBefore && <PaginationEllipsis className="mr-0.5" />}
              <PaginationLink href={pageHref(p)} isActive={p === page}>
                {p}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {page < totalPages && (
          <PaginationItem>
            <PaginationNext href={pageHref(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
