import type { Request, Response } from "express";
import { prisma } from "../../../../prisma/client";
import { Prisma } from "@prisma/client";


enum EventType {
    CaseAdded = "CaseAdded",
    InvestigatorAddedToCase = "InvestigatorAddedToCase",
    DocumentHashAdded = "DocumentHashAdded",
    AccessDocument = "AccessDocument",
    NewInvestigatorAdded = "NewInvestigatorAdded",
    RemoveExistingInvestigator = "RemoveExistingInvestigator",
    RemoveCompromizedInvestigator = "RemoveCompromizedInvestigator"
}


interface Filters {
    type?: EventType
    caseId?: string
    initiatorAddress?: string
    caseTitle?: string
    involvedInvestigator?: string
    documentPath?: string
    hash?: string
    cid?: string
}


function buildWhere(filters: Filters): Prisma.EventWhereInput {

    const where: Prisma.EventWhereInput = {};

    if (filters.type !== undefined) {
        where.type = filters.type;
    }

    if (filters.caseId !== undefined) {
        where.caseId = filters.caseId;
    }

    if (filters.initiatorAddress !== undefined) {
        where.initiatorAddress = { startsWith: filters.initiatorAddress };
    }

    if (filters.caseTitle !== undefined) {
        where.caseTitle = filters.caseTitle;
    }

    if (filters.involvedInvestigator !== undefined) {
        where.involvedInvestigator = filters.involvedInvestigator;
    }

    if (filters.documentPath !== undefined) {
        where.documentPath = filters.documentPath;
    }

    if (filters.hash !== undefined) {
        where.hash = { startsWith: filters.hash };
    }

    if (filters.cid !== undefined) {
        where.cid = { startsWith: filters.cid };
    }

    return where;
}



export const getEvents = async (req: Request, res: Response) => {
    const filters: Filters = req.body.filters ?? {};

    const recordsRequired: number = req.body.records_required ?? 50;
    const page: number = req.body.page ?? 1;

    const skip = (page - 1) * recordsRequired;

    try {
        const where = buildWhere(filters);
        const data = await prisma.event.findMany({
            where,
            orderBy: {
                timestamp: "desc"
            },
            take: recordsRequired,
            skip: skip,
            include: { case: true }
        });

        // Populate caseTitle from the Case relation if not set on the event itself
        const enriched = data.map(({ case: caseRel, ...evt }) => ({
            ...evt,
            caseTitle: evt.caseTitle || caseRel?.caseTitle || null
        }));

        res.status(200).json({
            success: true,
            data: enriched
        });

    } catch (error) {

        console.log("Error Fetching Data =", error);

        res.status(500).json({
            success: false,
            message: "Error Fetching Event"
        });

    }

};


export const getEventById = async (req: Request, res: Response) => {
    const id = req.params.id as string;

    try {
        const event = await prisma.event.findUnique({
            where: { id },
            include: { case: true }
        });

        if (!event) {
            res.status(404).json({
                success: false,
                message: "Event not found"
            });
            return;
        }

        // Populate caseTitle from the Case relation if not set on the event itself
        const { case: caseRel, ...evt } = event;
        const enriched = {
            ...evt,
            caseTitle: evt.caseTitle || caseRel?.caseTitle || null
        };

        res.status(200).json({
            success: true,
            data: enriched
        });

    } catch (error) {
        console.log("Error Fetching Event =", error);
        res.status(500).json({
            success: false,
            message: "Error Fetching Event"
        });
    }
};