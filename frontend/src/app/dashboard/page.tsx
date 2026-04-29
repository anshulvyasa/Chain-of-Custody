'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Folder as FolderIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useCase, useCreateFolder, fetchFolderPath, fetchSignedUrl } from '@/lib/apiHooks';
import { useCaseContractActions, useIsInvestigator } from '@/lib/hooks';
import { usePublicClient, useAccount } from 'wagmi';

import { SignatureGate } from '@/components/dashboard/SignatureGate';
import { CaseTree, TreeNode } from '@/components/dashboard/CaseTree';
import { DocumentViewerPanel } from '@/components/dashboard/DocumentViewerPanel';
import { AccessManagementModal } from '@/components/dashboard/AccessManagementModal';
import { CreateFolderModal } from '@/components/dashboard/CreateFolderModal';
import { useEffect } from 'react';

type DocumentVersion = {
  id: string;
  fileUrl: string;
  fileType: string;
  documentHash: string;
  uploadTimestamp: string;
  uploaderWallet: string;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const { address } = useAccount();

  const [signature, setSignature] = useState<string | undefined>(undefined);
  const [timestamp, setTimestamp] = useState<string | undefined>(undefined);

  useEffect(() => {
    setSignature(undefined);
    setTimestamp(undefined);
  }, [caseIdParam]);

  const { data: caseDataObj, isLoading, isError } = useCase(caseIdParam, address, signature, timestamp);

  const [selectedDoc, setSelectedDoc] = useState<DocumentVersion | null>(null);

  const router = useRouter();
  const publicClient = usePublicClient();

  const createFolderMutation = useCreateFolder(address);
  const { accessDocument, restrictInvestigatorPath, unrestrictInvestigatorPath } = useCaseContractActions();
  const { data: isInvestigatorData } = useIsInvestigator();
  const isAdmin = Boolean(isInvestigatorData && ((isInvestigatorData as any)[0] === 0 || (isInvestigatorData as any)[0] === 1));

  // --- Modal States ---
  // Folder Creation Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'NORMAL' | 'SPECIAL'>('NORMAL');
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [redirectAfterCreate, setRedirectAfterCreate] = useState(false);

  // Access Management Modal
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessNodeId, setAccessNodeId] = useState<string | null>(null);
  const [accessNodeName, setAccessNodeName] = useState<string>('');
  const [targetInvestigator, setTargetInvestigator] = useState('');
  const [isAccessActionPending, setIsAccessActionPending] = useState(false);

  // --- Verification States ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
  const [verifiedFileUrl, setVerifiedFileUrl] = useState<string | null>(null);
  const [verifiedFileType, setVerifiedFileType] = useState<string | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);

  // --- Handlers ---
  const handleSigned = (sig: string, ts: string) => {
    setSignature(sig);
    setTimestamp(ts);
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

  const openAccessModal = (nodeId: string, nodeName: string) => {
    setAccessNodeId(nodeId);
    setAccessNodeName(nodeName);
    setTargetInvestigator('');
    setAccessModalOpen(true);
  };

  const handleAccessAction = async (action: 'RESTRICT' | 'UNRESTRICT') => {
    if (!caseIdParam || !accessNodeId || !targetInvestigator || !publicClient) return;
    setIsAccessActionPending(true);
    try {
      const path = await fetchFolderPath(accessNodeId, address);
      let tx;
      if (action === 'RESTRICT') {
        tx = await restrictInvestigatorPath(caseIdParam, targetInvestigator, path);
      } else {
        tx = await unrestrictInvestigatorPath(caseIdParam, targetInvestigator, path);
      }
      await publicClient.waitForTransactionReceipt({ hash: tx });
      setAccessModalOpen(false);
    } catch (e: any) {
      alert(e.message || 'Error managing access');
    } finally {
      setIsAccessActionPending(false);
    }
  };

  const verifyDocument = async (doc: DocumentVersion) => {
    setIsVerifying(true);
    setVerificationStatus('pending');
    setVerifiedFileUrl(null);
    setVerifiedFileType(null);
    setCalculatedHash(null);

    try {
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

      const blob = new Blob([arrayBuffer], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);
      setVerifiedFileUrl(objectUrl);

      if (hashHex === doc.documentHash) {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('failed');
      }
    } catch (err) {
      console.error(err);
      setVerificationStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectDoc = async (doc: DocumentVersion, folderId: string) => {
    if (!caseIdParam || !address || !publicClient) {
      setSelectedDoc(null);
      setVerificationStatus(null);
      setVerifiedFileUrl(null);
      return;
    }

    setVerificationStatus('pending');
    setVerifiedFileUrl(null);
    setVerifiedFileType(null);
    setCalculatedHash(null);

    try {
      const documentPath = await fetchFolderPath(folderId, address);
      const tx = await accessDocument(caseIdParam, documentPath);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });

      if (receipt.status === 'reverted') {
        throw new Error('Document access transaction was reverted');
      }

      setSelectedDoc(doc);
      await verifyDocument(doc);
    } catch (err) {
      console.error('Document access denied:', err);
      setSelectedDoc(null);
      setVerificationStatus(null);
      setVerifiedFileUrl(null);
      setVerifiedFileType(null);
      setCalculatedHash(null);
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

  if (!signature || !timestamp) {
    return <SignatureGate caseIdParam={caseIdParam} onSigned={handleSigned} />;
  }

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading case file structure...</div>;
  }

  if (isError) {
    return <div className="p-8 text-red-400">Error loading case data. You might be restricted.</div>;
  }

  const rootNodes: TreeNode[] = caseDataObj?.foldersTree || [];

  return (
    <>
      <div className="flex h-full bg-black">
        {/* Left Sidebar - File Tree */}
        <div className="w-80 border-r border-zinc-800 flex flex-col bg-zinc-950/50">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
              <FolderIcon className="w-4 h-4 text-zinc-400" />
              Evidence Files
            </h2>
            <button
              onClick={() => openFolderDialog(null)}
              className="p-1.5 hover:bg-zinc-700 bg-zinc-800 rounded-md text-zinc-300 transition-colors border border-zinc-700"
              title="Create Root Folder"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            <CaseTree
              nodes={rootNodes}
              isAdmin={isAdmin}
              caseId={caseIdParam}
              onOpenFolderDialog={openFolderDialog}
              onOpenUploadDialog={openUploadDialog}
              onOpenAccessModal={openAccessModal}
              onSelectDoc={handleSelectDoc}
              selectedDocId={selectedDoc?.id || null}
            />
          </div>
        </div>

        {/* Right Panel - Document Preview */}
        <div className="flex-1 p-6 bg-black overflow-hidden flex flex-col">
          <DocumentViewerPanel
            selectedDoc={selectedDoc}
            caseId={caseIdParam}
            isVerifying={isVerifying}
            verificationStatus={verificationStatus}
            verifiedFileUrl={verifiedFileUrl}
            verifiedFileType={verifiedFileType}
            calculatedHash={calculatedHash}
          />
        </div>
      </div>

      <CreateFolderModal
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        newFolderType={newFolderType}
        setNewFolderType={setNewFolderType}
        submitCreateFolder={submitCreateFolder}
        isPending={createFolderMutation.isPending}
      />

      <AccessManagementModal
        isOpen={accessModalOpen}
        onOpenChange={setAccessModalOpen}
        nodeName={accessNodeName}
        targetInvestigator={targetInvestigator}
        setTargetInvestigator={setTargetInvestigator}
        handleAccessAction={handleAccessAction}
        isPending={isAccessActionPending}
      />
    </>
  );
}
