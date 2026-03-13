"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPageNumbers } from "./utils";

type Props = {
  currentPage: number;
  totalPages:  number;
  totalItems:  number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

export function ContentPagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex   = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">

      {/* Mobile */}
      <div className="flex sm:hidden flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
        <div className="flex items-center gap-1.5 w-full justify-center flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1} className="h-9 px-3 gap-1 text-xs">
            <ArrowRight className="h-3 w-3 rotate-180" />Prev
          </Button>

          {buildPageNumbers(currentPage, totalPages, true).map((p, i) =>
            p === "…" ? (
              <span key={`me-${i}`} className="px-1 text-muted-foreground text-sm">…</span>
            ) : (
              <Button
                key={`m-${p}`}
                variant={currentPage === p ? "default" : "outline"}
                size="sm"
                className="h-9 w-9 p-0 text-xs"
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}

          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages} className="h-9 px-3 gap-1 text-xs">
            Next<ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground shrink-0">
          Showing {startIndex + 1}–{endIndex} of {totalItems} articles
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1} className="gap-1">
            <ArrowRight className="h-3 w-3 rotate-180" /> Previous
          </Button>

          <div className="flex items-center gap-1">
            {buildPageNumbers(currentPage, totalPages, false).map((p, i) =>
              p === "…" ? (
                <span key={`de-${i}`} className="px-2 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={`d-${p}`}
                  variant={currentPage === p ? "default" : "outline"}
                  size="sm"
                  className="w-10 h-10 p-0"
                  onClick={() => onPageChange(p as number)}
                >
                  {p}
                </Button>
              )
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages} className="gap-1">
            Next <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

    </div>
  );
}