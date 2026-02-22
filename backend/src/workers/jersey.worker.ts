import { Worker, Job } from 'bullmq';
import { prisma } from '../lib/prisma';
import { redis } from '../redis/client';
import { BookingJobData } from '../queue/jersey.queue';
import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function setIOInstance(io: SocketIOServer): void {
    ioInstance = io;
}

async function processBookingJob(job: Job<BookingJobData>): Promise<void> {
    const { 
        userId, 
        email, 
        jerseyNumber, 
        fullName,
        contactNumber,
        hoodieSize,
        nameToPrint,
        paymentMode,
        paymentScreenshot,
        socketId 
    } = job.data;
    console.log(`[Worker] ========================================`);
    console.log(`[Worker] Processing booking job`);
    console.log(`[Worker] User ID: ${userId}`);
    console.log(`[Worker] Email: ${email}`);
    console.log(`[Worker] Jersey Number: ${jerseyNumber}`);
    console.log(`[Worker] Full Name: ${fullName}`);
    console.log(`[Worker] Contact: ${contactNumber}`);
    console.log(`[Worker] Hoodie Size: ${hoodieSize}`);
    console.log(`[Worker] Name to Print: ${nameToPrint}`);
    console.log(`[Worker] Payment Mode: ${paymentMode}`);
    console.log(`[Worker] Socket ID: ${socketId}`);
    console.log(`[Worker] ========================================`);

    try {
        console.log(`[Worker] Step 1: Upserting user record...`);
        // 1. Upsert the user record
        const user = await prisma.user.upsert({
            where: { id: userId },
            update: { email, jerseyNumber },
            create: { id: userId, email, jerseyNumber },
        });
        console.log(`[Worker] User upserted:`, user);

        console.log(`[Worker] Step 2: Creating jersey booking record...`);
        // 2. Create jersey booking record (idempotent — unique on jerseyNumber)
        const booking = await prisma.jerseyBooking.upsert({
            where: { jerseyNumber },
            update: {},
            create: { 
                userId, 
                jerseyNumber,
                fullName,
                contactNumber,
                hoodieSize,
                nameToPrint,
                paymentMode,
                paymentScreenshot
            },
        });
        console.log(`[Worker] Booking created:`, booking);

        // 3. Move jersey from locked → taken in Redis atomically
        const pipeline = redis.pipeline();
        pipeline.sadd('jersey:taken', jerseyNumber.toString());
        pipeline.hset('jersey:owners', jerseyNumber.toString(), userId);
        pipeline.hset('jersey:names', jerseyNumber.toString(), nameToPrint);
        pipeline.hdel('jersey:locked', jerseyNumber.toString());
        pipeline.del(`jersey:user:${userId}`);
        await pipeline.exec();

        console.log(`[Worker] Booking confirmed: jersey ${jerseyNumber} → user ${userId}`);

        // 4. Notify all clients of the new state
        if (ioInstance) {
            ioInstance.emit('state:update', {
                jerseyNumber,
                state: 'taken',
                userId,
                ownerName: nameToPrint,
            });

            // Notify the specific user of success
            ioInstance.to(socketId).emit('jersey:success', {
                jerseyNumber,
                message: `Jersey #${jerseyNumber} successfully booked!`,
            });
        }
    } catch (err: any) {
        console.error(`[Worker] Failed to process booking: ${err.message}`);

        // Release the lock so others can try
        await redis.pipeline()
            .hdel('jersey:locked', jerseyNumber.toString())
            .del(`jersey:user:${userId}`)
            .exec();

        // Notify user of failure
        if (ioInstance) {
            ioInstance.to(socketId).emit('jersey:failed', {
                jerseyNumber,
                reason: 'Booking failed due to server error. Please try again.',
            });

            // Rebroadcast available state
            ioInstance.emit('state:update', {
                jerseyNumber,
                state: 'available',
            });
        }

        throw err; // BullMQ will retry
    }
}

export function startWorker(): Worker<BookingJobData> {
    function getBullMQConnection() {
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
            const parsed = new URL(url);
            return {
                host: parsed.hostname,
                port: parseInt(parsed.port || '6379', 10),
                ...(parsed.password ? { password: parsed.password } : {}),
                ...(parsed.username ? { username: parsed.username } : {}),
                maxRetriesPerRequest: null as null,
                enableReadyCheck: false,
            };
        } catch {
            return { host: 'localhost', port: 6379, maxRetriesPerRequest: null as null, enableReadyCheck: false };
        }
    }

    const worker = new Worker<BookingJobData>(
        'jersey-booking',
        processBookingJob,
        {
            connection: getBullMQConnection(),
            concurrency: 5,
        }
    );

    worker.on('ready', () => {
        console.log('[Worker] Worker is ready and waiting for jobs');
    });

    worker.on('active', (job) => {
        console.log(`[Worker] Job ${job.id} is now active`);
    });

    worker.on('completed', (job) => {
        console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
        console.error(`[Worker] ❌ Job ${job?.id} failed after retries:`, err.message);
        console.error(`[Worker] Error stack:`, err.stack);
    });

    worker.on('error', (err) => {
        console.error('[Worker] Worker error:', err);
    });

    console.log('[Worker] Jersey booking worker started');
    return worker;
}
