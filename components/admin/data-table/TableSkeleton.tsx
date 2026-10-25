import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const WIDTHS = ["w-40", "w-24", "w-20", "w-20", "w-8"];

export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="border-border/70 hover:bg-transparent">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex} className="px-5 py-4">
                <Skeleton className={`h-3.5 ${WIDTHS[colIndex % WIDTHS.length]}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
