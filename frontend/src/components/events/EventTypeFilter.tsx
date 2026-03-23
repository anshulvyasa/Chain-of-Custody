'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EVENT_TYPES = [
  { value: 'All', label: 'All Events' },
  { value: 'CaseAdded', label: 'Case Added' },
  { value: 'InvestigatorAddedToCase', label: 'Investigator Added' },
  { value: 'DocumentHashAdded', label: 'Document Hash Added' },
  { value: 'NewInvestigatorAdded', label: 'New Investigator' },
  { value: 'RemoveExistingInvestigator', label: 'Remove Investigator' },
  { value: 'RemoveCompromizedInvestigator', label: 'Remove Compromised' },
] as const;

interface EventTypeFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function EventTypeFilter({ value, onChange }: EventTypeFilterProps) {
  return (
    <Select
      value={value ?? 'All'}
      onValueChange={(val) => onChange(!val || val === 'All' ? undefined : val)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Filter by event type" />
      </SelectTrigger>
      <SelectContent>
        {EVENT_TYPES.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
