'use client';

import { useState } from 'react';
import { useAppSelector } from '@/lib/redux/hook';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useInvestigatorContractActions } from '@/lib/hooks';

type InvestigatorType = "SPECIALADMIN" | "ADMIN" | "NORMAL";

export default function AddInvestigatorButton() {
  const investigatorAuthority = useAppSelector((state) => state.investigatorAuthority.investigatorAuthority);
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<InvestigatorType>('NORMAL');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const { isConnected } = useAccount();
  const { addNewInvestigator } = useInvestigatorContractActions();

  // Only Admin or SpecialAdmin can add
  if (investigatorAuthority !== 'ADMIN' && investigatorAuthority !== 'SPECIALADMIN') {
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

    if (role !== 'NORMAL' && investigatorAuthority !== 'SPECIALADMIN') {
      setStatus({ type: 'error', message: 'Only Special Admins can promote investigators to Admin or Special Admin.' });
      return;
    }

    try {
      setStatus({ type: 'loading', message: 'Adding new investigator...' });

      // Add investigator directly
      await addNewInvestigator(address, role);

      setStatus({ type: 'success', message: 'Investigator added successfully!' });
      setTimeout(() => setIsOpen(false), 2000);

    } catch (err: any) {
      console.error(err);
      // Clean up the error message from wagmi
      const msg = err.shortMessage || err.message || 'Transaction failed';
      setStatus({ type: 'error', message: msg });
    }
  };

  const resetState = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setAddress('');
      setRole('NORMAL');
      setStatus({ type: 'idle', message: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger>
        <div className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 rounded-md transition-colors flex items-center shadow-lg text-xs font-medium border border-blue-500/30 gap-1.5 cursor-pointer">
          <UserPlus className="w-3.5 h-3.5" />
          Add Investigator
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <UserPlus className="w-5 h-5 text-blue-400" />
            Add New Investigator
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
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              placeholder="0x..."
              disabled={status.type === 'loading'}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Authority Level
            </label>
            <Select
              value={role}
              onValueChange={(val) => { if (val) setRole(val as InvestigatorType); }}
              disabled={status.type === 'loading'}
            >
              <SelectTrigger className="w-full bg-black/50 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} sideOffset={4} className="bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectItem value="NORMAL">Normal Investigator</SelectItem>
                {investigatorAuthority === 'SPECIALADMIN' && (
                  <>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SPECIALADMIN">Special Admin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {investigatorAuthority === 'ADMIN' && (
              <p className="text-[10px] text-zinc-500 mt-1.5">
                As an Admin, you can only add Normal Investigators.
              </p>
            )}
          </div>

          {status.message && (
            <div className={`text-sm p-3 rounded-md flex items-start gap-2 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
              {status.type === 'error' && <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
              {status.type === 'loading' && <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0 mt-0.5" />}
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
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {status.type === 'loading' ? 'Processing...' : 'Authorize Investigator'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
