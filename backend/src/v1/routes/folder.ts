import express from "express";
import { createFolder, getFolderPath } from "../controllers/folder/create";

const router = express.Router();

router.post("/", createFolder);
router.get("/:folderId/path", getFolderPath);

export default router;
