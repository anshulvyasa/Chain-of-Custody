import { z } from 'zod';

export const InvestigatorCheckSchema = z.object({
    walletAddress: z.string().min(1, "Wallet address is required")
})
