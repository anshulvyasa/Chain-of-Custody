import type { Request, Response } from "express";
import { prisma } from "../../../../prisma/client";

// Fetches a single case and its entire folder/document tree
export const getCaseController = async (req: Request, res: Response) => {
    try {
        const { caseId } = req.params as { caseId: string };

        const caseData = await prisma.case.findUnique({
            where: { caseId },
            include: {
                // Fetch all folders for this case
                folders: {
                    include: {
                        documentVersions: {
                            orderBy: { uploadTimestamp: 'desc' }
                        }
                    }
                }
            }
        });

        if (!caseData) {
            return res.status(404).json({
                status: false,
                message: "Case not found"
            });
        }

        // We could restructure the flat folders array into a nested tree here, 
        // or send it flat and let the frontend build the tree. 
        // Sending flat is usually easier for React Query updates.
        return res.status(200).json({
            status: true,
            data: caseData
        });

    } catch (error: any) {
        console.error("Failed to fetch case:", error);
        return res.status(500).json({
            status: false,
            message: "An unexpected error occurred"
        });
    }
};

// Fetches all cases for the current investigator
export const getAllCasesController = async (req: Request, res: Response) => {
    try {
        // Typically we would filter by the investigator's wallet from the auth token
        const cases = await prisma.case.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            status: true,
            data: cases
        });

    } catch (error: any) {
        console.error("Failed to fetch cases:", error);
        return res.status(500).json({
            status: false,
            message: "An unexpected error occurred"
        });
    }
};
