import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

// Base URL for API requests
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api/v1';

export function useCase(caseId: string | null, address: string | undefined, signature?: string, timestamp?: string) {
  return useQuery({
    queryKey: ['caseStructure', caseId, address, signature, timestamp],
    queryFn: async () => {
      const headers: Record<string, string> = {
        'walletAddress': address || ''
      };
      if (signature && timestamp) {
        headers['signature'] = signature;
        headers['timestamp'] = timestamp;
      }
      
      const res = await fetch(`${BACKEND_URL}/case/${caseId}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch case data');
      const data = await res.json();
      return data.data;
    },
    enabled: !!caseId && !!address && !!signature && !!timestamp,
  });
}

export function useAllCases(address: string | undefined) {
  return useQuery({
    queryKey: ['cases', address],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/case`, {
        headers: {
          'walletAddress': address || ''
        }
      });
      if (!res.ok) throw new Error('Failed to fetch cases');
      const data = await res.json();
      return data.data;
    },
    enabled: !!address,
  });
}

export interface EventFilterParams {
  type?: string
  caseId?: string
  initiatorAddress?: string
  caseTitle?: string
  involvedInvestigator?: string
  documentPath?: string
  hash?: string
  cid?: string
}

export type EventItem = {
  id: string
  type: string
  timestamp: string
  initiatorAddress: string
  caseId: string
  caseTitle?: string | null
  involvedInvestigator?: string | null
  documentPath?: string | null
  hash?: string | null
  cid?: string | null
}

export function useEvents(
  page: number,
  recordsRequired: number,
  filters: EventFilterParams,
  address: string | undefined
) {
  return useQuery({
    queryKey: ['events', page, recordsRequired, filters, address],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/event/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          walletAddress: address || ''
        },
        body: JSON.stringify({
          page,
          records_required: recordsRequired,
          filters,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch events: ${text}`);
      }

      const data = await res.json();
      return (data.data ?? []) as EventItem[];
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 15,
  });
}

export function useCreateFolder(address: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { name: string; type: 'NORMAL' | 'SPECIAL'; caseId: string; parentId?: string | null }) => {
      const res = await fetch(`${BACKEND_URL}/folder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'walletAddress': address || ''
        },
        body: JSON.stringify(args)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create folder');
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['caseStructure', variables.caseId, address] });
    }
  });
}

export async function useCreateUploadUrl(address: string | undefined) {
  try {
    const res = await fetch(`${BACKEND_URL}/pinata/create-upload-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'walletAddress': address || ''
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create upload url');

    return data;

  }
  catch (error) {
    console.error('Error creating upload url:', error);
    throw error;
  }

}

// Resolves a folderId UUID into a full path string (e.g. "evidence/photos/crime-scene")
export async function fetchFolderPath(folderId: string, address: string | undefined): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/folder/${folderId}/path`, {
    headers: {
      'walletAddress': address || ''
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to resolve folder path');
  return data.path;
}

// Gets a temporary signed URL for accessing a privately-stored Pinata file
export async function fetchSignedUrl(cid: string, address: string | undefined): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/pinata/signed-url/${cid}`, {
    headers: {
      'walletAddress': address || ''
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to get signed URL');
  return data.url;
}


export function useEventById(id: string, address: string | undefined) {
  return useQuery({
    queryKey: ['event', id, address],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/event/${id}`, {
        headers: {
          'walletAddress': address || '',
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch event: ${text}`);
      }
      const data = await res.json();
      return (data.data ?? null) as EventItem | null;
    },
    enabled: !!id,
  });
}
