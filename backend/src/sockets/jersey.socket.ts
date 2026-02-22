import fs from 'fs';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { redis } from '../redis/client';
import { addBookingJob } from '../queue/jersey.queue';
import { checkRateLimit } from '../utils/rateLimit';

// Load Lua script
const luaScript = fs.readFileSync(
    path.join(__dirname, '../redis/jersey.lua'),
    'utf-8'
);

export type JerseyState = 'available' | 'locked' | 'taken';

export interface JerseyStateMap {
    [number: string]: {
        state: JerseyState;
        userId?: string;
        ownerName?: string;
    };
}

/**
 * Build the complete jersey state from Redis
 */
async function getFullJerseyState(): Promise<JerseyStateMap> {
    const stateMap: JerseyStateMap = {};

    // Initialize all 0-99 as available
    for (let i = 0; i < 100; i++) {
        stateMap[i.toString()] = { state: 'available' };
    }

    // Get taken jerseys
    const takenJerseys = await redis.smembers('jersey:taken');
    for (const num of takenJerseys) {
        // Get user from bookings - look up via a lookup hash
        const userId = await redis.hget('jersey:owners', num);
        const ownerName = await redis.hget('jersey:names', num);
        stateMap[num] = { state: 'taken', userId: userId || undefined, ownerName: ownerName || undefined };
    }

    // Get locked jerseys
    const lockedMap = await redis.hgetall('jersey:locked');
    if (lockedMap) {
        for (const [num, userId] of Object.entries(lockedMap)) {
            stateMap[num] = { state: 'locked', userId };
        }
    }

    return stateMap;
}

export function registerJerseySocket(io: SocketIOServer, socket: Socket): void {
    const userId = (socket as any).userId as string;
    const email = (socket as any).email as string;

    console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);

    // ── state:init ──────────────────────────────────────────────────────────────
    // Send full state when user connects
    getFullJerseyState()
        .then((state) => {
            socket.emit('state:init', state);
        })
        .catch((err) => {
            console.error('[Socket] Failed to send state:init', err);
        });

    // ── jersey:reserve ──────────────────────────────────────────────────────────
    socket.on('jersey:reserve', async (data: { 
        jerseyNumber: number;
        fullName: string;
        contactNumber: string;
        hoodieSize: string;
        nameToPrint: string;
        paymentMode: string;
        paymentScreenshot: string;
    }) => {
        const { jerseyNumber, fullName, contactNumber, hoodieSize, nameToPrint, paymentMode, paymentScreenshot } = data;

        console.log(`[Socket] User ${userId} attempting to reserve jersey ${jerseyNumber}`);
        console.log(`[Socket] Booking details: ${fullName}, ${contactNumber}, ${hoodieSize}, ${nameToPrint}, ${paymentMode}`);

        // Rate limiting: max 3 reservation attempts per 10 seconds per user
        const rateCheck = await checkRateLimit(userId, 'jersey:reserve', {
            maxRequests: 3,
            windowSeconds: 10,
        });

        if (!rateCheck.allowed) {
            console.log(`[Socket] Rate limit exceeded for user ${userId}`);
            socket.emit('jersey:failed', {
                jerseyNumber,
                reason: 'Too many attempts. Please wait 10 seconds before trying again.',
            });
            return;
        }

        // Validate form fields
        if (!fullName?.trim() || !contactNumber?.trim() || !hoodieSize?.trim() || !nameToPrint?.trim() || !paymentMode?.trim() || !paymentScreenshot) {
            console.log(`[Socket] Missing required form fields`);
            socket.emit('jersey:failed', {
                jerseyNumber,
                reason: 'All form fields are required.',
            });
            return;
        }

        if (jerseyNumber < 0 || jerseyNumber > 99 || !Number.isInteger(jerseyNumber)) {
            console.log(`[Socket] Invalid jersey number: ${jerseyNumber}`);
            socket.emit('jersey:failed', {
                jerseyNumber,
                reason: 'Invalid jersey number. Must be 0–99.',
            });
            return;
        }

        try {
            // Execute atomic Lua script
            const result = await redis.eval(
                luaScript,
                3,
                'jersey:taken',          // KEYS[1]
                `jersey:user:${userId}`,  // KEYS[2]
                'jersey:locked',          // KEYS[3]
                userId,                   // ARGV[1]
                jerseyNumber.toString(),  // ARGV[2]
                '30'                      // ARGV[3] – lock TTL in seconds
            ) as [number, string];

            const [code, message] = result;

            console.log(`[Socket] Lua script result for jersey ${jerseyNumber}: code=${code}, message=${message}`);

            if (code !== 1) {
                // Map error codes to user-friendly messages
                const reasons: Record<number, string> = {
                    [-1]: 'You already have a jersey reserved.',
                    [-2]: 'Jersey is already taken by another member.',
                    [-3]: 'Jersey is temporarily locked. Try another or wait 30 seconds.',
                };
                console.log(`[Socket] Reservation failed: ${reasons[code]}`);
                socket.emit('jersey:failed', {
                    jerseyNumber,
                    reason: reasons[code] || 'Reservation failed.',
                });
                return;
            }

            console.log(`[Socket] Lock acquired for jersey ${jerseyNumber}, broadcasting and queuing`);

            // Lock acquired — broadcast locked state to all
            io.emit('state:update', {
                jerseyNumber,
                state: 'locked',
                userId,
            });

            // Add to queue for DB persistence with all booking form data
            await addBookingJob(
                userId, 
                email, 
                jerseyNumber, 
                fullName,
                contactNumber,
                hoodieSize,
                nameToPrint,
                paymentMode,
                paymentScreenshot,
                socket.id
            );

        } catch (err: any) {
            console.error('[Socket] jersey:reserve error:', err);
            socket.emit('jersey:failed', {
                jerseyNumber,
                reason: 'Server error. Please try again.',
            });
        }
    });

    // ── disconnect ──────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] User ${userId} disconnected: ${reason}`);
    });
}
