import { randomUUID } from 'crypto';
import { contract } from '../../configs/ethers';
import { prisma } from '../../prisma/client';

export const setupBlockchainListeners = () => {
    console.log("Setting up blockchain listeners...");

    // Listen to CaseAdded Event
    contract.on("CaseAdded", async (investigator, caseId, caseTitle, timestamp) => {
        const caseIdStr = String(caseId);
        const investigatorStr = String(investigator);
        const caseTitleStr = String(caseTitle);
        console.log(`Event CaseAdded: Case ${caseIdStr} created by ${investigatorStr} at ${timestamp}`);
        try {
            await prisma.case.upsert({
                where: { caseId: caseIdStr },
                update: {}, // No updates needed if it exists
                create: {
                    caseId: caseIdStr,
                    caseTitle: caseTitleStr || "Blockchain Imported Case", // Fallback title
                    createdAt: new Date(Number(timestamp) * 1000),
                    createdBy: {
                        connectOrCreate: {
                            where: { walletAddress: investigatorStr },
                            create: { walletAddress: investigatorStr }
                        }
                    }
                }
            });
            console.log(`Successfully created case ${caseId} from blockchain event.`);
        } catch (error) {
            console.error(`Error saving CaseAdded to DB:`, error);
        }
    });

    // Listen to DocumentHashAdded Event
    contract.on("DocumentHashAdded", async (investigator, caseId, documentPath, info) => {
        const docPathStr = String(documentPath);
        const caseIdStr = String(caseId);

        console.log("RAW INFO RECEIVED:", info);
        let hashStr = "";
        let cidStr = "";

        if (info && typeof info === 'object') {
            hashStr = String(info.hash || info[0] || "");
            cidStr = String(info.cid || info[1] || "");
        }

        const investigatorStr = String(investigator);

        console.log(`Event DocumentHashAdded: Case ${caseIdStr}, Path ${docPathStr}, Hash ${hashStr}, CID ${cidStr} by ${investigatorStr}`);
        try {
            // documentId acts as the path, e.g., "window/glass/rear"
            const segments = docPathStr.split("/").filter(Boolean);
            if (segments.length === 0) return;

            let currentParentId: string | null = null;
            const foldersToCreate: any[] = [];

            // 1. Fetch all existing folders for this case at once
            const existingFolders = await prisma.folder.findMany({ where: { caseId: caseIdStr } });


            // 2. Compute missing folders in-memory
            for (let i = 0; i < segments.length; i++) {
                const isSpecial = i === segments.length - 1;
                const segmentName = segments[i];

                const existingFolder = existingFolders.find(
                    (f) => f.name === segmentName && f.parentId === currentParentId
                );

                if (existingFolder) {
                    currentParentId = existingFolder.id;
                } else {
                    const newId = randomUUID();
                    foldersToCreate.push({
                        id: newId,
                        name: segmentName,
                        type: isSpecial ? "SPECIAL" : "NORMAL",
                        caseId,
                        parentId: currentParentId
                    });
                    currentParentId = newId;
                }
            }

            // 3. Batch execute DB creations
            const operations: any[] = [];

            if (foldersToCreate.length > 0) {
                operations.push(prisma.folder.createMany({ data: foldersToCreate }));
            }

            if (currentParentId) {
                operations.push(prisma.documentVersion.create({
                    data: {
                        folderId: currentParentId,
                        documentHash: hashStr,
                        fileUrl: cidStr,
                        uploaderWallet: investigatorStr,
                        uploadTimestamp: new Date(),
                    }
                }));
            }

            if (operations.length > 0) {
                await prisma.$transaction(operations);
                console.log(`Document version saved under path ${docPathStr} for case ${caseIdStr}.`);
            }

        } catch (error) {
            console.error(`Error processing DocumentHashAdded event:`, error);
        }
    });
};
