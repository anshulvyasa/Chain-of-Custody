import { ShieldCheck } from 'lucide-react';
import { useSignMessage } from 'wagmi';
import { useState } from 'react';

interface SignatureGateProps {
  caseIdParam: string;
  onSigned: (signature: string, timestamp: string) => void;
}

export function SignatureGate({ caseIdParam, onSigned }: SignatureGateProps) {
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const handleSign = async () => {
    const ts = Date.now().toString();
    const msg = `get-case-${caseIdParam}-${ts}`;
    try {
      const sig = await signMessageAsync({ message: msg });
      onSigned(sig, ts);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
      <ShieldCheck className="w-16 h-16 mb-4 text-blue-500/50" />
      <p className="mb-6 max-w-sm text-center">To securely view case evidence and ensure access control, please sign a message to verify your identity.</p>
      <button 
        onClick={handleSign} 
        disabled={isSigning} 
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg disabled:opacity-50 flex items-center"
      >
        {isSigning ? (
          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>Signing...</>
        ) : 'Unlock Case Files'}
      </button>
    </div>
  );
}
