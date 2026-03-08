import express from 'express';
import { createCaseController, healthController, getCaseController, getAllCasesController } from '../../controllers/case';
const router = express.Router();


router.get('/status', healthController);
router.post('/create-case', createCaseController);
router.get('/', getAllCasesController);
router.get('/:caseId', getCaseController);

export default router;