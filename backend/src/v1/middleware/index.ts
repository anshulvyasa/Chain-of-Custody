import type { NextFunction, Request, Response } from "express";
import { InvestigatorCheckSchema } from "../../../zod/investigator";
import { contract } from "../../../configs/ethers";

export const authorizeInvestigatorFromBlockchain = async (req: Request, res: Response, next: NextFunction) => {
    const parsedHeader = InvestigatorCheckSchema.safeParse({ walletAddress: req.header("walletAddress") });

    if (!parsedHeader.success) {
        res.status(400).json({
            success: false,
            message: "Wallet Address Not Provided"
        })
        return;
    }

    const walletAddress = parsedHeader.data.walletAddress;
    const isInvestigator = await contract.getFunction("investigators")(walletAddress);


    if (!isInvestigator) {
        res.status(400).json({
            success: false,
            message: "You are not a Authenticated Investigator"
        })
        return;
    }

    next();
}