'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, File, ShieldCheck, ShieldAlert, Clock, User, Link as LinkIcon, Plus, Folder as FolderIcon, Layers, FileUp, FolderPlus, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Shadcn UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useCase, useCreateFolder, fetchSignedUrl } from '@/lib/apiHooks';
import { useAccount } from 'wagmi';

type DocumentVersion = {
  id: string;
  fileUrl: string;
  fileType: string;
  documentHash: string;
  uploadTimestamp: string;
  uploaderWallet: string;
};

// Represents a folder returned by Prisma
type ApiFolder = {
  id: string;
  name: string;
  type: 'NORMAL' | 'SPECIAL';
  parentId: string | null;
  documentVersions?: DocumentVersion[];
};

type TreeNode = {
  id: string;
  type: 'folder' | 'item';
  name: string;
  children: TreeNode[];
  versions?: DocumentVersion[];
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const { address } = useAccount();

  const { data: caseDataObj, isLoading, isError } = useCase(caseIdParam, address);

  const [selectedDoc, setSelectedDoc] = useState<DocumentVersion | null>(null);

  // Dialog State (Keeping UI state for "Create Folder" to show, but actual creation is via SC)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'NORMAL' | 'SPECIAL'>('NORMAL');
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [redirectAfterCreate, setRedirectAfterCreate] = useState(false);

  const router = useRouter();

  const createFolderMutation = useCreateFolder(address);

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [verifiedFileUrl, setVerifiedFileUrl] = useState<string | null>(null);
  const [verifiedFileType, setVerifiedFileType] = useState<string | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);

  const verifyDocument = async (doc: DocumentVersion) => {
    setIsVerifying(true);
    setVerificationStatus('pending');
    setVerifiedFileUrl(null);
    setVerifiedFileType(null);
    setCalculatedHash(null);

    try {
      // Use signed URL for private file access instead of public gateway
      const signedUrl = await fetchSignedUrl(doc.fileUrl, address);

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Failed to fetch IPFS payload");

      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      setVerifiedFileType(contentType);

      const arrayBuffer = await response.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setCalculatedHash(hashHex);

      if (hashHex === doc.documentHash) {
        setVerificationStatus('success');
        const blob = new Blob([arrayBuffer], { type: contentType });
        setVerifiedFileUrl(URL.createObjectURL(blob));
      } else {
        setVerificationStatus('failed');
        // Still allow viewing the file even if hash mismatches
        const blob = new Blob([arrayBuffer], { type: contentType });
        setVerifiedFileUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(err);
      setVerificationStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectDoc = (doc: DocumentVersion) => {
    setSelectedDoc(doc);
    verifyDocument(doc);
  };

  // Build tree from flat folders array
  const rootNodes = useMemo(() => {
    if (!caseDataObj || !caseDataObj.folders) return [];

    const folderMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize all nodes
    caseDataObj.folders.forEach((f: ApiFolder) => {
      folderMap.set(f.id, {
        id: f.id,
        type: f.type === 'SPECIAL' ? 'item' : 'folder',
        name: f.name,
        children: [],
        versions: f.documentVersions || []
      });
    });

    // Link parents and children
    caseDataObj.folders.forEach((f: ApiFolder) => {
      const node = folderMap.get(f.id);
      if (node) {
        if (f.parentId && folderMap.has(f.parentId)) {
          folderMap.get(f.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, [caseDataObj]);

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openFolderDialog = (parentId: string | null = null) => {
    setActiveParentId(parentId);
    setNewFolderName('');
    setNewFolderType('NORMAL');
    setRedirectAfterCreate(false);
    setIsDialogOpen(true);
  };

  const openUploadDialog = (parentId: string) => {
    setActiveParentId(parentId);
    setNewFolderName('');
    setNewFolderType('SPECIAL');
    setRedirectAfterCreate(true);
    setIsDialogOpen(true);
  };

  const submitCreateFolder = async () => {
    if (!caseIdParam || !newFolderName.trim()) return;

    try {
      const resp = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        type: newFolderType,
        caseId: caseIdParam,
        parentId: activeParentId
      });
      setIsDialogOpen(false);

      if (redirectAfterCreate && resp.data?.id) {
        router.push(`/case/${caseIdParam}/upload?folderId=${resp.data.id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Error creating folder');
    }
  };

  if (!caseIdParam) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
        <FolderIcon className="w-16 h-16 mb-4 opacity-50" />
        <p>Select a case from the sidebar to view evidence</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading case file structure...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-400">Error loading case data.</div>;
  }

  // Recursive Component for rendering Folders and Items
  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders[node.id] ?? false;
      return (
        <Collapsible key={node.id} open={isExpanded} onOpenChange={(open) => setExpandedFolders(prev => ({ ...prev, [node.id]: open }))} className="w-full">
          <div className="group flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-md transition-colors w-full cursor-pointer">
            <CollapsibleTrigger>
              <div className="flex items-center flex-1 overflow-hidden" style={{ paddingLeft: `${depth * 16}px` }}>
                {isExpanded ?
                  <ChevronDown className="w-4 h-4 text-zinc-500 mr-1.5 shrink-0" /> :
                  <ChevronRight className="w-4 h-4 text-zinc-500 mr-1.5 shrink-0" />
                }
                <FolderIcon className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
                <span className="font-medium text-zinc-300 truncate text-sm">{node.name}</span>
              </div>
            </CollapsibleTrigger>

            <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity pr-2">
              <button
                onClick={(e) => { e.stopPropagation(); openFolderDialog(node.id); }}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                title="Create Subfolder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openUploadDialog(node.id); }}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                title="Create a Document Folder & Upload"
              >
                <FileUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <CollapsibleContent className="w-full relative data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800/50" style={{ left: `${(depth * 16) + 16}px` }}></div>
            {node.children.length === 0 ? (
              <div className="p-2 text-xs text-zinc-600 italic" style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}>
                Empty Folder
              </div>
            ) : (
              node.children.map((child: TreeNode) => renderNode(child, depth + 1))
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    } else {
      // It's a DocumentItem (Version Container)
      const isExpanded = expandedItems[node.id] ?? false;
      return (
        <Collapsible key={node.id} open={isExpanded} onOpenChange={(open) => setExpandedItems(prev => ({ ...prev, [node.id]: open }))} className="w-full">
          <CollapsibleTrigger>
            <div className="group flex items-center justify-between p-2 hover:bg-zinc-800/30 rounded-md transition-colors w-full cursor-pointer">
              <div className="flex items-center flex-1 overflow-hidden" style={{ paddingLeft: `${depth * 16}px` }}>
                {isExpanded ?
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-600 mr-1.5 shrink-0" /> :
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 mr-1.5 shrink-0" />
                }
                <Layers className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0" />
                <span className="text-zinc-400 truncate text-[13px]">{node.name}</span>
              </div>

              <div className="flex items-center space-x-2 pr-2">
                <span className="text-[10px] text-zinc-600">{node.versions?.length || 0} vers</span>
                <Link
                  href={`/case/${caseDataObj.caseId}/upload?folderId=${node.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  title="Upload Document Version"
                >
                  <FileUp className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="w-full relative py-1 data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800/30" style={{ left: `${(depth * 16) + 16}px` }}></div>
            {node.versions?.map((v, index) => (
              <button
                key={v.id}
                onClick={() => handleSelectDoc(v)}
                className={`w-full flex items-center pr-3 py-1.5 hover:bg-blue-500/10 transition-colors text-left relative ${selectedDoc?.id === v.id ? 'bg-blue-500/5 my-0.5 border-y border-blue-500/20' : ''}`}
                style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}
              >
                <File className={`w-3 h-3 mr-2 shrink-0 z-10 ${selectedDoc?.id === v.id ? 'text-blue-400' : 'text-zinc-600'}`} />
                <div className="truncate flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${selectedDoc?.id === v.id ? 'text-blue-200' : 'text-zinc-500'}`}>
                      {v.id.toUpperCase()}
                      {index === 0 && <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1 py-0.5 rounded">LATEST</span>}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600/60 truncate mt-0.5">{v.documentHash}</p>
                </div>
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }
  };

  return (
    <>
      <div className="flex h-full gap-8">
        {/* Evidence Hierarchy Column */}
        <div className="w-1/3 min-w-[360px] border border-zinc-800 rounded-xl bg-zinc-900/40 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h3 className="font-semibold text-zinc-100">{caseDataObj?.caseTitle || 'Loading...'}</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">{caseDataObj?.caseId}</p>
            </div>
            <button
              onClick={() => openFolderDialog(null)}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md transition-colors flex items-center shadow-lg text-xs font-medium border border-zinc-700"
            >
              <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> Root Folder
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="space-y-1">
              {rootNodes.length === 0 ? (
                <div className="text-center p-8 border border-zinc-800/50 border-dashed rounded-lg bg-black/20 text-zinc-500 text-sm">
                  No folders created yet.<br />Click "Root Folder" to start.
                </div>
              ) : (
                rootNodes.map(node => renderNode(node, 0))
              )}
            </div>
          </div>
        </div>

        {/* Document Viewer & Verification UI */}
        <div className="flex-1 flex flex-col gap-6">
          {selectedDoc ? (
            <>
              <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900/40 flex items-center justify-center flex-col relative overflow-hidden group">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-700 text-xs text-zinc-300 shadow-xl">
                    {verifiedFileType || 'Loading...'}
                  </div>
                </div>
                {isVerifying ? (
                  <div className="flex flex-col items-center">
                    <span className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></span>
                    <p className="text-zinc-400 text-sm">Downloading & Verifying from IPFS...</p>
                  </div>
                ) : verificationStatus === 'success' && verifiedFileUrl ? (
                  verifiedFileType?.startsWith('image/') ? (
                    <img src={verifiedFileUrl} alt="Evidence" className="max-w-full max-h-full object-contain" />
                  ) : verifiedFileType?.startsWith('video/') ? (
                    <video src={verifiedFileUrl} controls className="max-w-full max-h-full" />
                  ) : verifiedFileType?.startsWith('audio/') ? (
                    <audio src={verifiedFileUrl} controls className="w-full max-w-md" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <File className="w-24 h-24 text-zinc-700 mb-6" />
                      <a href={verifiedFileUrl} download="evidence" className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                        <Download className="w-4 h-4 mr-2" /> Download Evidence File
                      </a>
                    </div>
                  )
                ) : verificationStatus === 'failed' && verifiedFileUrl ? (
                  <div className="flex flex-col items-center w-full h-full">
                    <div className="absolute top-4 left-4 z-10 bg-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 text-xs text-red-400 shadow-xl flex items-center">
                      <ShieldAlert className="w-3 h-3 mr-1.5" /> TAMPERED — Hash Mismatch
                    </div>
                    {verifiedFileType?.startsWith('image/') ? (
                      <img src={verifiedFileUrl} alt="Evidence" className="max-w-full max-h-full object-contain" />
                    ) : verifiedFileType?.startsWith('video/') ? (
                      <video src={verifiedFileUrl} controls className="max-w-full max-h-full" />
                    ) : verifiedFileType?.startsWith('audio/') ? (
                      <audio src={verifiedFileUrl} controls className="w-full max-w-md" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <File className="w-24 h-24 text-red-700 mb-6" />
                        <a href={verifiedFileUrl} download="evidence" className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors">
                          <Download className="w-4 h-4 mr-2" /> Download (Unverified)
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-red-400">
                    <ShieldAlert className="w-16 h-16 mb-4" />
                    <p>Verification Failed or File Unreachable</p>
                  </div>
                )}

                <a href={verifiedFileUrl || '#'} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-4 text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  <LinkIcon className="w-3 h-3 mr-1" /> View source on IPFS
                </a>
              </div>

              <div className={`border ${verificationStatus === 'success' ? 'border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent' : verificationStatus === 'failed' ? 'border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent' : 'border-zinc-800/50 bg-zinc-900/40'} rounded-xl p-6 shadow-lg transition-colors duration-500`}>
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-inner ${verificationStatus === 'success' ? 'bg-green-500/10 border-green-500/20' : verificationStatus === 'failed' ? 'bg-red-500/10 border-red-500/20' : 'bg-zinc-800 border-zinc-700'}`}>
                    {verificationStatus === 'success' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : verificationStatus === 'failed' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin"></div>}
                  </div>
                  <div>
                    <h4 className={`font-medium ${verificationStatus === 'success' ? 'text-emerald-400' : verificationStatus === 'failed' ? 'text-red-500' : 'text-zinc-400'}`}>
                      {verificationStatus === 'success' ? 'Cryptographically Verified Hash' : verificationStatus === 'failed' ? 'Verification Failed - Hash Mismatch' : 'Verifying Evidence Integrity...'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">Matched actual downloaded payload against Ethereum smart contract ledger history.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-4 transition-colors hover:border-zinc-700">
                    <div className="flex items-center text-zinc-500 text-xs mb-2">
                      <User className="w-3 h-3 mr-1.5" /> Uploader Addr
                    </div>
                    <p className="text-xs text-zinc-300 font-mono truncate">{selectedDoc.uploaderWallet}</p>
                  </div>
                  <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-4 transition-colors hover:border-zinc-700">
                    <div className="flex items-center text-zinc-500 text-xs mb-2">
                      <Clock className="w-3 h-3 mr-1.5" /> Chain Timestamp
                    </div>
                    <p className="text-xs text-zinc-300">{new Date(selectedDoc.uploadTimestamp).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 bg-black/40 border border-zinc-800/50 rounded-lg p-4 transition-colors hover:border-zinc-700 group">
                    <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
                      <span className="flex items-center"><LinkIcon className="w-3 h-3 mr-1.5" /> On-Chain Hash (Stored on Blockchain)</span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Immutable Record</span>
                    </div>
                    <p className="text-xs text-emerald-400/80 font-mono break-all group-hover:text-emerald-400 transition-colors">
                      {selectedDoc.documentHash}
                    </p>
                  </div>
                  <div className={`col-span-2 bg-black/40 border rounded-lg p-4 transition-colors hover:border-zinc-700 group ${verificationStatus === 'success' ? 'border-green-500/30' : verificationStatus === 'failed' ? 'border-red-500/30' : 'border-zinc-800/50'
                    }`}>
                    <div className="flex items-center justify-between text-zinc-500 text-xs mb-2">
                      <span className="flex items-center"><ShieldCheck className="w-3 h-3 mr-1.5" /> Calculated Hash (From Downloaded File)</span>
                      {verificationStatus === 'success' && <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">✓ MATCH</span>}
                      {verificationStatus === 'failed' && calculatedHash && <span className="text-[10px] uppercase tracking-wider text-red-500 font-semibold">✗ MISMATCH</span>}
                      {!verificationStatus || verificationStatus === 'pending' && <span className="text-[10px] text-zinc-600">Computing...</span>}
                    </div>
                    <p className={`text-xs font-mono break-all transition-colors ${verificationStatus === 'success' ? 'text-emerald-400/80 group-hover:text-emerald-400' :
                        verificationStatus === 'failed' ? 'text-red-400/80 group-hover:text-red-400' :
                          'text-zinc-500'
                      }`}>
                      {calculatedHash || (isVerifying ? 'Downloading and computing SHA-256...' : '—')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 border border-zinc-800 border-dashed rounded-xl bg-zinc-900/10 flex items-center justify-center text-zinc-600">
              Expand the hierarchy and select a document version to view verified evidence
            </div>
          )}
        </div>
      </div>

      {/* Shadcn Dialog for Folder Creation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              onClick={() => setIsDialogOpen(false)}
              disabled={createFolderMutation.isPending}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={submitCreateFolder}
              disabled={createFolderMutation.isPending || !newFolderName.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50 flex items-center"
            >
              {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
