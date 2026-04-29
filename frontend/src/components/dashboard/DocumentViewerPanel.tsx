import { Clock, User, File, Download, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import DocumentPreview from '@/components/DocumentPreview';

interface DocumentVersion {
  id: string;
  fileUrl: string;
  fileType: string;
  documentHash: string;
  uploadTimestamp: string;
  uploaderWallet: string;
}

interface DocumentViewerPanelProps {
  selectedDoc: DocumentVersion | null;
  caseId: string;
  isVerifying: boolean;
  verificationStatus: 'pending' | 'success' | 'failed' | null;
  verifiedFileUrl: string | null;
  verifiedFileType: string | null;
  calculatedHash: string | null;
}

export function DocumentViewerPanel({
  selectedDoc,
  caseId,
  isVerifying,
  verificationStatus,
  verifiedFileUrl,
  verifiedFileType,
  calculatedHash
}: DocumentViewerPanelProps) {
  if (!selectedDoc) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500">
        <File className="w-16 h-16 mb-4 opacity-50" />
        <p>Select a document version to view details</p>
      </div>
    );
  }

  const isImage = verifiedFileType?.startsWith('image/');
  const isPDF = verifiedFileType === 'application/pdf';

  return (
    <div className="h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
          <File className="w-4 h-4 text-blue-400" />
          Document Preview
        </h3>
        {verifiedFileUrl && (
          <div className="flex items-center space-x-2">
            <Link
              href={`/view?caseId=${caseId}&docId=${selectedDoc.id}`}
              target="_blank"
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors border border-zinc-700 flex items-center gap-1.5 text-xs"
              title="Open in Full Screen"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 bg-zinc-950 flex flex-col">
        {/* Verification Status Banner */}
        <div className={`mb-6 p-4 rounded-lg border flex items-start gap-4 shadow-sm ${
          isVerifying ? 'bg-zinc-900 border-zinc-700' :
          verificationStatus === 'success' ? 'bg-emerald-950/30 border-emerald-900/50' :
          verificationStatus === 'failed' ? 'bg-red-950/30 border-red-900/50' :
          'bg-zinc-900 border-zinc-700'
        }`}>
          {isVerifying ? (
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin shrink-0 mt-0.5"></div>
          ) : verificationStatus === 'success' ? (
            <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          ) : verificationStatus === 'failed' ? (
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <File className="w-6 h-6 text-zinc-500 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold mb-1 ${
              isVerifying ? 'text-blue-400' :
              verificationStatus === 'success' ? 'text-emerald-400' :
              verificationStatus === 'failed' ? 'text-red-400' :
              'text-zinc-300'
            }`}>
              {isVerifying ? 'Verifying Integrity on IPFS...' :
               verificationStatus === 'success' ? 'Integrity Verified' :
               verificationStatus === 'failed' ? 'Verification Failed' :
               'Awaiting Verification'}
            </h4>
            
            <div className="space-y-1.5 text-[13px]">
              <div className="flex items-start gap-2">
                <span className="text-zinc-500 w-24 shrink-0">Stored Hash:</span>
                <span className="text-zinc-300 font-mono break-all bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">{selectedDoc.documentHash}</span>
              </div>
              
              {!isVerifying && calculatedHash && (
                <div className="flex items-start gap-2">
                  <span className="text-zinc-500 w-24 shrink-0">Calculated:</span>
                  <span className={`font-mono break-all px-1.5 py-0.5 rounded border ${
                    verificationStatus === 'success' 
                      ? 'text-emerald-300 bg-emerald-950/50 border-emerald-900/50' 
                      : 'text-red-300 bg-red-950/50 border-red-900/50'
                  }`}>
                    {calculatedHash}
                  </span>
                </div>
              )}
            </div>

            {verificationStatus === 'failed' && (
              <p className="text-red-400 text-sm mt-3 bg-red-950/50 p-2 rounded border border-red-900/50">
                Warning: The file content does not match the hash stored on the blockchain. The file may have been tampered with or corrupted.
              </p>
            )}
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Uploader</p>
              <p className="text-sm text-zinc-300 font-mono truncate">{selectedDoc.uploaderWallet}</p>
            </div>
          </div>
          <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800/50 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Timestamp</p>
              <p className="text-sm text-zinc-300">
                {new Date(selectedDoc.uploadTimestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* File Preview */}
        <div className="flex-1 bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden flex flex-col relative min-h-[300px]">
          {isVerifying ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10">
               <div className="w-8 h-8 border-2 border-zinc-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <p className="text-zinc-400 font-medium">Fetching file from IPFS...</p>
             </div>
          ) : verifiedFileUrl ? (
            <DocumentPreview 
              url={verifiedFileUrl}
              contentType={verifiedFileType || ''}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-zinc-950">
               <File className="w-12 h-12 mb-3 opacity-20" />
               <p>Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
