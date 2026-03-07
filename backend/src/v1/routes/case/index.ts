import express from 'express';
import { createCaseController, healthController } from '../../controllers/case';
const router = express.Router();


router.get('/status', healthController);
router.post('/create-case', createCaseController)

export default router;