import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";
import bcrypt, { genSalt } from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

// Fungsi untuk generate referral code
const generateReferralCode = (name: string): string => {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 digit angka acak
    return `${name.toUpperCase()}${randomNumber}`;
};

export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, role, referralCode } = req.body;

    try {
        // Cek apakah email sudah terdaftar
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'Email sudah terdaftar' });
            return;
        } //done 

        // Hash password
        const salt = await genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate referral code
        const generatedReferralCode = generateReferralCode(name);

        // Mulai transaksi
        await prisma.$transaction(async (prisma) => {
            // Buat user baru
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role,
                    referralCode: generatedReferralCode,
                },
            });

            // Jika ada referral code yang diberikan
            if (referralCode) {
                const referrer = await prisma.user.findUnique({
                    where: { referralCode },
                });

                if (referrer) {
                    // Tambahkan entry ke tabel Referral
                    await prisma.referral.create({
                        data: {
                            referrerId: referrer.id,
                            referredUserId: newUser.id,
                            pointsEarned: 10000, // Poin yang didapat per referral
                            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Kedaluwarsa dalam 3 bulan
                        },
                    });

                    // Update poin referrer
                    await prisma.user.update({
                        where: { id: referrer.id },
                        data: {
                            points: referrer.points + 10000,
                        },
                    });
                } else {
                    return res.status(400).json({ message: 'Kode referral tidak valid' });
                }
            }

            // Kembalikan data user baru (tanpa password)
            res.status(201).json({
                message: 'Registrasi berhasil',
                user: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    referralCode: newUser.referralCode,
                    points: newUser.points,
                },
            });
        });
    } catch (error) {
        res.status(500).json({ message: 'Registrasi gagal', error: "Error Register" });
    }
};


export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Cari user berdasarkan email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: 'Email atau password salah' });
            return;
        }

        // Cek password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Email atau password salah' });
            return;
        }

        const payload = {
            email,
            name: user.name,
            role: user.role,
        };

        // Generate token JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role }, //payload
            process.env.SECRET_KEY as string, //secret key from env
            { expiresIn: '1h' } //expire
        );

        // Kembalikan data user dan token
        res.status(200).cookie("access_token", token).json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                referralCode: user.referralCode,
                points: user.points,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Login gagal', error: "Error Login" });
    }
};

//logic regis and login done 