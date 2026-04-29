import type { Request, Response } from "express";
import { prisma } from "../../../../prisma/client";

import { ethers } from "ethers";

// Fetches a single case and its entire folder/document tree
export const getCaseController = async (req: Request, res: Response) => {
    try {
        const { caseId } = req.params as { caseId: string };
        const { signature, timestamp } = req.headers;
        const walletAddress = req.headers['walletaddress'] as string;

        if (!walletAddress) {
            return res.status(400).json({ status: false, message: "Wallet address required" });
        }

        if (signature && timestamp) {
            const now = Date.now();
            const reqTime = Number(timestamp);
            if (Math.abs(now - reqTime) > 5 * 60 * 1000) {
                return res.status(401).json({ status: false, message: "Request expired" });
            }
            const message = `get-case-${caseId}-${timestamp}`;
            try {
                const recoveredAddress = ethers.verifyMessage(message, signature as string);
                if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                    return res.status(401).json({ status: false, message: "Invalid signature" });
                }
            } catch (e) {
                return res.status(401).json({ status: false, message: "Signature verification failed" });
            }
        }

        const caseData = await prisma.case.findUnique({
            where: { caseId },
            include: {
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

        const restricted = await prisma.investigatorRestrictedPath.findMany({
            where: {
                caseId,
                investigatorWallet: walletAddress
            }
        });
        const restrictedPaths = new Set(restricted.map(r => r.documentPath));

        const folderPaths = new Map<string, string>();
        const getFullPath = (folderId: string): string => {
            if (folderPaths.has(folderId)) return folderPaths.get(folderId)!;
            const folder = caseData.folders.find(f => f.id === folderId);
            if (!folder) return "";
            if (!folder.parentId) {
                folderPaths.set(folderId, folder.name);
                return folder.name;
            }
            const parentPath = getFullPath(folder.parentId);
            const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name;
            folderPaths.set(folderId, fullPath);
            return fullPath;
        };

        const isRestricted = (fullPath: string) => {
            const segments = fullPath.split('/');
            let current = "";
            for (const seg of segments) {
                current = current ? `${current}/${seg}` : seg;
                if (restrictedPaths.has(current)) return true;
            }
            return false;
        };

        const allowedFolders = caseData.folders.filter(f => !isRestricted(getFullPath(f.id)));

        const folderMap = new Map<string, any>();
        const roots: any[] = [];

        allowedFolders.forEach(f => {
            folderMap.set(f.id, {
                id: f.id,
                type: f.type === 'SPECIAL' ? 'item' : 'folder',
                name: f.name,
                children: [],
                versions: f.documentVersions || []
            });
        });

        allowedFolders.forEach(f => {
            const node = folderMap.get(f.id);
            if (f.parentId && folderMap.has(f.parentId)) {
                folderMap.get(f.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        });

        const responseData = {
            ...caseData,
            foldersTree: roots
        };

        return res.status(200).json({
            status: true,
            data: responseData
        });

    } catch (error: any) {
        console.error("Failed to fetch case:", error);
        return res.status(500).json({
            status: false,
            message: "An unexpected error occurred"
        });
    }
};

// Fetches all cases for the current investigator Todo Add Investigator here
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
