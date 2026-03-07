'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsInvestigator } from '@/lib/hooks';
import { Folder, LogOut, ShieldAlert, FileText, Search, Plus } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useAccount();
  const { data: isInvestigator, isLoading, isError } = useIsInvestigator();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected || (!isLoading && !isInvestigator)) {
      router.push('/');
    }
  }, [isConnected, isInvestigator, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading clearance data...</div>;
  }

  // Define some mock cases since we haven't hooked up the DB fetching yet
  const mockCases = [
    { id: 'case-1029', title: 'Operation Alpha' },
    { id: 'case-1033', title: 'Financial Fraud 24X' },
    { id: 'case-1045', title: 'Digital Asset Theft' },
  ];

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
            {mockCases.map((c) => (
              <Link
                key={c.id}
                href={`/dashboard?caseId=${c.id}`}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-zinc-800 transition-colors text-sm text-zinc-300"
              >
                <Folder className="w-4 h-4 text-zinc-500" />
                <span>{c.title}</span>
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
