import type { Request, Response } from "express";
import { prisma } from "../../../../prisma/client";
import { z } from "zod";

const createFolderSchema = z.object({
    name: z.string().min(1, "Folder name is required"),
    type: z.enum(["NORMAL", "SPECIAL"]),
    caseId: z.string(),
    parentId: z.string().optional().nullable(),
});

export const createFolder = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = createFolderSchema.safeParse(req.body);

        if (!parsed.success) {
            res.status(400).json({
                success: false,
                message: "Invalid input",
                errors: parsed.error.format(),
            });
            return;
        }

        const { name, type, caseId, parentId } = parsed.data;

        // Verify the case exists
        const caseExists = await prisma.case.findUnique({
            where: { caseId },
        });

        if (!caseExists) {
            res.status(404).json({
                success: false,
                message: "Case not found",
            });
            return;
        }

        // If parentId is provided, verify it exists and is NORMAL
        if (parentId) {

            const parentFolder = await prisma.folder.findUnique({
                where: { id: parentId },
            });

            if (!parentFolder) {
                res.status(404).json({
                    success: false,
                    message: "Parent folder not found",
                });
                return;
            }

            if (parentFolder.caseId !== caseId) {
                res.status(400).json({
                    success: false,
                    message: "Parent folder does not belong to the specified case",
                });
                return;
            }

            if (parentFolder.type === "SPECIAL") {
                res.status(400).json({
                    success: false,
                    message: "Cannot create a subfolder inside a SPECIAL folder",
                });
                return;
            }
        }

        // Check for duplicate folder name in the same location
        const duplicate = await prisma.folder.findFirst({
            where: {
                caseId,
                parentId: parentId || null,
                name,
            },
        });

        if (duplicate) {
            res.status(409).json({
                success: false,
                message: `A folder named '${name}' already exists in this location`,
            });
            return;
        }

        // Create the folder
        const newFolder = await prisma.folder.create({
            data: {
                name,
                type,
                caseId,
                parentId: parentId || null,
            },
        });

        res.status(201).json({
            success: true,
            message: "Folder created successfully",
            data: newFolder,
        });
    } catch (error) {
        console.error("Error creating folder:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Resolves a folderId into a full path string by walking up the parent chain
// e.g. folderId for "crime-scene" -> "evidence/photos/crime-scene"
export const getFolderPath = async (req: Request, res: Response): Promise<void> => {
    try {
        const { folderId } = req.params as { folderId: string };

        if (!folderId) {
            res.status(400).json({ success: false, message: "folderId is required" });
            return;
        }

        const pathSegments: string[] = [];
        let currentId: string | null = folderId;

        // Walk up the parent chain to build the full path
        while (currentId) {
            const folder: { name: string; parentId: string | null } | null = await prisma.folder.findUnique({
                where: { id: currentId },
                select: { name: true, parentId: true }
            });

            if (!folder) {
                res.status(404).json({ success: false, message: `Folder not found: ${currentId}` });
                return;
            }

            pathSegments.unshift(folder.name);
            currentId = folder.parentId;
        }

        const fullPath = pathSegments.join("/");

        res.status(200).json({
            success: true,
            path: fullPath,
        });
    } catch (error) {
        console.error("Error resolving folder path:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
