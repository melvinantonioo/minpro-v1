import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authorizeRoles } from '../middlewares/roleMiddleware';
import { createEvent } from '../controllers/eventController';

const router = express.Router();

router.post(
    '/create',
    authenticateJWT,
    authorizeRoles('ORGANIZER'),
    createEvent
);

export default router;