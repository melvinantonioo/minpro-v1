import { Request, Response } from 'express';
import prisma from '../utils/db';
import { User } from '../custom';

export const getUserPoints = async (req: Request, res: Response) => {
    const user = req.user as User;

    try {
        const points = user.points;
        res.status(200).json({ points });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mendapatkan poin', error: "Error Get Point" });
    }
};


export const redeemPoints = async (req: Request, res: Response) => {
    // const user = (req as any).user;

    const user = req.user as User;
    const { pointsToRedeem } = req.body;

    console.log(pointsToRedeem);

    if (pointsToRedeem <= 0) {
        res.status(400).json({ message: 'Jumlah poin tidak valid' });
        return;
    }

    if (user.points < pointsToRedeem) {
        res.status(400).json({ message: 'Poin tidak mencukupi' });
        return;
    }

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                points: user.points - pointsToRedeem,
            },
        });


        // Tambahkan transaksi poin jika diperlukan
        await prisma.pointTransaction.create({
            data: {
                userId: user.id,
                points: -pointsToRedeem,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                reason: 'Redeem Points',
            },
        });

        res.status(200).json({ message: 'Poin berhasil ditukarkan' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menukarkan poin', error: "Error Get Point" });
    }
};