import type { Request, Response } from "express"
import { caseCreationSchema } from "../../../../zod/case"
import { prisma } from "../../../../prisma/client"
import { z } from 'zod';

export const healthController = (req: Request, res: Response) => {
    res.status(200).json({ message: "Health Check" })
}

export const createCaseController = async (req: Request, res: Response) => {
    const parsedBody = caseCreationSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            status: false,
            message: "Validation Error",
            errors: z.treeifyError(parsedBody.error)
        });
    }

    try {
        const caseData = await prisma.case.create({
            data: {
                caseId: parsedBody.data.caseId,
                caseTitle: parsedBody.data.caseTitle,
                createdAt: new Date(parsedBody.data.timestamp * 1000),
                createdBy: {
                    connectOrCreate: {
                        where: {
                            walletAddress: parsedBody.data.walletAddress
                        },
                        create: {
                            walletAddress: parsedBody.data.walletAddress
                        }
                    }
                }
            }
        });

        return res.status(201).json({
            status: true,
            data: caseData
        });

    } catch (error: any) {
        console.error("Failed to create case:", error);

        if (error.code === 'P2002') {
            return res.status(409).json({
                status: false,
                message: "Case ID already exists"
            });
        }

        return res.status(500).json({
            status: false,
            message: "An unexpected error occurred"
        });
    }
};