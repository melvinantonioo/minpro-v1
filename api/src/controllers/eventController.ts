import { Request, Response } from 'express';
import { PrismaClient } from "@prisma/client";

import { EventType } from '@prisma/client';

const prisma = new PrismaClient();

export const createEvent = async (req: Request, res: Response) => {
    const { name, description, price, date, time, location, capacity, type, organizerId } = req.body;

    try {
        // Validasi input dan konversi tipe data
        const parsedPrice = parseFloat(price);
        const parsedCapacity = parseInt(capacity);
        const parsedOrganizerId = parseInt(organizerId);

        // Validasi tipe event
        if (!Object.values(EventType).includes(type)) {  //jangan lupa import eventype , punya prisma client bawaan 
            res
                .status(400)
                .json({ success: false, message: 'Type event tidak valid' });
            return;
        }

        // Menggabungkan tanggal dan waktu, digabung agar formatnya valid 
        const dateTimeString = `${date}T${time}`;
        const eventDateTime = new Date(dateTimeString);

        if (isNaN(eventDateTime.getTime())) {
            res
                .status(400)
                .json({ success: false, message: 'Format tanggal atau waktu tidak valid' });
            return;
        }

        // Pastikan organizer ada
        const organizer = await prisma.user.findUnique({
            where: { id: parsedOrganizerId },
        });

        if (!organizer) {
            res
                .status(404)
                .json({ success: false, message: 'Organizer tidak ditemukan' });
            return;
        }

        // Membuat event baru
        const event = await prisma.event.create({
            data: {
                name,
                description,
                price: parsedPrice,
                date: eventDateTime,
                time: eventDateTime,
                location,
                capacity: parsedCapacity,
                availableSeats: parsedCapacity, // Mengatur availableSeats sama dengan capacity
                type,
                organizer: {
                    connect: { id: parsedOrganizerId }, // Menghubungkan ke organizer menggunakan connect
                },
            },
        });

        res.status(201).json({ success: true, event });
    } catch (error) {
        res.status(400).json({ success: false, message: "error create event" });
    }
};

export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany();
        res.status(200).json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error" });
    }
};