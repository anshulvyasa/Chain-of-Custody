import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CreateFolderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newFolderName: string;
  setNewFolderName: (val: string) => void;
  newFolderType: 'NORMAL' | 'SPECIAL';
  setNewFolderType: (val: 'NORMAL' | 'SPECIAL') => void;
  submitCreateFolder: () => void;
  isPending: boolean;
}

export function CreateFolderModal({
  isOpen,
  onOpenChange,
  newFolderName,
  setNewFolderName,
  newFolderType,
  setNewFolderType,
  submitCreateFolder,
  isPending
}: CreateFolderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Folder Name</label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCreateFolder(); }}
              autoFocus
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Suspect Interrogations"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Folder Type</label>
            <select
              value={newFolderType}
              onChange={(e) => setNewFolderType(e.target.value as 'NORMAL' | 'SPECIAL')}
              className="w-full bg-black/50 border border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
            >
              <option value="NORMAL">Normal (Can contain subfolders)</option>
              <option value="SPECIAL">Special (Only contains documents)</option>
            </select>
          </div>
        </div>
        <DialogFooter className="bg-transparent border-t-zinc-800">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submitCreateFolder}
            disabled={isPending || !newFolderName.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Creating...' : 'Create Folder'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
