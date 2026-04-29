import { randomUUID } from 'crypto';
import { contract, CONTRACT_ADDRESS } from '../../configs/ethers';
import { prisma } from '../../prisma/client';

// ---------------------------------------------------------------------------
// Serial event queue – prevents race conditions when multiple events fire
// in the same block/transaction (e.g. CaseAdded + InvestigatorAddedToCase).
// ---------------------------------------------------------------------------
const eventQueue: (() => Promise<void>)[] = [];
let processing = false;

async function enqueueEvent(handler: () => Promise<void>) {
    eventQueue.push(handler);
    if (processing) return;
    processing = true;
    while (eventQueue.length > 0) {
        const next = eventQueue.shift()!;
        try {
            await next();
        } catch (e) {
            console.error("Event processing error:", e);
        }
    }
    processing = false;
}

export const setupBlockchainListeners = () => {
    console.log("Setting up blockchain listeners...");

    // Listen to CaseAdded Event
    contract.on("CaseAdded", async (investigator, caseId, caseTitle, timestamp, initiatorAuthority) => {
        const caseIdStr = String(caseId);
        const investigatorStr = String(investigator);
        const caseTitleStr = String(caseTitle);
        const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
        const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";
        console.log(`Event CaseAdded: Case ${caseIdStr} created by ${investigatorStr} at ${timestamp}`);

        enqueueEvent(async () => {
            try {
                await prisma.$transaction([
                    prisma.investigator.upsert({
                        where: { walletAddress: investigatorStr },
                        update: {},  // Don't overwrite authority — promotion events handle that
                        create: { walletAddress: investigatorStr, authority: initAuthStr }
                    }),
                    prisma.case.upsert({
                        where: { caseId: caseIdStr },
                        update: { caseTitle: caseTitleStr },
                        create: {
                            caseId: caseIdStr,
                            caseTitle: caseTitleStr || "Blockchain Imported Case",
                            createdAt: new Date(Number(timestamp) * 1000),
                            createdByWallet: investigatorStr
                        }
                    }),
                    prisma.event.create({
                        data: {
                            type: "CaseAdded",
                            timestamp: new Date(Number(timestamp) * 1000),
                            caseId: caseIdStr,
                            initiatorAddress: investigatorStr,
                            caseTitle: caseTitleStr,
                            authority: initAuthStr
                        }
                    })
                ]);
                console.log(`Successfully Indexed CaseAdded for ${caseIdStr}`);
            } catch (error) {
                console.error(`Error saving CaseAdded to DB:`, error);
            }
        });
    });

    // Listen to DocumentHashAdded Event
    contract.on(
        "DocumentHashAdded",
        async (investigator, caseId, documentPath, timestamp, info, initiatorAuthority) => {
            const docPathStr = String(documentPath);
            const caseIdStr = String(caseId);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            let hashStr = "";
            let cidStr = "";

            if (info) {
                hashStr = String(info.hash);
                cidStr = String(info.cid);
            }

            const investigatorStr = String(investigator);
            const ts = Number(timestamp);

            console.log("DocumentedHashAdded Event Triggered");

            enqueueEvent(async () => {
                try {
                    await prisma.investigator.upsert({
                        where: { walletAddress: investigatorStr },
                        update: {},  // Don't overwrite authority
                        create: { walletAddress: investigatorStr, authority: initAuthStr }
                    });

                    await prisma.case.upsert({
                        where: { caseId: caseIdStr },
                        update: {},
                        create: {
                            caseId: caseIdStr,
                            caseTitle: "Pending Case Details...",
                            createdAt: new Date(ts * 1000),
                            createdByWallet: investigatorStr
                        }
                    });

                    await prisma.event.create({
                        data: {
                            type: "DocumentHashAdded",
                            timestamp: new Date(ts * 1000),
                            caseId: caseIdStr,
                            initiatorAddress: investigatorStr,
                            documentPath: docPathStr,
                            hash: hashStr,
                            cid: cidStr,
                            authority: initAuthStr
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
            });
        }
    );

    // Listen to AccessDocument Event
    contract.on(
        "AccessDocument",
        async (investigator, caseId, docuemntPath, timeStamp, initiatorAuthority) => {
            const caseIdStr = String(caseId);
            const investigatorStr = String(investigator);
            const docPathStr = String(docuemntPath);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";
            const ts = Number(timeStamp);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: investigatorStr, authority: initAuthStr }
                        }),
                        prisma.case.upsert({
                            where: { caseId: caseIdStr },
                            update: {},
                            create: {
                                caseId: caseIdStr,
                                caseTitle: "Pending Case Details...",
                                createdAt: new Date(ts * 1000),
                                createdByWallet: investigatorStr
                            }
                        }),
                        prisma.event.create({
                            data: {
                                type: "AccessDocument" as any,
                                timestamp: new Date(ts * 1000),
                                caseId: caseIdStr,
                                initiatorAddress: investigatorStr,
                                documentPath: docPathStr,
                                authority: initAuthStr
                            }
                        })
                    ]);

                    console.log(`Successfully indexed AccessDocument for ${caseIdStr} at ${docPathStr}`);
                } catch (error) {
                    console.error("Error processing AccessDocument:", error);
                }
            });
        }
    );

    // Listen to NewInvestigatorAdded Event
    contract.on(
        "NewInvestigatorAdded",
        async (investigator, from, investigatorAuthority, timestamp, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const authorityStr = authorityMap[Number(investigatorAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";
            const ts = Number(timestamp);

            console.log(`Event NewInvestigatorAdded: ${investigatorStr} added by ${fromStr} with role ${authorityStr} at ${ts}`);

            enqueueEvent(async () => {
                try {
                    const txOps: any[] = [
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: { authority: authorityStr },  // This IS the canonical source for authority
                            create: { walletAddress: investigatorStr, authority: authorityStr }
                        })
                    ];

                    // Skip upserting the contract address as an investigator
                    if (fromStr.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
                        txOps.push(
                            prisma.investigator.upsert({
                                where: { walletAddress: fromStr },
                                update: {},  // Don't overwrite initiator authority
                                create: { walletAddress: fromStr, authority: initAuthStr }
                            })
                        );
                    }

                    // Use investigator as initiator if 'from' is the contract address (constructor events)
                    const effectiveInitiator = fromStr.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
                        ? fromStr
                        : investigatorStr;

                    txOps.push(
                        prisma.event.create({
                            data: {
                                type: "NewInvestigatorAdded",
                                timestamp: new Date(ts * 1000),
                                initiatorAddress: effectiveInitiator,
                                involvedInvestigator: investigatorStr,
                                authority: authorityStr
                            }
                        })
                    );

                    await prisma.$transaction(txOps);
                    console.log("Successfully Indexed Event NewInvestigatorAdded");
                } catch (error) {
                    console.error("Error processing NewInvestigatorAdded:", error);
                }
            });
        }
    );

    // Listen to InvestigatorPathAllowed Event
    contract.on(
        "InvestigatorPathAllowed",
        async (investigator, admin, caseId, documentPath, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const adminStr = String(admin);
            const caseIdStr = String(caseId);
            const docPathStr = String(documentPath);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorPathAllowed: ${investigatorStr} allowed access to ${docPathStr} in case ${caseIdStr} by ${adminStr}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: adminStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: adminStr, authority: initAuthStr }
                        }),
                        prisma.investigatorAllowedPath.upsert({
                            where: {
                                investigatorWallet_caseId_documentPath: {
                                    investigatorWallet: investigatorStr,
                                    caseId: caseIdStr,
                                    documentPath: docPathStr
                                }
                            },
                            update: {},
                            create: {
                                investigatorWallet: investigatorStr,
                                caseId: caseIdStr,
                                documentPath: docPathStr
                            }
                        }),
                        prisma.case.upsert({
                            where: { caseId: caseIdStr },
                            update: {},
                            create: {
                                caseId: caseIdStr,
                                caseTitle: "Pending Case Details...",
                                createdAt: new Date(ts * 1000),
                                createdByWallet: adminStr
                            }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorPathAllowed" as any,
                                timestamp: new Date(ts * 1000),
                                caseId: caseIdStr,
                                initiatorAddress: adminStr,
                                involvedInvestigator: investigatorStr,
                                documentPath: docPathStr,
                                authority: initAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed InvestigatorPathAllowed");
                } catch (error) {
                    console.error("Error processing InvestigatorPathAllowed:", error);
                }
            });
        }
    );

    // Listen to InvestigatorPathRevoked Event
    contract.on(
        "InvestigatorPathRevoked",
        async (investigator, admin, caseId, documentPath, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const adminStr = String(admin);
            const caseIdStr = String(caseId);
            const docPathStr = String(documentPath);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorPathRevoked: ${investigatorStr} access revoked from ${docPathStr} in case ${caseIdStr} by ${adminStr}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: adminStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: adminStr, authority: initAuthStr }
                        }),
                        prisma.investigatorAllowedPath.deleteMany({
                            where: {
                                investigatorWallet: investigatorStr,
                                caseId: caseIdStr,
                                documentPath: docPathStr
                            }
                        }),
                        prisma.case.upsert({
                            where: { caseId: caseIdStr },
                            update: {},
                            create: {
                                caseId: caseIdStr,
                                caseTitle: "Pending Case Details...",
                                createdAt: new Date(ts * 1000),
                                createdByWallet: adminStr
                            }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorPathRevoked" as any,
                                timestamp: new Date(ts * 1000),
                                caseId: caseIdStr,
                                initiatorAddress: adminStr,
                                involvedInvestigator: investigatorStr,
                                documentPath: docPathStr,
                                authority: initAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed InvestigatorPathRevoked");
                } catch (error) {
                    console.error("Error processing InvestigatorPathRevoked:", error);
                }
            });
        }
    );

    // Listen to InvestigatorAddedToCase Event
    contract.on(
        "InvestigatorAddedToCase",
        async (investigator, from, caseId, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const caseIdStr = String(caseId);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorAddedToCase: ${investigatorStr} added to ${caseIdStr} by ${fromStr}`);

            enqueueEvent(async () => {
                try {
                    const txOps: any[] = [
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        })
                    ];

                    // Skip upserting the contract address as an investigator
                    if (fromStr.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
                        txOps.push(
                            prisma.investigator.upsert({
                                where: { walletAddress: fromStr },
                                update: {},  // Don't overwrite authority
                                create: { walletAddress: fromStr, authority: initAuthStr }
                            })
                        );
                    }

                    txOps.push(
                        prisma.case.upsert({
                            where: { caseId: caseIdStr },
                            update: {},
                            create: {
                                caseId: caseIdStr,
                                caseTitle: "Pending Case Details...",
                                createdAt: new Date(ts * 1000),
                                createdByWallet: fromStr.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
                                    ? fromStr
                                    : investigatorStr
                            }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorAddedToCase",
                                timestamp: new Date(ts * 1000),
                                caseId: caseIdStr,
                                initiatorAddress: fromStr.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()
                                    ? fromStr
                                    : investigatorStr,
                                involvedInvestigator: investigatorStr,
                                authority: initAuthStr
                            }
                        })
                    );

                    await prisma.$transaction(txOps);
                    console.log("Successfully Indexed InvestigatorAddedToCase");
                } catch (error) {
                    console.error("Error processing InvestigatorAddedToCase:", error);
                }
            });
        }
    );

    // Listen to InvestigatorRemovedFromCase Event
    contract.on(
        "InvestigatorRemovedFromCase",
        async (investigator, from, caseId, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const caseIdStr = String(caseId);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorRemovedFromCase: ${investigatorStr} removed from ${caseIdStr} by ${fromStr}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: fromStr },
                            update: {},  // Don't overwrite authority
                            create: { walletAddress: fromStr, authority: initAuthStr }
                        }),
                        prisma.case.upsert({
                            where: { caseId: caseIdStr },
                            update: {},
                            create: {
                                caseId: caseIdStr,
                                caseTitle: "Pending Case Details...",
                                createdAt: new Date(ts * 1000),
                                createdByWallet: fromStr
                            }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorRemovedFromCase",
                                timestamp: new Date(ts * 1000),
                                caseId: caseIdStr,
                                initiatorAddress: fromStr,
                                involvedInvestigator: investigatorStr,
                                authority: initAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed InvestigatorRemovedFromCase");
                } catch (error) {
                    console.error("Error processing InvestigatorRemovedFromCase:", error);
                }
            });
        }
    );

    // Listen to InvestigatorPromotedToAdmin Event
    contract.on(
        "InvestigatorPromotedToAdmin",
        async (investigator, from, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorPromotedToAdmin: ${investigatorStr} promoted to ADMIN by ${fromStr} at ${ts}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: { authority: targetAuthStr },  // Promotion — DO update authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: fromStr },
                            update: {},  // Don't overwrite initiator authority
                            create: { walletAddress: fromStr, authority: initAuthStr }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorPromotedToAdmin",
                                timestamp: new Date(ts * 1000),
                                initiatorAddress: fromStr,
                                involvedInvestigator: investigatorStr,
                                authority: targetAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed InvestigatorPromotedToAdmin");
                } catch (error) {
                    console.error("Error processing InvestigatorPromotedToAdmin:", error);
                }
            });
        }
    );

    // Listen to InvestigatorPromotedToSpecialAdmin Event
    contract.on(
        "InvestigatorPromotedToSpecialAdmin",
        async (investigator, from, timestamp, targetAuthority, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(targetAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event InvestigatorPromotedToSpecialAdmin: ${investigatorStr} promoted to SPECIALADMIN by ${fromStr} at ${ts}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: { authority: targetAuthStr },  // Promotion — DO update authority
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: fromStr },
                            update: {},  // Don't overwrite initiator authority
                            create: { walletAddress: fromStr, authority: initAuthStr }
                        }),
                        prisma.event.create({
                            data: {
                                type: "InvestigatorPromotedToSpecialAdmin",
                                timestamp: new Date(ts * 1000),
                                initiatorAddress: fromStr,
                                involvedInvestigator: investigatorStr,
                                authority: targetAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed InvestigatorPromotedToSpecialAdmin");
                } catch (error) {
                    console.error("Error processing InvestigatorPromotedToSpecialAdmin:", error);
                }
            });
        }
    );

    // Listen to RemoveExistingInvestigator Event
    contract.on(
        "RemoveExistingInvestigator",
        async (investigator, from, investigatorAuthority, timestamp, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(investigatorAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event RemoveExistingInvestigator: ${investigatorStr} removed by ${fromStr} at ${ts}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: fromStr },
                            update: {},
                            create: { walletAddress: fromStr, authority: initAuthStr }
                        }),
                        prisma.event.create({
                            data: {
                                type: "RemoveExistingInvestigator",
                                timestamp: new Date(ts * 1000),
                                initiatorAddress: fromStr,
                                involvedInvestigator: investigatorStr,
                                authority: targetAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed RemoveExistingInvestigator");
                } catch (error) {
                    console.error("Error processing RemoveExistingInvestigator:", error);
                }
            });
        }
    );

    // Listen to RemoveCompromizedInvestigator Event
    contract.on(
        "RemoveCompromizedInvestigator",
        async (investigator, from, investigatorAuthority, timestamp, initiatorAuthority) => {
            const investigatorStr = String(investigator);
            const fromStr = String(from);
            const ts = Number(timestamp);
            const authorityMap = ["SPECIALADMIN", "ADMIN", "NORMAL"];
            const targetAuthStr = authorityMap[Number(investigatorAuthority)] || "NORMAL";
            const initAuthStr = authorityMap[Number(initiatorAuthority)] || "NORMAL";

            console.log(`Event RemoveCompromizedInvestigator: ${investigatorStr} removed (compromised) by ${fromStr} at ${ts}`);

            enqueueEvent(async () => {
                try {
                    await prisma.$transaction([
                        prisma.investigator.upsert({
                            where: { walletAddress: investigatorStr },
                            update: {},
                            create: { walletAddress: investigatorStr, authority: targetAuthStr }
                        }),
                        prisma.investigator.upsert({
                            where: { walletAddress: fromStr },
                            update: {},
                            create: { walletAddress: fromStr, authority: initAuthStr }
                        }),
                        prisma.event.create({
                            data: {
                                type: "RemoveCompromizedInvestigator",
                                timestamp: new Date(ts * 1000),
                                initiatorAddress: fromStr,
                                involvedInvestigator: investigatorStr,
                                authority: targetAuthStr
                            }
                        })
                    ]);
                    console.log("Successfully Indexed RemoveCompromizedInvestigator");
                } catch (error) {
                    console.error("Error processing RemoveCompromizedInvestigator:", error);
                }
            });
        }
    );
};
