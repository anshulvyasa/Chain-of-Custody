'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, File, ShieldCheck, Clock, User, Link as LinkIcon, Plus, Folder as FolderIcon, Layers, FileUp, FolderPlus } from 'lucide-react';
import Link from 'next/link';

// Shadcn UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

// Mock Types
type DocumentVersion = {
  id: string;
  fileUrl: string;
  fileType: string;
  documentHash: string;
  uploadTimestamp: string;
  uploaderWallet: string;
};

type DocumentItem = {
  id: string;
  type: 'item';
  name: string;
  versions: DocumentVersion[];
};

type FolderNode = {
  id: string;
  type: 'folder';
  name: string;
  children: (FolderNode | DocumentItem)[];
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');

  const [selectedDoc, setSelectedDoc] = useState<DocumentVersion | null>(null);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  // Mock Root Data
  const [caseData, setCaseData] = useState({
    id: caseIdParam || 'case-1029',
    title: 'Operation Alpha',
    rootNodes: [
      {
        id: 'f-1',
        type: 'folder',
        name: 'Crime Scene Photos',
        children: [
          {
            id: 'f-1-1',
            type: 'folder',
            name: 'Exterior Shots',
            children: [
              {
                id: 'item-1',
                type: 'item',
                name: 'Broken Window',
                versions: [
                  {
                    id: 'v-2',
                    fileUrl: 'ipfs://.../window-v2-enhanced.jpg',
                    fileType: 'image/jpeg',
                    documentHash: '0x999abc456def...',
                    uploadTimestamp: new Date().toISOString(),
                    uploaderWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                  },
                  {
                    id: 'v-1',
                    fileUrl: 'ipfs://.../window-v1-original.jpg',
                    fileType: 'image/jpeg',
                    documentHash: '0x123abc456def...',
                    uploadTimestamp: new Date(Date.now() - 86400000).toISOString(),
                    uploaderWallet: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
                  }
                ]
              }
            ]
          } as FolderNode,
          {
            id: 'item-2',
            type: 'item',
            name: 'Blood Spatter Analysis',
            versions: [
              {
                id: 'v-1',
                fileUrl: 'ipfs://.../blood-report.pdf',
                fileType: 'application/pdf',
                documentHash: '0xabc123456def...',
                uploadTimestamp: new Date(Date.now() - 172800000).toISOString(),
                uploaderWallet: '0x111d35Cc6634C0532925a3b844Bc454e4438f11e',
              }
            ]
          } as DocumentItem
        ]
      } as FolderNode,
      {
        id: 'f-2',
        type: 'folder',
        name: 'Interrogation Audio',
        children: []
      } as FolderNode
    ] as (FolderNode | DocumentItem)[]
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'cat-1': true,
    'f-1': true,
    'f-1-1': true
  });

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'item-1': true,
  });

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
    setIsDialogOpen(true);
  };

  const submitCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FolderNode = {
      id: `f-${Date.now()}`,
      type: 'folder',
      name: newFolderName.trim(),
      children: []
    };

    if (activeParentId === null) {
      setCaseData(prev => ({ ...prev, rootNodes: [...prev.rootNodes, newFolder] }));
    } else {
      // Deep update helper
      const updateTree = (nodes: (FolderNode | DocumentItem)[]): (FolderNode | DocumentItem)[] => {
        return nodes.map(node => {
          if (node.type === 'folder') {
            if (node.id === activeParentId) {
              return { ...node, children: [...node.children, newFolder] };
            }
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };
      setCaseData(prev => ({ ...prev, rootNodes: updateTree(prev.rootNodes) }));
      setExpandedFolders(prev => ({ ...prev, [activeParentId]: true }));
    }

    setIsDialogOpen(false);
  };

  if (!caseIdParam) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
        <FolderIcon className="w-16 h-16 mb-4 opacity-50" />
        <p>Select a case from the sidebar to view evidence</p>
      </div>
    );
  }

  // Recursive Component for rendering Folders and Items
  const renderNode = (node: FolderNode | DocumentItem, depth: number = 0) => {
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
              <Link
                href={`/case/${caseData.id}/upload?folderId=${node.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                title="Upload Document"
              >
                <FileUp className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <CollapsibleContent className="w-full relative data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800/50" style={{ left: `${(depth * 16) + 16}px` }}></div>
            {node.children.length === 0 ? (
              <div className="p-2 text-xs text-zinc-600 italic" style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}>
                Empty Folder
              </div>
            ) : (
              node.children.map(child => renderNode(child, depth + 1))
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
              <span className="text-[10px] text-zinc-600 pr-2">{node.versions.length} vers</span>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="w-full relative py-1 data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800/30" style={{ left: `${(depth * 16) + 16}px` }}></div>
            {node.versions.map((v, index) => (
              <button
                key={v.id}
                onClick={() => setSelectedDoc(v)}
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
              <h3 className="font-semibold text-zinc-100">{caseData.title}</h3>
              <p className="text-xs text-zinc-500 font-mono mt-1">{caseData.id}</p>
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
              {caseData.rootNodes.length === 0 ? (
                <div className="text-center p-8 border border-zinc-800/50 border-dashed rounded-lg bg-black/20 text-zinc-500 text-sm">
                  No folders created yet.<br />Click "Root Folder" to start.
                </div>
              ) : (
                caseData.rootNodes.map(node => renderNode(node, 0))
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
                    {selectedDoc.fileType}
                  </div>
                </div>
                <File className="w-24 h-24 text-zinc-700 mb-6 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-zinc-500 text-sm">Media viewer initialized for multi-format playback.</p>
                <a href="#" className="mt-4 text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors">
                  <LinkIcon className="w-3 h-3 mr-1" /> View source stream on IPFS
                </a>
              </div>

              <div className="border border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-emerald-400 font-medium">Cryptographically Verified Hash</h4>
                    <p className="text-xs text-zinc-400 mt-1">Matched against Ethereum smart contract ledger history.</p>
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
                    <div className="flex items-center text-zinc-500 text-xs mb-2">
                      <LinkIcon className="w-3 h-3 mr-1.5" /> Immutable SHA-256 Hash
                    </div>
                    <p className="text-xs text-emerald-400/80 font-mono break-all group-hover:text-emerald-400 transition-colors">
                      {selectedDoc.documentHash}
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
          <div className="py-4">
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
          <DialogFooter className="bg-transparent border-t-zinc-800">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitCreateFolder}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              Create Folder
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
