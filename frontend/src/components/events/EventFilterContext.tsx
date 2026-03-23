'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { EventFilterParams } from '@/lib/apiHooks';

interface EventFilterState {
  filters: EventFilterParams;
  page: number;
  setFilters: (filters: EventFilterParams) => void;
  setPage: (page: number) => void;
}

const EventFilterContext = createContext<EventFilterState | null>(null);

export function EventFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersRaw] = useState<EventFilterParams>({});
  const [page, setPage] = useState(1);

  const setFilters = useCallback((newFilters: EventFilterParams) => {
    setFiltersRaw(newFilters);
    setPage(1);
  }, []);

  return (
    <EventFilterContext value={{ filters, page, setFilters, setPage }}>
      {children}
    </EventFilterContext>
  );
}

export function useEventFilters() {
  const ctx = useContext(EventFilterContext);
  if (!ctx) throw new Error('useEventFilters must be used within EventFilterProvider');
  return ctx;
}
