import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/admin/bookings
 * Returns all jersey bookings with user details (name, email, time).
 * Protected by x-api-key header.
 */
router.get('/bookings', async (req: Request, res: Response) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.BACKEND_API_KEY) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const bookings = await prisma.jerseyBooking.findMany({
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { jerseyNumber: 'asc' },
        });

        const result = bookings.map((b) => ({
            jerseyNumber: b.jerseyNumber,
            name: b.user?.name ?? 'Unknown',
            email: b.user?.email ?? 'Unknown',
            fullName: b.fullName,
            contactNumber: b.contactNumber,
            hoodieSize: b.hoodieSize,
            nameToPrint: b.nameToPrint,
            paymentScreenshot: b.paymentScreenshot,
            paymentMode: b.paymentMode,
            bookedAt: b.createdAt,
        }));

        res.json({ bookings: result, total: result.length });
    } catch (error: any) {
        console.error('[Admin] Failed to fetch bookings:', error.message);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

export default router;
