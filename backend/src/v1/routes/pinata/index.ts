import express from 'express';
import { createUploadUrl, getSignedUrl } from '../../controllers/pinata';
const router = express.Router();

router.get('/create-upload-url', createUploadUrl);
router.get('/signed-url/:cid', getSignedUrl);

export default router;