'use client';

import { useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Shield } from 'lucide-react';
import { useEvents, EventFilterParams } from '@/lib/apiHooks';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EventFilters } from '@/components/events/EventFilters';
import { EventTable } from '@/components/events/EventTable';
import { EventPagination } from '@/components/events/EventPagination';
import { useEventFilters } from '@/components/events/EventFilterContext';

const PAGE_SIZE = 25;

export default function AuditLogPage() {
  const { address } = useAccount();
  
  // Use context for state to retain it across navigation
  const { filters, page, setFilters, setPage } = useEventFilters();

  const {
    data: events = [],
    isLoading,
    isError,
    isFetching,
  } = useEvents(page, PAGE_SIZE, filters, address);

  const handleFiltersChange = useCallback(
    (newFilters: EventFilterParams) => {
      setFilters(newFilters);
      setPage(1); // Reset to first page when filters change
    },
    []
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <TooltipProvider>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track and verify all chain of custody events across all cases.
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Narrow down events by type or search using hash, CID, or wallet address prefix.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventFilters filters={filters} onFiltersChange={handleFiltersChange} />
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="pt-4">
              <EventTable events={events} isLoading={isLoading} isError={isError} />
            </CardContent>
          </Card>

          {/* Pagination */}
          <EventPagination
            page={page}
            hasMore={events.length >= PAGE_SIZE}
            isFetching={isFetching}
            onPageChange={handlePageChange}
          />
        </div>
    </TooltipProvider>
  );
}
