import type { Request, Response } from "express";
import { pinata } from "../../../../configs/pinata";

export const createUploadUrl = async (req: Request, res: Response) => {
    try {
        const url = await pinata.upload.private.createSignedURL({
            expires: 15
        });

        return res.status(200).json({
            success: true,
            message: "Successfully Created Signed Upload Url",
            url
        })
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ text: "Error creating API Key:" });
    }
}

export const getSignedUrl = async (req: Request, res: Response) => {
    try {
        const { cid } = req.params as { cid: string };
        if (!cid) {
            return res.status(400).json({ success: false, message: "CID is required" });
        }

        // Create a temporary access link for private file access (valid for 30 minutes)
        const signedUrl = await pinata.gateways.private.createAccessLink({
            cid: cid,
            expires: 1800
        });

        return res.status(200).json({
            success: true,
            url: signedUrl
        });
    } catch (error) {
        console.error("Error creating signed URL:", error);
        return res.status(500).json({ success: false, message: "Error creating signed URL" });
    }
}
