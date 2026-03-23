'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EventPaginationProps {
  page: number;
  hasMore: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

export function EventPagination({
  page,
  hasMore,
  isFetching,
  onPageChange,
}: EventPaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Page {page}
        {isFetching && (
          <span className="ml-2 inline-flex items-center gap-1 text-sky-400">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Loading...
          </span>
        )}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => onPageChange(page + 1)}
          className="gap-1"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
