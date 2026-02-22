import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { prisma } from '../lib/prisma';
import { redis } from '../redis/client';
import { getIO } from '../sockets';
import fs from 'fs';
import path from 'path';

const router = Router();

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ── Multer with Cloudinary storage ───────────────────────────────────────────
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'jersey-payments',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        transformation: [{ quality: 'auto' }],
    } as any,
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Load Lua script once at startup
const LUA_PATH = path.join(__dirname, '../redis/jersey.lua');
const LUA_SCRIPT = fs.readFileSync(LUA_PATH, 'utf-8');

/**
 * POST /api/booking/submit
 * Handles the full booking form submission:
 *   1. Validates form fields
 *   2. Checks jersey availability atomically via Redis
 *   3. Uploads payment screenshot to Cloudinary (via multer middleware)
 *   4. Creates JerseyBooking in DB
 *   5. Emits socket events to all clients
 */
router.post(
    '/submit',
    upload.single('paymentScreenshot'),
    async (req: Request, res: Response) => {
        const {
            userId,
            jerseyNumber: jerseyNumberStr,
            fullName,
            contactNumber,
            hoodieSize,
            nameToPrint,
            paymentMode,
        } = req.body as Record<string, string>;

        const jerseyNumber = parseInt(jerseyNumberStr, 10);

        // ── Validation ────────────────────────────────────────────────────────
        if (
            !userId ||
            isNaN(jerseyNumber) ||
            jerseyNumber < 0 ||
            jerseyNumber > 99 ||
            !fullName?.trim() ||
            !contactNumber?.trim() ||
            !hoodieSize?.trim() ||
            !nameToPrint?.trim() ||
            !paymentMode?.trim()
        ) {
            res.status(400).json({ error: 'Missing or invalid form fields.' });
            return;
        }

        if (!req.file) {
            res.status(400).json({ error: 'Payment screenshot is required.' });
            return;
        }

        const screenshotUrl = (req.file as any).path as string;

        try {
            // ── Atomic jersey lock via Redis Lua ──────────────────────────────
            const result = await redis.eval(
                LUA_SCRIPT,
                3,
                'jersey:taken',          // KEYS[1]
                `jersey:user:${userId}`,  // KEYS[2]
                'jersey:locked',          // KEYS[3]
                userId,                   // ARGV[1]
                jerseyNumber.toString(),  // ARGV[2]
                '0'                       // ARGV[3] (0 = permanent/no TTL)
            ) as [number, string];

            if (result[0] !== 1) {
                res.status(409).json({ error: result[1] || 'Jersey is already taken or locked.' });
                return;
            }

            // Mark as taken in Redis
            await redis.sadd('jersey:taken', jerseyNumber.toString());
            await redis.hset('jersey:owners', jerseyNumber.toString(), userId);
            await redis.hdel('jersey:locked', jerseyNumber.toString());

            // ── DB write ──────────────────────────────────────────────────────
            const booking = await prisma.jerseyBooking.create({
                data: {
                    userId,
                    jerseyNumber,
                    fullName: fullName.trim(),
                    contactNumber: contactNumber.trim(),
                    hoodieSize: hoodieSize.trim(),
                    nameToPrint: nameToPrint.trim(),
                    paymentScreenshot: screenshotUrl,
                    paymentMode: paymentMode.trim(),
                },
            });

            // Also update User.jerseyNumber for quick lookup
            await prisma.user.update({
                where: { id: userId },
                data: { jerseyNumber },
            });

            // ── Emit real-time update ─────────────────────────────────────────
            const io = getIO();
            if (io) {
                io.emit('state:update', {
                    jerseyNumber,
                    state: 'taken',
                    userId
                });
            }

            console.log(`[Booking] Jersey ${jerseyNumber} booked by ${userId} (${fullName})`);
            res.json({ success: true, jerseyNumber, bookingId: booking.id });
        } catch (error: any) {
            console.error('[Booking] Submit failed:', error.message);
            res.status(500).json({ error: 'Booking failed. Please try again.' });
        }
    }
);

export default router;
