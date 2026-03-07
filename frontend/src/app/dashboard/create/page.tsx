'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Activity, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useCaseContractActions } from '@/lib/hooks';

export default function CreateCasePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [customId, setCustomId] = useState('');
  const [status, setStatus] = useState<'idle' | 'awaiting_wallet' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState('');
  const { createNewCase } = useCaseContractActions();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    try {
      setStatus('awaiting_wallet');

      // Use provided ID or generate a unique one
      const finalCaseId = customId.trim() || `case-${Date.now().toString().slice(-6)}`;

      const tx = await createNewCase(title, finalCaseId);

      setTxHash(tx);
      setStatus('success');

      // Redirect to the new case dashboard after a short delay
      setTimeout(() => {
        router.push(`/dashboard?caseId=${finalCaseId}`);
      }, 3000);

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto py-12">
      <button
        onClick={() => router.push('/dashboard')}
        className="text-zinc-500 hover:text-white flex items-center mb-8 transition-colors self-start"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative flair */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Open New Case</h2>
            <p className="text-zinc-400 text-sm">Register a new investigation securely on-chain.</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Case Registered</h3>
            <p className="text-zinc-400 text-sm mb-6">The blockchain ledger has been updated.</p>
            <div className="bg-black/50 border border-zinc-800 rounded p-3 text-xs font-mono text-zinc-500 w-full truncate">
              Tx: {txHash}
            </div>
            <p className="text-xs text-zinc-500 mt-6 animate-pulse">Routing to Case Dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Case Title / Designation</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operation Silk Road"
                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-zinc-600"
                disabled={status !== 'idle'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Custom Case ID <span className="text-zinc-500 font-normal">(Optional)</span></label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="Leave blank to auto-generate"
                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder-zinc-600 font-mono"
                disabled={status !== 'idle'}
              />
              <p className="text-xs text-zinc-500 mt-2">This ID is permanently etched into the smart contract and cannot be changed.</p>
            </div>

            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center">
                <Activity className="w-4 h-4 mr-2 shrink-0" />
                Transaction failed. Please ensure your wallet has sufficient test ETH and you are an Admin.
              </div>
            )}

            <button
              type="submit"
              disabled={status !== 'idle' || !title}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center mt-4"
            >
              {status === 'idle' && 'Issue Case to Ledger'}
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
