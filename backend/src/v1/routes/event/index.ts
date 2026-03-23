import express from "express";
import { getEvents, getEventById } from "../../controllers/event";

const router = express.Router();

router.post('/get', getEvents)
router.get('/:id', getEventById)

export default router;