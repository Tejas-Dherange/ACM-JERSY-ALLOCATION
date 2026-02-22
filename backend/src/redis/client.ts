import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});

redis.on('connect', () => {
    console.log('[Redis] Connected successfully');
});

redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
});

export default redis;
