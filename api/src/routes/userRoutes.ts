import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { getUserPoints, redeemPoints } from '../controllers/userController';

import { VerifyToken } from '../middlewares/aut.middleware';

const router = express.Router();

router.get('/points', authenticateJWT, getUserPoints);
// router.post('/redeem', authenticateJWT, redeemPoints);

router.post('/redeem', VerifyToken, redeemPoints);

export default router;