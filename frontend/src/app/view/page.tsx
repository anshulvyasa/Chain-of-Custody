'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ShieldCheck, ShieldAlert, Download, ArrowLeft, ChevronDown, ChevronUp, Clock, User, Link as LinkIcon } from 'lucide-react';
import DocumentPreview from '@/components/DocumentPreview';
import { useCase, fetchSignedUrl } from '@/lib/apiHooks';
import { useAccount } from 'wagmi';

type DocumentVersion = {
    id: string;
    fileUrl: string;
    fileType: string;
    documentHash: string;
    uploadTimestamp: string;
    uploaderWallet: string;
};

type ApiFolder = {
    id: string;
    name: string;
    type: 'NORMAL' | 'SPECIAL';
    parentId: string | null;
    documentVersions?: DocumentVersion[];
};

function DocumentViewPageInner() {
    const searchParams = useSearchParams();
    const caseId = searchParams.get('caseId');
    const docId = searchParams.get('docId');
    const { address } = useAccount();

    const { data: caseDataObj, isLoading: isCaseLoading } = useCase(caseId, address);

    const [doc, setDoc] = useState<DocumentVersion | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed' | null>(null);
    const [verifiedFileUrl, setVerifiedFileUrl] = useState<string | null>(null);
    const [verifiedFileType, setVerifiedFileType] = useState<string | null>(null);
    const [calculatedHash, setCalculatedHash] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Find the document version from the case data
    useEffect(() => {
        if (!caseDataObj || !docId) return;

        for (const folder of (caseDataObj.folders || []) as ApiFolder[]) {
            const found = (folder.documentVersions || []).find((v: DocumentVersion) => v.id === docId);
            if (found) {
                setDoc(found);
                break;
            }
        }
    }, [caseDataObj, docId]);

    // Verify the document once found
    useEffect(() => {
        if (!doc) return;

        const verify = async () => {
            setIsVerifying(true);
            setVerificationStatus('pending');

            try {
                const signedUrl = await fetchSignedUrl(doc.fileUrl, address);
                const response = await fetch(signedUrl);
                if (!response.ok) throw new Error('Failed to fetch IPFS payload');

                const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
                setVerifiedFileType(contentType);

                const arrayBuffer = await response.arrayBuffer();
                const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

                setCalculatedHash(hashHex);

                const blob = new Blob([arrayBuffer], { type: contentType });
                setVerifiedFileUrl(URL.createObjectURL(blob));

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

        verify();
    }, [doc, address]);

    // ─── Loading / Error States ────────────────────────────────
    if (!caseId || !docId) {
        return (
            <div className="h-screen flex items-center justify-center bg-zinc-950 text-zinc-500">
                <p>Missing caseId or docId in URL</p>
            </div>
        );
    }

    if (isCaseLoading || !doc) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-zinc-950">
                <span className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 text-sm">Loading document…</p>
            </div>
        );
    }

    // ─── Render ────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white">
            {/* ─── Top Bar ──────────────────────────────────────────── */}
            <header className="shrink-0 flex items-center justify-between px-6 h-14 bg-zinc-900/80 border-b border-zinc-800 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                    <a
                        href={`/dashboard?caseId=${caseId}`}
                        className="flex items-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
                    </a>

                    <div className="h-4 w-px bg-zinc-700" />

                    <span className="text-xs font-mono text-zinc-400 truncate max-w-[200px]" title={doc.id}>
                        {doc.id.toUpperCase()}
                    </span>

                    {verifiedFileType && (
                        <span className="text-[10px] bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">
                            {verifiedFileType}
                        </span>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    {/* Verification Badge */}
                    {verificationStatus === 'success' && (
                        <span className="flex items-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified
                        </span>
                    )}
                    {verificationStatus === 'failed' && (
                        <span className="flex items-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full">
                            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Tampered
                        </span>
                    )}
                    {(isVerifying || verificationStatus === 'pending') && (
                        <span className="flex items-center text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-full">
                            <span className="w-3 h-3 border-2 border-zinc-500 border-t-zinc-300 rounded-full animate-spin mr-1.5" />
                            Verifying…
                        </span>
                    )}

                    {/* Details Toggle */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                    >
                        {showDetails ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <ChevronDown className="w-3.5 h-3.5 mr-1" />}
                        Details
                    </button>

                    {/* Download */}
                    {verifiedFileUrl && (
                        <a
                            href={verifiedFileUrl}
                            download={`evidence-${doc.id}`}
                            className="flex items-center text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                        >
                            <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </a>
                    )}
                </div>
            </header>

            {/* ─── Expandable Details Panel ─────────────────────────── */}
            {showDetails && (
                <div className="shrink-0 px-6 py-4 bg-zinc-900/60 border-b border-zinc-800 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3">
                        <div className="flex items-center text-zinc-500 mb-1.5">
                            <User className="w-3 h-3 mr-1.5" /> Uploader
                        </div>
                        <p className="text-zinc-300 font-mono truncate">{doc.uploaderWallet}</p>
                    </div>

                    <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3">
                        <div className="flex items-center text-zinc-500 mb-1.5">
                            <Clock className="w-3 h-3 mr-1.5" /> Timestamp
                        </div>
                        <p className="text-zinc-300">{new Date(doc.uploadTimestamp).toLocaleString()}</p>
                    </div>

                    <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3 col-span-2 lg:col-span-1">
                        <div className="flex items-center text-zinc-500 mb-1.5">
                            <LinkIcon className="w-3 h-3 mr-1.5" /> On-Chain Hash
                        </div>
                        <p className="text-emerald-400/80 font-mono truncate" title={doc.documentHash}>{doc.documentHash}</p>
                    </div>

                    <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3 col-span-2 lg:col-span-1">
                        <div className="flex items-center text-zinc-500 mb-1.5">
                            <ShieldCheck className="w-3 h-3 mr-1.5" /> Calculated Hash
                        </div>
                        <p className={`font-mono truncate ${verificationStatus === 'success' ? 'text-emerald-400/80' : verificationStatus === 'failed' ? 'text-red-400/80' : 'text-zinc-500'}`} title={calculatedHash || ''}>
                            {calculatedHash || (isVerifying ? 'Computing…' : '—')}
                        </p>
                    </div>
                </div>
            )}

            {/* ─── Full-Page Preview ────────────────────────────────── */}
            <div className="flex-1 relative overflow-hidden">
                {isVerifying ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <span className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-zinc-400 text-sm">Downloading & Verifying from IPFS…</p>
                    </div>
                ) : verifiedFileUrl ? (
                    <div className="w-full h-full">
                        {verificationStatus === 'failed' && (
                            <div className="absolute top-4 left-4 z-10 bg-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 text-xs text-red-400 shadow-xl flex items-center">
                                <ShieldAlert className="w-3 h-3 mr-1.5" /> TAMPERED — Hash Mismatch
                            </div>
                        )}
                        <DocumentPreview url={verifiedFileUrl} contentType={verifiedFileType} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <ShieldAlert className="w-16 h-16 mb-4" />
                        <p>Verification Failed or File Unreachable</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DocumentViewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen flex flex-col items-center justify-center bg-zinc-950">
                <span className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 text-sm">Loading…</p>
            </div>
        }>
            <DocumentViewPageInner />
        </Suspense>
    );
}
