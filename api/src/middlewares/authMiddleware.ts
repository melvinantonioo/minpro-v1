import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

interface AuthenticatedRequest extends Request {
    user?: any;
}

export const authenticateJWT = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader)

    if (!authHeader) {
        res.status(401).json({ message: 'Token tidak ditemukan' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            res.status(401).json({ message: 'Token tidak valid' });
            return;
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token tidak valid' });
    }
};