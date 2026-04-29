import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AccessManagementModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nodeName: string;
  targetInvestigator: string;
  setTargetInvestigator: (val: string) => void;
  handleAccessAction: (action: 'ALLOW' | 'REVOKE') => void;
  isPending: boolean;
}

export function AccessManagementModal({
  isOpen,
  onOpenChange,
  nodeName,
  targetInvestigator,
  setTargetInvestigator,
  handleAccessAction,
  isPending
}: AccessManagementModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Manage Access: {nodeName}</DialogTitle>
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
              Grant or revoke an investigator&apos;s access to this folder and its contents. New investigators have no access by default.
            </p>
          </div>
        </div>
        <DialogFooter className="bg-transparent border-t-zinc-800 flex justify-between">
          <button
            onClick={() => handleAccessAction('ALLOW')}
            disabled={isPending || !targetInvestigator}
            className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Grant Access'}
          </button>
          <button
            onClick={() => handleAccessAction('REVOKE')}
            disabled={isPending || !targetInvestigator}
            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Processing...' : 'Revoke Access'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
