// seed.ts

import { PrismaClient, Role, EventType, OrderStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Hash passwords
    const passwordAlice = await bcrypt.hash('password123', 10);
    const passwordBob = await bcrypt.hash('password123', 10);
    const passwordCharlie = await bcrypt.hash('password123', 10);

    // Create Users
    const alice = await prisma.user.create({
        data: {
            name: 'Alice',
            email: 'alice@example.com',
            password: passwordAlice,
            role: Role.ORGANIZER,
            referralCode: 'ALICE123',
            points: 0,
        },
    });

    const bob = await prisma.user.create({
        data: {
            name: 'Bob',
            email: 'bob@example.com',
            password: passwordBob,
            role: Role.ATTENDEE,
            referralCode: 'BOB456',
            points: 10000,
        },
    });

    const charlie = await prisma.user.create({
        data: {
            name: 'Charlie',
            email: 'charlie@example.com',
            password: passwordCharlie,
            role: Role.ATTENDEE,
            referralCode: 'CHARLIE789',
            points: 10000,
        },
    });

    // Create Referrals
    const referral1 = await prisma.referral.create({
        data: {
            referrerId: alice.id,
            referredUserId: bob.id,
            pointsEarned: 10000,
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        },
    });

    const referral2 = await prisma.referral.create({
        data: {
            referrerId: bob.id,
            referredUserId: charlie.id,
            pointsEarned: 10000,
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        },
    });

    // Create PointTransactions
    await prisma.pointTransaction.createMany({
        data: [
            {
                userId: alice.id,
                points: 10000,
                expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                reason: 'Referral bonus from Bob',
            },
            {
                userId: bob.id,
                points: 10000,
                expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                reason: 'Referral bonus from Charlie',
            },
        ],
    });

    // Create Categories
    const categoryTech = await prisma.category.create({
        data: {
            name: 'Technology',
        },
    });

    const categoryMusic = await prisma.category.create({
        data: {
            name: 'Music',
        },
    });

    // Create Events
    const event1 = await prisma.event.create({
        data: {
            name: 'Tech Conference 2024',
            description: 'A conference about technology.',
            price: 500000,
            date: new Date('2024-01-10'),
            time: new Date('2024-01-10T09:00:00'),
            location: 'Jakarta',
            capacity: 100,
            availableSeats: 98,
            type: EventType.PAID,
            organizerId: alice.id,
            categories: {
                create: [
                    {
                        categoryId: categoryTech.id,
                    },
                ],
            },
        },
        include: {
            categories: true,
        },
    });

    const event2 = await prisma.event.create({
        data: {
            name: 'Music Festival 2024',
            description: 'A festival with various artists.',
            price: 0,
            date: new Date('2024-02-15'),
            time: new Date('2024-02-15T17:00:00'),
            location: 'Bandung',
            capacity: 500,
            availableSeats: 500,
            type: EventType.FREE,
            organizerId: alice.id,
            categories: {
                create: [
                    {
                        categoryId: categoryMusic.id,
                    },
                ],
            },
        },
        include: {
            categories: true,
        },
    });

    // Create Tickets
    const ticket1 = await prisma.ticket.create({
        data: {
            eventId: event1.id,
            type: 'General Admission',
            price: 500000,
            quantity: 100,
        },
    });

    const ticket2 = await prisma.ticket.create({
        data: {
            eventId: event2.id,
            type: 'Free Pass',
            price: 0,
            quantity: 500,
        },
    });

    // Create Orders and OrderItems
    // Order 1 - Bob membeli tiket untuk event1
    // Order 1 - Bob membeli tiket untuk event1
    const order1 = await prisma.order.create({
        data: {
            user: {
                connect: { id: bob.id },
            },
            event: {
                connect: { id: event1.id },
            },
            ticketQty: 1, // Menggunakan field ticketQty
            totalPrice: 500000,
            status: OrderStatus.COMPLETED,
            createdAt: new Date(),
            OrderItem: {
                create: [
                    {
                        ticket: {
                            connect: { id: ticket1.id },
                        },
                        quantity: 1,
                        price: 500000,
                    },
                ],
            },
        },
        include: {
            OrderItem: true,
        },
    });

    // Order 2 - Charlie membeli tiket untuk event1
    const order2 = await prisma.order.create({
        data: {
            user: {
                connect: { id: charlie.id },
            },
            event: {
                connect: { id: event1.id },
            },
            ticketQty: 1,
            totalPrice: 500000,
            status: OrderStatus.COMPLETED,
            createdAt: new Date(),
            OrderItem: {
                create: [
                    {
                        ticket: {
                            connect: { id: ticket1.id },
                        },
                        quantity: 1,
                        price: 500000,
                    },
                ],
            },
        },
        include: {
            OrderItem: true,
        },
    });

    // Update availableSeats and ticket quantity
    await prisma.event.update({
        where: { id: event1.id },
        data: {
            availableSeats: { decrement: 2 },
        },
    });

    await prisma.ticket.update({
        where: { id: ticket1.id },
        data: {
            quantity: { decrement: 2 },
        },
    });

    // Create Transactions
    await prisma.transaction.createMany({
        data: [
            {
                userId: bob.id,
                eventId: event1.id,
                orderId: order1.id,
                amount: 500000,
                paymentMethod: 'CreditCard',
                status: PaymentStatus.COMPLETED,
                createdAt: new Date(),
            },
            {
                userId: charlie.id,
                eventId: event1.id,
                orderId: order2.id,
                amount: 500000,
                paymentMethod: 'CreditCard',
                status: PaymentStatus.COMPLETED,
                createdAt: new Date(),
            },
        ],
    });

    // Create Promotion
    await prisma.promotion.create({
        data: {
            eventId: event1.id,
            code: 'EARLYBIRD',
            discountRate: 10.0,
            validUntil: new Date('2023-12-31'),
            maxUses: 50,
            currentUses: 2,
        },
    });

    // Create Reviews
    await prisma.review.createMany({
        data: [
            {
                userId: bob.id,
                eventId: event1.id,
                rating: 5,
                comment: 'Great event!',
                createdAt: new Date(),
            },
            {
                userId: charlie.id,
                eventId: event1.id,
                rating: 4,
                comment: 'Very informative.',
                createdAt: new Date(),
            },
        ],
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });