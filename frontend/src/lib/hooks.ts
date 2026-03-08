import { useReadContract, useWriteContract, useAccount, useConnection } from 'wagmi';
import { CASE_CONTRACT_ABI, CONTRACT_ADDRESS } from './contracts';

export function useIsInvestigator() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CASE_CONTRACT_ABI,
    functionName: 'investigators',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });
}

import { useQueryClient } from '@tanstack/react-query';

export function useCaseContractActions() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useConnection();
  const queryClient = useQueryClient();

  const addDocumentHash = async (caseId: string, documentId: string, hash: string, cid: string) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'addDocumentHash',
      args: [caseId, documentId, hash, cid],
    });
    queryClient.invalidateQueries({ queryKey: ['caseStructure', caseId] });
    return tx;
  };

  const createNewCase = async (title: string, caseId: string) => {
    if (!address) throw new Error("Wallet not connected");
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'createCase',
      args: [
        {
          caseTitle: title,
          createdAt: BigInt(Math.floor(Date.now() / 1000)),
          createdBy: address
        },
        caseId
      ],
    });
    queryClient.invalidateQueries({ queryKey: ['cases'] });
    return tx;
  };

  return { addDocumentHash, createNewCase };
}
