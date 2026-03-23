'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { EventTypeFilter } from './EventTypeFilter';
import { EventSearchBar } from './EventSearchBar';
import type { EventFilterParams } from '@/lib/apiHooks';

interface EventFiltersProps {
  filters: EventFilterParams;
  onFiltersChange: (filters: EventFilterParams) => void;
}

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  // Use ref to always have latest filters without causing re-renders
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const handleTypeChange = useCallback(
    (type: string | undefined) => {
      onFiltersChange({ ...filtersRef.current, type });
    },
    [onFiltersChange]
  );

  const handleSearch = useCallback(
    (field: string, value: string) => {
      onFiltersChange({
        ...filtersRef.current,
        hash: undefined,
        cid: undefined,
        initiatorAddress: undefined,
        [field]: value,
      });
    },
    [onFiltersChange]
  );

  const handleSearchClear = useCallback(() => {
    const current = filtersRef.current;
    // Only update if there's something to clear
    if (!current.hash && !current.cid && !current.initiatorAddress) return;
    onFiltersChange({
      ...current,
      hash: undefined,
      cid: undefined,
      initiatorAddress: undefined,
    });
  }, [onFiltersChange]);

  const handleExactFilterChange = useCallback(
    (key: keyof EventFilterParams, value: string) => {
      onFiltersChange({ ...filtersRef.current, [key]: value || undefined });
    },
    [onFiltersChange]
  );

  const handleClearAll = useCallback(() => {
    onFiltersChange({});
    setMoreOpen(false);
  }, [onFiltersChange]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Primary row: Type filter + Prefix search */}
      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <EventTypeFilter value={filters.type} onChange={handleTypeChange} />
        <EventSearchBar onSearch={handleSearch} onClear={handleSearchClear} />
      </div>

      {/* Expandable extra filters */}
      <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-foreground transition-colors h-8 rounded-md px-3"
          >
            <Filter className="h-3.5 w-3.5" />
            More Filters
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive/80"
            >
              Clear all ({activeFilterCount})
            </Button>
          )}
        </div>

        <CollapsibleContent>
          <Separator className="my-3" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Case ID</label>
              <Input
                value={filters.caseId ?? ''}
                onChange={(e) => handleExactFilterChange('caseId', e.target.value)}
                className=""
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Case Title</label>
              <Input
                value={filters.caseTitle ?? ''}
                onChange={(e) => handleExactFilterChange('caseTitle', e.target.value)}
                className=""
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Involved Investigator</label>
              <Input
                value={filters.involvedInvestigator ?? ''}
                onChange={(e) => handleExactFilterChange('involvedInvestigator', e.target.value)}
                className=""
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Document Path</label>
              <Input
                value={filters.documentPath ?? ''}
                onChange={(e) => handleExactFilterChange('documentPath', e.target.value)}
                className=""
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
