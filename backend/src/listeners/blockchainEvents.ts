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

            await prisma.event.create({
                data: {
                    type: "CaseAdded",
                    timestamp: new Date(Number(timestamp) * 1000),
                    caseId: caseIdStr,
                    initiatorAddress: investigatorStr,
                    caseTitle: caseTitleStr
                }
            })

            console.log("Succesfully Indexed Events Case Added")

        } catch (error) {
            console.error(`Error saving CaseAdded to DB:`, error);
        }
    });

    // Listen to DocumentHashAdded Event
    contract.on(
        "DocumentHashAdded",
        async (investigator, caseId, documentPath, timestamp, info) => {

            const docPathStr = String(documentPath);
            const caseIdStr = String(caseId);

            let hashStr = "";
            let cidStr = "";

            if (info) {
                hashStr = String(info.hash);
                cidStr = String(info.cid);
            }

            const investigatorStr = String(investigator);
            const ts = Number(timestamp);

            console.log("DocumentedHashAdded Event Triggered");

            try {

                await prisma.event.create({
                    data: {
                        type: "DocumentHashAdded",
                        timestamp: new Date(ts * 1000),
                        caseId: caseIdStr,
                        initiatorAddress: investigatorStr,
                        documentPath: docPathStr,
                        hash: hashStr,
                        cid: cidStr
                    }
                });

                const segments = docPathStr.split("/").filter(Boolean);
                if (segments.length === 0) return;

                let currentParentId: string | null = null;
                const foldersToCreate: any[] = [];

                const existingFolders = await prisma.folder.findMany({
                    where: { caseId: caseIdStr }
                });

                for (let i = 0; i < segments.length; i++) {

                    const isSpecial = i === segments.length - 1;
                    const segmentName = segments[i];

                    const existingFolder = existingFolders.find(
                        f => f.name === segmentName && f.parentId === currentParentId
                    );

                    if (existingFolder) {
                        currentParentId = existingFolder.id;
                    } else {

                        const newId = randomUUID();

                        foldersToCreate.push({
                            id: newId,
                            name: segmentName,
                            type: isSpecial ? "SPECIAL" : "NORMAL",
                            caseId: caseIdStr,
                            parentId: currentParentId
                        });

                        currentParentId = newId;
                    }
                }

                const operations: any[] = [];

                if (foldersToCreate.length > 0) {
                    operations.push(
                        prisma.folder.createMany({ data: foldersToCreate })
                    );
                }

                if (currentParentId) {
                    operations.push(
                        prisma.documentVersion.create({
                            data: {
                                folderId: currentParentId,
                                documentHash: hashStr,
                                fileUrl: cidStr,
                                uploaderWallet: investigatorStr,
                                uploadTimestamp: new Date(ts * 1000),
                            }
                        })
                    );
                }

                if (operations.length > 0) {
                    await prisma.$transaction(operations);
                }

            } catch (error) {
                console.error("Error processing DocumentHashAdded:", error);
            }
        }
    );

    // Listen to AccessDocument Event
    contract.on(
        "AccessDocument",
        async (investigator, caseId, docuemntPath, timeStamp) => {
            const caseIdStr = String(caseId);
            const investigatorStr = String(investigator);
            const docPathStr = String(docuemntPath);
            const ts = Number(timeStamp);

            try {
                await prisma.event.create({
                    data: {
                        type: "AccessDocument" as any,
                        timestamp: new Date(ts * 1000),
                        caseId: caseIdStr,
                        initiatorAddress: investigatorStr,
                        documentPath: docPathStr,
                    }
                });

                console.log(`Successfully indexed AccessDocument for ${caseIdStr} at ${docPathStr}`);
            } catch (error) {
                console.error("Error processing AccessDocument:", error);
            }
        }
    );

    // Listen to NewInvestigatorAdded Event
    contract.on(
        "NewInvestigatorAdded",
        async (investigator, from, investigatorAuthority, timestamp) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const authorityStr = authorityMap[Number(investigatorAuthority)] || "NORMAL";
            const ts = Number(timestamp);

            console.log(`Event NewInvestigatorAdded: ${investigatorStr} added by ${fromStr} with role ${authorityStr} at ${ts}`);

            try {
                await prisma.$transaction([
                    prisma.investigator.upsert({
                        where: { walletAddress: investigatorStr },
                        update: { authority: authorityStr },
                        create: { walletAddress: investigatorStr, authority: authorityStr }
                    }),
                    prisma.investigator.upsert({
                        where: { walletAddress: fromStr },
                        update: {},
                        create: { walletAddress: fromStr }
                    }),
                    prisma.event.create({
                        data: {
                            type: "NewInvestigatorAdded",
                            timestamp: new Date(ts * 1000),
                            initiatorAddress: fromStr,
                            involvedInvestigator: investigatorStr,
                            authority: authorityStr
                        }
                    })
                ]);
                console.log("Successfully Indexed Event NewInvestigatorAdded");
            } catch (error) {
                console.error("Error processing NewInvestigatorAdded:", error);
            }
        }
    );
};
