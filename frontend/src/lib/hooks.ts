import { useReadContract, useWriteContract, useAccount, usePublicClient } from 'wagmi';
import { CASE_CONTRACT_ABI, CONTRACT_ADDRESS } from './contracts';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  const accessDocument = async (caseId: string, documentPath: string) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'accessDocument',
      args: [caseId, documentPath],
    });
    return tx;
  };

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

  return { addDocumentHash, createNewCase, accessDocument };
}

export function useInvestigatorContractActions() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const addNewInvestigator = async (address: string, role: string) => {
    const roleMap: Record<string, number> = {
      "SPECIALADMIN": 0,
      "ADMIN": 1,
      "NORMAL": 2
    };

    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'addNewInvestigator',
      args: [address, roleMap[role]],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: tx });
    }
  };

  const promoteToAdmin = async (address: string) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'promoteToAdmin',
      args: [address],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: tx });
    }
  };

  const promoteToSpecialAdmin = async (address: string) => {
    const tx = await writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: CASE_CONTRACT_ABI,
      functionName: 'promoteToSpecialAdmin',
      args: [address],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash: tx });
    }
  };

  return { addNewInvestigator, promoteToAdmin, promoteToSpecialAdmin };
}
