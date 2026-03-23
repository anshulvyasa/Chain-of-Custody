'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SEARCH_FIELDS = [
  { value: 'hash', label: 'Hash' },
  { value: 'cid', label: 'CID' },
  { value: 'initiatorAddress', label: 'Wallet Address' },
] as const;

type SearchField = (typeof SEARCH_FIELDS)[number]['value'];

interface EventSearchBarProps {
  onSearch: (field: SearchField, value: string) => void;
  onClear: () => void;
}

export function EventSearchBar({ onSearch, onClear }: EventSearchBarProps) {
  const [field, setField] = useState<SearchField>('hash');
  const [query, setQuery] = useState('');

  // Use refs to avoid stale closure / infinite re-render loops
  const onSearchRef = useRef(onSearch);
  const onClearRef = useRef(onClear);
  onSearchRef.current = onSearch;
  onClearRef.current = onClear;

  // Debounce: fire after 300ms of no typing
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      onClearRef.current();
      return;
    }

    const timer = setTimeout(() => {
      onSearchRef.current(field, trimmed);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, field]);

  const handleFieldChange = useCallback((val: string | null) => {
    if (!val) return;
    setField(val as SearchField);
    setQuery('');
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Select value={field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[160px] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SEARCH_FIELDS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search by ${SEARCH_FIELDS.find((f) => f.value === field)?.label ?? field} prefix...`}
          className="pl-10"
        />
      </div>
    </div>
  );
}
