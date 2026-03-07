import { useReadContract, useWriteContract, useAccount } from 'wagmi';
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

export function useCaseContractActions() {
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const addDocumentHash = async (caseId: string, documentId: string, hash: string) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'addDocumentHash',
      args: [caseId, documentId, hash],
    });
  };

  const createNewCase = async (title: string, caseId: string) => {
    if (!address) throw new Error("Wallet not connected");
    return writeContractAsync({
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
  };

  return { addDocumentHash, createNewCase };
}
