'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { UserMinus, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useInvestigatorContractActions } from '@/lib/hooks';

type RemovalType = 'EXISTING' | 'COMPROMISED';

export default function RemoveInvestigatorButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [removalType, setRemovalType] = useState<RemovalType>('EXISTING');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  const { isConnected } = useAccount();
  const { removeExistingInvestigator, removeCompromizedInvestigator } = useInvestigatorContractActions();

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
      if (removalType === 'EXISTING') {
        setStatus({ type: 'loading', message: 'Removing investigator...' });
        await removeExistingInvestigator([address]);
      } else {
        setStatus({ type: 'loading', message: 'Removing compromised investigator...' });
        await removeCompromizedInvestigator([address]);
      }

      setStatus({ type: 'success', message: 'Investigator removed successfully!' });
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
      setRemovalType('EXISTING');
      setStatus({ type: 'idle', message: '' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger>
        <div className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 rounded-md transition-colors flex items-center shadow-lg text-xs font-medium border border-red-500/30 gap-1.5 cursor-pointer">
          <UserMinus className="w-3.5 h-3.5" />
          Remove Investigator
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <UserMinus className="w-5 h-5 text-red-400" />
            Remove Investigator
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
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
              placeholder="0x..."
              disabled={status.type === 'loading'}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
              Removal Type
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  removalType === 'EXISTING'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <input
                  type="radio"
                  name="removalType"
                  value="EXISTING"
                  checked={removalType === 'EXISTING'}
                  onChange={() => setRemovalType('EXISTING')}
                  className="mt-0.5 accent-red-500"
                  disabled={status.type === 'loading'}
                />
                <div>
                  <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <UserMinus className="w-3.5 h-3.5 text-red-400" />
                    Remove Existing
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Standard removal. Revokes the investigator&apos;s access and authority.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  removalType === 'COMPROMISED'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <input
                  type="radio"
                  name="removalType"
                  value="COMPROMISED"
                  checked={removalType === 'COMPROMISED'}
                  onChange={() => setRemovalType('COMPROMISED')}
                  className="mt-0.5 accent-amber-500"
                  disabled={status.type === 'loading'}
                />
                <div>
                  <div className="text-sm font-medium text-zinc-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Remove Compromised
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Flags the investigator as compromised. Use when credentials or integrity are in question.
                  </p>
                </div>
              </label>
            </div>
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
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/20"
          >
            {status.type === 'loading' ? 'Processing...' : 'Remove Investigator'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
