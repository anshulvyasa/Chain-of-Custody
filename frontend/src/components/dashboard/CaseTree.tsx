import { useState } from 'react';
import { ChevronDown, ChevronRight, Layers, FileUp, FolderPlus, Folder as FolderIcon, Lock } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import Link from 'next/link';

interface DocumentVersion {
  id: string;
  fileUrl: string;
  fileType: string;
  documentHash: string;
  uploadTimestamp: string;
  uploaderWallet: string;
}

export interface TreeNode {
  id: string;
  type: 'folder' | 'item';
  name: string;
  children: TreeNode[];
  versions?: DocumentVersion[];
}

interface CaseTreeProps {
  nodes: TreeNode[];
  isAdmin: boolean;
  caseId: string;
  onOpenFolderDialog: (parentId: string | null) => void;
  onOpenUploadDialog: (parentId: string) => void;
  onOpenAccessModal: (nodeId: string, nodeName: string) => void;
  onSelectDoc: (doc: DocumentVersion, folderId: string) => void;
  selectedDocId: string | null;
}

export function CaseTree({
  nodes,
  isAdmin,
  caseId,
  onOpenFolderDialog,
  onOpenUploadDialog,
  onOpenAccessModal,
  onSelectDoc,
  selectedDocId
}: CaseTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const renderNode = (node: TreeNode, depth: number = 0) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders[node.id] ?? true;
      return (
        <Collapsible key={node.id} open={isExpanded} onOpenChange={(open) => setExpandedFolders(prev => ({ ...prev, [node.id]: open }))} className="w-full">
          <div className="group flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-md transition-colors w-full">
            <CollapsibleTrigger className="flex-1 text-left flex items-center overflow-hidden">
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
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenAccessModal(node.id, node.name); }}
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                  title="Manage Access"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onOpenFolderDialog(node.id); }}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"
                title="Create Subfolder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onOpenUploadDialog(node.id); }}
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
      const isExpanded = expandedItems[node.id] ?? false;
      return (
        <Collapsible key={node.id} open={isExpanded} onOpenChange={(open) => setExpandedItems(prev => ({ ...prev, [node.id]: open }))} className="w-full">
          <div className="group flex items-center justify-between p-2 hover:bg-zinc-800/30 rounded-md transition-colors w-full">
            <CollapsibleTrigger className="flex-1 text-left flex items-center overflow-hidden cursor-pointer">
              <div className="flex items-center flex-1 overflow-hidden" style={{ paddingLeft: `${depth * 16}px` }}>
                {isExpanded ?
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-600 mr-1.5 shrink-0" /> :
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 mr-1.5 shrink-0" />
                }
                <Layers className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0" />
                <span className="text-zinc-400 truncate text-[13px]">{node.name}</span>
              </div>
            </CollapsibleTrigger>

            <div className="flex items-center space-x-2 pr-2">
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenAccessModal(node.id, node.name); }}
                  className="p-1 hover:bg-zinc-700 rounded text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                  title="Manage Access"
                >
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] text-zinc-600">{node.versions?.length || 0} vers</span>
              <Link
                href={`/case/${caseId}/upload?folderId=${node.id}`}
                onClick={(e) => e.stopPropagation()}
                className="p-1 hover:bg-zinc-700 rounded text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                title="Upload Document Version"
              >
                <FileUp className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <CollapsibleContent className="w-full relative py-1 data-closed:animate-collapsible-up data-open:animate-collapsible-down overflow-hidden">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-zinc-800/30" style={{ left: `${(depth * 16) + 16}px` }}></div>
            {(!node.versions || node.versions.length === 0) ? (
              <div className="p-2 text-xs text-zinc-600 italic" style={{ paddingLeft: `${(depth + 1) * 16 + 24}px` }}>
                No versions uploaded yet
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {node.versions.map((ver, idx) => (
                  <div
                    key={ver.id}
                    onClick={() => onSelectDoc(ver, node.id)}
                    className={`
                      group flex flex-col p-2 mx-2 rounded cursor-pointer transition-all border border-transparent
                      ${selectedDocId === ver.id ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-zinc-800/50'}
                    `}
                    style={{ marginLeft: `${(depth + 1) * 16 + 8}px` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${selectedDocId === ver.id ? 'text-blue-400' : 'text-zinc-300'}`}>
                        Version {node.versions!.length - idx}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(ver.uploadTimestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono truncate">
                      {ver.uploaderWallet.slice(0, 6)}...{ver.uploaderWallet.slice(-4)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      );
    }
  };

  if (nodes.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-zinc-800 rounded-lg m-4">
        <FolderIcon className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
        <p className="text-zinc-400 text-sm mb-4">This case is empty</p>
        <button
          onClick={() => onOpenFolderDialog(null)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
        >
          Create Root Folder
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {nodes.map(node => renderNode(node, 0))}
    </div>
  );
}
