import { z } from 'zod';


export const caseCreationSchema = z.object({
    walletAddress: z.string().min(1, 'Wallet Address is required'),
    caseId: z.string(),
    caseTitle: z.string(),
    timestamp: z.number(),
});