'use client';

import { useAccount, useConnection } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useIsInvestigator } from '@/lib/hooks';
import { useAllCases } from '@/lib/apiHooks';
import { Folder, ShieldAlert, Search, Plus } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { address, isConnected, isConnecting, isReconnecting } = useConnection();
  const { data: isInvestigator, isLoading: isInvestigatorLoading } = useIsInvestigator();
  const { data: casesData = [], isLoading: isCasesLoading } = useAllCases(address);
  const router = useRouter();

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const isWagmiLoading = isConnecting || isReconnecting;
  const isAuthChecking = !isMounted || isWagmiLoading || isInvestigatorLoading;


  useEffect(() => {
    if (!address) return;

    const f = async () => {

      // const response = await fetch(
      //   "http://localhost:5000/api/v1/investigator/investigator-check-and-create",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       walletAddress: address,
      //     }),
      //   }
      // );
    }

    f();


  }, [address]);

  useEffect(() => {
    if (isAuthChecking) return;

    if (!isConnected || !isInvestigator) {
      router.push('/');
    }
  }, [isAuthChecking, isConnected, isInvestigator, router]);


  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-zinc-400 font-mono text-sm uppercase tracking-widest">
          Verifying clearance...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-6 pb-2 border-b border-zinc-800">
          <div className="flex items-center space-x-2 text-blue-400 font-semibold mb-6">
            <ShieldAlert className="w-5 h-5" />
            <span>Investigator Portal</span>
          </div>
          <div className="mb-4">
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Assigned Cases
            </span>
            <Link href="/dashboard/create" className="text-xs text-blue-400 hover:text-blue-300 flex items-center">
              <Plus className="w-3 h-3 mr-1" /> New
            </Link>
          </div>
          <nav className="space-y-1">
            {isCasesLoading ? (
              <div className="text-xs text-zinc-500 py-2">Loading cases...</div>
            ) : casesData.map((c: any) => (
              <Link
                key={c.caseId}
                href={`/dashboard?caseId=${c.caseId}`}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                <Folder className="w-4 h-4 text-zinc-500" />
                <span className="truncate">{c.caseTitle}</span>
              </Link>
            ))}
          </nav>

          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 mt-8">
            Global Search
          </div>
          <nav className="space-y-1">
            <Link
              href="/audit"
              className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
            >
              <Search className="w-4 h-4 text-zinc-500" />
              <span>Audit Log</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50 backdrop-blur-md">
          <h2 className="text-lg font-medium text-zinc-100">Case Evidence Management</h2>
          <div className="text-xs bg-zinc-800 px-3 py-1 rounded-full text-zinc-400 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
            Connected to Chain
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}