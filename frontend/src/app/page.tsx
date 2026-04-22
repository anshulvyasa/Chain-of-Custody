'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Shield, FileSearch, Lock } from 'lucide-react';
import { useIsInvestigator } from '@/lib/hooks';
import { useInvestigatorAuthority } from '@/lib/redux/feature_hooks/investigator_authority';

export default function LandingPage() {
  const { isConnected } = useAccount();
  const { data: isInvestigator, isLoading } = useIsInvestigator();
  const router = useRouter();
  const { updateInvestigatorAuthority } = useInvestigatorAuthority();


  // Redirect to dashboard if they are connected and authorized
  useEffect(() => {
    console.log("Is Invetigator is ", isInvestigator)
    if (isConnected && isInvestigator && Array.isArray(isInvestigator) && isInvestigator.length == 2) {
      updateInvestigatorAuthority({ idx: isInvestigator[0], exist: isInvestigator[1] })
      router.push('/dashboard');
    }
  }, [isConnected, isInvestigator, router]);

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background generic grid/glow effect for "Aceternity" style */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-0 flex w-full justify-center">
          <div className="h-[200px] w-full max-w-[600px] bg-blue-500/20 blur-[120px]"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-20 pb-40 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-sm"
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium tracking-wide text-blue-100">Verifiable Digital Forensics</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
        >
          Chain of Custody
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12"
        >
          An immutable, cryptographically secure decentralized application for legal investigators to manage, track, and verify digital evidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="p-1 rounded-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 backdrop-blur-md border border-white/10">
            <div className="bg-black/50 px-8 py-6 rounded-lg flex flex-col items-center min-w-[320px]">
              <h3 className="text-lg font-medium text-white mb-6">Access Investigator Portal</h3>
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
              />
              {isConnected && isLoading && (
                <p className="text-sm text-blue-400 mt-4 animate-pulse">Verifying clearance level...</p>
              )}
              {isConnected && !isLoading && !isInvestigator && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm text-center">
                  Access Denied. Your wallet is not authorized as an investigator in the smart contract.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Features Row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full text-left"
        >
          {[
            {
              title: "Immutable Records",
              description: "Evidence hashes are anchored to the blockchain, ensuring mathematical proof of non-tampering.",
              icon: <Lock className="w-6 h-6 text-blue-400" />
            },
            {
              title: "Version History",
              description: "Logical nested folders preserve past document versions up to the current iteration.",
              icon: <FileSearch className="w-6 h-6 text-purple-400" />
            },
            {
              title: "Verifiable Access",
              description: "Only Admin-approved wallet addresses can upload or modify case files.",
              icon: <Shield className="w-6 h-6 text-emerald-400" />
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                {feature.icon}
              </div>
              <h4 className="text-lg font-medium text-white mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
