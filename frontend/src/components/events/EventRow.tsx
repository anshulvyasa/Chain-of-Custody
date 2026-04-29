'use client';

import {
  ShieldAlert,
  Activity,
  FileSearch,
  Eye,
  UserPlus,
  UserMinus,
  UserX,
  Lock,
  Unlock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TableCell, TableRow } from '@/components/ui/table';
import type { EventItem } from '@/lib/apiHooks';

const EVENT_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  CaseAdded: {
    icon: ShieldAlert,
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    label: 'Case Added',
  },
  InvestigatorAddedToCase: {
    icon: UserPlus,
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    label: 'Investigator Added',
  },
  InvestigatorRemovedFromCase: {
    icon: UserMinus,
    color: 'bg-red-500/15 text-red-400 border-red-500/25',
    label: 'Investigator Removed',
  },
  DocumentHashAdded: {
    icon: FileSearch,
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    label: 'Doc Hash Added',
  },
  AccessDocument: {
    icon: Eye,
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    label: 'Document Accessed',
  },
  NewInvestigatorAdded: {
    icon: UserPlus,
    color: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
    label: 'New Investigator',
  },
  RemoveExistingInvestigator: {
    icon: UserMinus,
    color: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
    label: 'Remove Investigator',
  },
  RemoveCompromizedInvestigator: {
    icon: UserX,
    color: 'bg-red-500/15 text-red-400 border-red-500/25',
    label: 'Compromised Removed',
  },
  InvestigatorPathAllowed: {
    icon: Unlock,
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    label: 'Path Allowed',
  },
  InvestigatorPathRevoked: {
    icon: Lock,
    color: 'bg-red-500/15 text-red-400 border-red-500/25',
    label: 'Path Revoked',
  },
};

const DEFAULT_CONFIG = {
  icon: Activity,
  color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  label: 'Unknown',
};

function truncateAddress(address: string | null | undefined) {
  if (!address) return '—';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function AddressCell({ address }: { address: string | null | undefined }) {
  if (!address) return <span className="text-zinc-500">—</span>;

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className="font-mono text-xs cursor-default rounded bg-muted px-2 py-1 text-foreground border">
          {truncateAddress(address)}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="font-mono text-xs break-all">{address}</span>
      </TooltipContent>
    </Tooltip>
  );
}

interface EventRowProps {
  event: EventItem;
  onClick?: () => void;
}

export function EventRow({ event, onClick }: EventRowProps) {
  const config = EVENT_CONFIG[event.type] ?? DEFAULT_CONFIG;
  const Icon = config.icon;
  const ts = new Date(event.timestamp);

  return (
    <TableRow
      className="hover:bg-white/[0.03] transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Event Type */}
      <TableCell>
        <Badge
          variant="outline"
          className={`gap-1.5 ${config.color}`}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </TableCell>

      {/* Timestamp */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-foreground">
            {ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </TableCell>

      {/* Initiator */}
      <TableCell>
        <AddressCell address={event.initiatorAddress} />
      </TableCell>

      {/* Case */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-foreground">{event.caseTitle ?? event.caseId}</span>
          {event.caseTitle && (
            <span className="text-[11px] text-muted-foreground font-mono">{event.caseId}</span>
          )}
        </div>
      </TableCell>

      {/* Involved */}
      <TableCell>
        <AddressCell address={event.involvedInvestigator} />
      </TableCell>

      {/* Extra (hash/cid/path) */}
      <TableCell className="text-right max-w-[200px]">
        {event.documentPath && (
          <span className="text-xs text-muted-foreground block truncate" title={event.documentPath}>
            📁 {event.documentPath}
          </span>
        )}
        {event.hash && (
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs text-muted-foreground font-mono cursor-default block truncate">
                # {truncateAddress(event.hash)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <span className="font-mono text-xs break-all">{event.hash}</span>
            </TooltipContent>
          </Tooltip>
        )}
        {event.cid && (
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs text-muted-foreground font-mono cursor-default block truncate">
                🔗 {truncateAddress(event.cid)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <span className="font-mono text-xs break-all">{event.cid}</span>
            </TooltipContent>
          </Tooltip>
        )}
        {!event.documentPath && !event.hash && !event.cid && (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
