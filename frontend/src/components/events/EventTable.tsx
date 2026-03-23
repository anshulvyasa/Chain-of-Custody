'use client';

import { FileWarning } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { EventRow } from './EventRow';
import type { EventItem } from '@/lib/apiHooks';

interface EventTableProps {
  events: EventItem[];
  isLoading: boolean;
  isError: boolean;
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {['Type', 'Timestamp', 'Initiator', 'Case', 'Involved', 'Details'].map((h) => (
            <TableHead key={h} className="text-muted-foreground">
              <Skeleton className="h-4 w-16" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRow key={i}>
            {Array.from({ length: 6 }).map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function EventTable({ events, isLoading, isError }: EventTableProps) {
  const router = useRouter();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FileWarning className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-sm font-medium text-destructive">Failed to load events</p>
        <p className="text-xs text-muted-foreground">Please check your connection and try again.</p>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FileWarning className="h-10 w-10 text-muted-foreground opacity-40" />
        <p className="text-sm font-medium text-muted-foreground">No events found</p>
        <p className="text-xs text-muted-foreground">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="text-xs uppercase tracking-wider">Type</TableHead>
          <TableHead className="text-xs uppercase tracking-wider">Timestamp</TableHead>
          <TableHead className="text-xs uppercase tracking-wider">Initiator</TableHead>
          <TableHead className="text-xs uppercase tracking-wider">Case</TableHead>
          <TableHead className="text-xs uppercase tracking-wider">Involved</TableHead>
          <TableHead className="text-xs uppercase tracking-wider text-right">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((evt) => (
          <EventRow
            key={evt.id}
            event={evt}
            onClick={() => router.push(`/audit/${evt.id}`)}
          />
        ))}
      </TableBody>
    </Table>
  );
}
