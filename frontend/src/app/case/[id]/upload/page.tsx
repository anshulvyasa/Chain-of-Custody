'use client';

import { useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { UploadCloud, File, AlertCircle, CheckCircle2, ArrowLeft, FileVideo } from 'lucide-react';
import { useCaseContractActions } from '@/lib/hooks';

export default function DocumentUploadPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const caseId = params.id as string;
  const folderId = searchParams.get('folderId') || 'root';

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'uploading' | 'awaiting_wallet' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const [versionDetected, setVersionDetected] = useState(false);

  const { addDocumentHash } = useCaseContractActions();

  // Mock hash generator for the demo
  const generateMockHash = () => {
    return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setStatus('checking');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate DB check

      // Mock logic: randomly decide if we found an existing DocumentItem with the same name
      const isExisting = Math.random() > 0.5;
      setVersionDetected(isExisting);

      setStatus('uploading');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload

      const docHash = generateMockHash();
      const documentId = `doc-${Date.now()}`;

      // Trigger Smart Contract Transaction
      setStatus('awaiting_wallet');
      const tx = await addDocumentHash(caseId, documentId, docHash);

      setTxHash(tx);
      setStatus('success');

      // Redirect back after 3 seconds
      setTimeout(() => {
        router.push(`/dashboard?caseId=${caseId}`);
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white py-12 relative">

      {/* Exit Button */}
      {status === 'idle' && (
        <div className="absolute top-8 left-8">
          <button
            onClick={() => router.push(`/dashboard?caseId=${caseId}`)}
            className="flex items-center text-zinc-500 hover:text-white transition-colors px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel & Exit
          </button>
        </div>
      )}

      <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl mt-12">
        <div className="flex items-center mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
            <FileVideo className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold">Upload Evidence</h2>
        </div>
        <div className="space-y-1 mb-8">
          <p className="text-zinc-400 text-sm">Targeting Case ID: <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{caseId}</span></p>
          <p className="text-zinc-400 text-sm flex items-center">
            Destination Folder:
            <span className="font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded ml-2 text-xs truncate max-w-[200px]">
              {folderId}
            </span>
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Evidence Secured</h3>
            <p className="text-zinc-400 text-sm mb-4">
              {versionDetected
                ? "Existing item found. Appended as a new verified version."
                : "New root item created and secured on-chain."}
            </p>
            <p className="text-zinc-400 text-sm mb-4">Transaction broadcasted successfully.</p>
            <div className="bg-black/50 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-500 w-full truncate">
              Tx: {txHash}
            </div>
            <p className="text-xs text-zinc-500 mt-6 animate-pulse">Redirecting to Dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-6">

            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Smart Upload Logic Enabled</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If an item matching this file's name already exists in the selected folder, this file will be added as a cryptographically linked <strong>new version</strong>. Otherwise, a new evidence container will be created automatically.
              </p>
            </div>

            {/* File Upload Field */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Evidence File</label>
              <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 flex flex-col items-center justify-center bg-black/20 hover:bg-black/40 transition-colors relative">
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <File className="w-10 h-10 text-blue-400 mb-2" />
                    <span className="text-sm text-zinc-300 break-all px-4">{file.name}</span>
                    <span className="text-xs text-zinc-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFile(null); }}
                      className="text-xs bg-red-500/10 text-red-400 mt-4 px-3 py-1 rounded hover:bg-red-500/20 transition-colors z-10"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-12 h-12 text-zinc-600 mb-4" />
                    <p className="text-sm text-zinc-300 mb-1 font-medium">Click to browse or drag and drop</p>
                    <p className="text-xs text-zinc-500 text-center px-4">Supports ALL multimedia types</p>
                  </>
                )}
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  disabled={status !== 'idle'}
                  required
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
                Transaction failed or rejected by wallet.
              </div>
            )}

            <button
              type="submit"
              disabled={status !== 'idle' || !file}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center shadow-lg shadow-blue-500/20 disabled:shadow-none"
            >
              {status === 'idle' && 'Sign & Secure Evidence'}
              {status === 'checking' && 'Checking Folder Integrity...'}
              {status === 'uploading' && 'Encrypting & Storing...'}
              {status === 'awaiting_wallet' && (
                <span className="flex items-center">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
                  Please confirm in wallet...
                </span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
