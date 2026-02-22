import { Queue } from 'bullmq';

export interface BookingJobData {
    userId: string;
    email: string;
    jerseyNumber: number;
    socketId: string;
}

// BullMQ bundles its own ioredis — pass a plain config object,
// NOT the external ioredis instance, to avoid version type conflicts.
function getBullMQConnection() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port || '6379', 10),
            ...(parsed.password ? { password: parsed.password } : {}),
            ...(parsed.username ? { username: parsed.username } : {}),
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        };
    } catch {
        return {
            host: 'localhost',
            port: 6379,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        };
    }
}

export const jerseyQueue = new Queue('jersey-booking', {
    connection: getBullMQConnection(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

export async function addBookingJob(
    userId: string,
    email: string,
    jerseyNumber: number,
    socketId: string
): Promise<void> {
    await jerseyQueue.add(
        'book-jersey',
        { userId, email, jerseyNumber, socketId },
        {
            jobId: `booking:${userId}:${jerseyNumber}`, // idempotency key
        }
    );
    console.log(`[Queue] Added booking job for user ${userId}, jersey ${jerseyNumber}`);
}
