import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ManageCaseInvestigatorModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  caseName: string;
  targetInvestigator: string;
  setTargetInvestigator: (val: string) => void;
  handleAction: (action: 'ADD' | 'REMOVE') => void;
  isPending: boolean;
  errorMessage?: string | null;
}

export function ManageCaseInvestigatorModal({
  isOpen,
  onOpenChange,
  caseName,
  targetInvestigator,
  setTargetInvestigator,
  handleAction,
  isPending,
  errorMessage
}: ManageCaseInvestigatorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Manage Investigators: {caseName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Investigator Wallet Address</label>
            <input
              value={targetInvestigator}
              onChange={(e) => setTargetInvestigator(e.target.value)}
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0x..."
            />
            <p className="text-xs text-zinc-500 mt-2">
              Add or remove an investigator from this case. Removing them will revoke their access to all evidence in this case.
            </p>
          </div>
          {errorMessage && (
            <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400 break-words">{errorMessage}</p>
            </div>
          )}
        </div>
        <DialogFooter className="bg-transparent border-t-zinc-800 flex justify-between pt-4 mt-2">
          <button
            onClick={() => handleAction('ADD')}
            disabled={isPending || !targetInvestigator}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Add Investigator'}
          </button>
          <button
            onClick={() => handleAction('REMOVE')}
            disabled={isPending || !targetInvestigator}
            className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Remove Investigator'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
