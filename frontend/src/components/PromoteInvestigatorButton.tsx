'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowUpCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useInvestigatorContractActions, useIsInvestigator } from '@/lib/hooks';

type PromotionTarget = 'ADMIN' | 'SPECIALADMIN';

export default function PromoteInvestigatorButton() {
  const { data: isInvestigatorData } = useIsInvestigator();

  const investigatorAuthority = useMemo(() => {
    if (isInvestigatorData && Array.isArray(isInvestigatorData) && isInvestigatorData.length === 2 && isInvestigatorData[1]) {
      const roleIdx = Number(isInvestigatorData[0]);
      if (roleIdx === 0) return 'SPECIALADMIN';
      if (roleIdx === 1) return 'ADMIN';
      if (roleIdx === 2) return 'NORMAL';
    }
    return 'NONE';
  }, [isInvestigatorData]);

  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [promoteTo, setPromoteTo] = useState<PromotionTarget>('ADMIN');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  const { isConnected } = useAccount();
  const { promoteToAdmin, promoteToSpecialAdmin } = useInvestigatorContractActions();

  // Only SpecialAdmin can promote
  if (investigatorAuthority !== 'SPECIALADMIN') {
    return null;
  }

  const handleSubmit = async () => {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      setStatus({ type: 'error', message: 'Please enter a valid Ethereum address.' });
      return;
    }
    if (!isConnected) {
      setStatus({ type: 'error', message: 'Wallet not connected.' });
      return;
    }

    try {
      if (promoteTo === 'ADMIN') {
        setStatus({ type: 'loading', message: 'Promoting investigator to Admin...' });
        await promoteToAdmin(address);
      } else {
        setStatus({ type: 'loading', message: 'Promoting investigator to Special Admin...' });
        await promoteToSpecialAdmin(address);
      }

      setStatus({ type: 'success', message: `Investigator promoted to ${promoteTo === 'ADMIN' ? 'Admin' : 'Special Admin'} successfully!` });
      setTimeout(() => setIsOpen(false), 2000);

    } catch (err: any) {
      console.error(err);
      const msg = err.shortMessage || err.message || 'Transaction failed';
      setStatus({ type: 'error', message: msg });
    }
  };

  const resetState = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setAddress('');
      setPromoteTo('ADMIN');
      setStatus({ type: 'idle', message: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger>
        <div className="px-3 py-1.5 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300 rounded-md transition-colors flex items-center shadow-lg text-xs font-medium border border-amber-500/30 gap-1.5 cursor-pointer">
          <ArrowUpCircle className="w-3.5 h-3.5" />
          Promote Investigator
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <ArrowUpCircle className="w-5 h-5 text-amber-400" />
            Promote Investigator
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Investigator Wallet Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              placeholder="0x..."
              disabled={status.type === 'loading'}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Promote To
            </label>
            <Select
              value={promoteTo}
              onValueChange={(val) => { if (val) setPromoteTo(val as PromotionTarget); }}
              disabled={status.type === 'loading'}
            >
              <SelectTrigger className="w-full bg-black/50 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select promotion target" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4} className="bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectItem value="ADMIN">Admin (from Normal)</SelectItem>
                <SelectItem value="SPECIALADMIN">Special Admin (from Admin)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              {promoteTo === 'ADMIN'
                ? 'Promotes a NORMAL investigator to ADMIN authority.'
                : 'Promotes an ADMIN investigator to SPECIALADMIN authority.'}
            </p>
          </div>

          {status.message && (
            <div className={`text-sm p-3 rounded-md flex items-start gap-2 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
              {status.type === 'error' && <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {status.type === 'loading' && <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin shrink-0 mt-0.5" />}
              <span className="leading-snug">{status.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="bg-transparent border-t-zinc-800 pt-4">
          <button
            onClick={() => setIsOpen(false)}
            disabled={status.type === 'loading'}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={status.type === 'loading' || !address}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {status.type === 'loading' ? 'Processing...' : 'Promote Investigator'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
