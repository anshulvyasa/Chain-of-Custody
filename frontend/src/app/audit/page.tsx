'use client';

import { useState, useEffect } from 'react';
import { Search, Activity, ShieldAlert, FileSearch, ArrowUpRight } from 'lucide-react';
import { usePublicClient } from 'wagmi';
import { CASE_CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contracts';

type BlockchainEvent = {
  id: string;
  type: 'CaseAdded' | 'InvestigatorAddedToCase' | 'DocumentHashAdded';
  blockNumber: string;
  timestamp: string;
  investigator: string;
  caseId?: string;
  documentId?: string;
  hashInfo?: string;
};

export default function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    // Generate some mock history while connecting to Viem
    // In a real app, we would use publicClient.getContractEvents or getLogs here
    const fetchEvents = async () => {
      setIsLoading(true);
      
      try {
        // Fallback to mock data for the UI demonstration
        const mockEvents: BlockchainEvent[] = [
          {
            id: 'evt-1',
            type: 'CaseAdded',
            blockNumber: '19045322',
            timestamp: new Date().toISOString(),
            investigator: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            caseId: 'case-1029',
          },
          {
            id: 'evt-2',
            type: 'InvestigatorAddedToCase',
            blockNumber: '19045330',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            investigator: '0x123d35Cc6634C0532925a3b844Bc454e4438f44e',
            caseId: 'case-1033',
          },
          {
            id: 'evt-3',
            type: 'DocumentHashAdded',
            blockNumber: '19045412',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            investigator: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            caseId: 'case-1029',
            documentId: 'doc-8812',
            hashInfo: '0x10309120301...',
          }
        ];
        
        // Simulate network delay
        setTimeout(() => {
          setEvents(mockEvents);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Failed to fetch viem events", err);
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [publicClient]);

  const filteredEvents = events.filter(e => 
    e.investigator.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.caseId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Global Audit Log</h1>
            <p className="text-zinc-400">Verifiable trace of all on-chain investigative actions.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search by case, wallet, or event type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg w-full md:w-80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Contract Address</p>
              <p className="text-sm font-mono text-zinc-200">{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-black/40 text-xs text-zinc-400 uppercase tracking-wider border-b border-zinc-800 border-t-0">
                <tr>
                  <th className="px-6 py-4 font-medium">Event Type</th>
                  <th className="px-6 py-4 font-medium">Block / Time</th>
                  <th className="px-6 py-4 font-medium">Investigator Wallet</th>
                  <th className="px-6 py-4 font-medium">Case Target</th>
                  <th className="px-6 py-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center">
                        <Activity className="w-6 h-6 animate-pulse mb-2 text-blue-500" />
                        Fetching smart contract logs...
                      </div>
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      No matching events found in the blockchain history.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {evt.type === 'CaseAdded' && <ShieldAlert className="w-4 h-4 text-emerald-400 mr-2" />}
                          {evt.type === 'InvestigatorAddedToCase' && <Activity className="w-4 h-4 text-blue-400 mr-2" />}
                          {evt.type === 'DocumentHashAdded' && <FileSearch className="w-4 h-4 text-purple-400 mr-2" />}
                          <span className="font-medium text-zinc-300">{evt.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-blue-400 font-mono text-xs hover:underline cursor-pointer">#{evt.blockNumber}</span>
                          <span className="text-zinc-500 text-xs">{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs bg-zinc-800/80 px-2 py-1 rounded text-zinc-300">
                          {evt.investigator.slice(0, 6)}...{evt.investigator.slice(-4)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {evt.caseId ? (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-xs font-mono">
                            {evt.caseId}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {evt.type === 'DocumentHashAdded' && evt.hashInfo ? (
                          <button className="text-xs text-zinc-400 hover:text-white flex items-center justify-end w-full group">
                            <span className="truncate w-24 mr-2">{evt.hashInfo}</span>
                            <ArrowUpRight className="w-3 h-3 group-hover:text-blue-400" />
                          </button>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
