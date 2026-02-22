import { Socket } from 'socket.io';
import { redis } from '../redis/client';

interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
    message?: string;
}

/**
 * Simple rate limiter using Redis
 * Tracks requests per user per time window
 */
export async function checkRateLimit(
    userId: string,
    action: string,
    config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${action}:${userId}`;
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
        // Remove old entries outside the time window
        await redis.zremrangebyscore(key, '-inf', windowStart);

        // Count requests in current window
        const requestCount = await redis.zcard(key);

        if (requestCount >= config.maxRequests) {
            return { allowed: false, remaining: 0 };
        }

        // Add current request
        await redis.zadd(key, now, `${now}`);

        // Set expiry on the key
        await redis.expire(key, config.windowSeconds);

        return {
            allowed: true,
            remaining: config.maxRequests - requestCount - 1,
        };
    } catch (error) {
        console.error('[RateLimit] Error checking rate limit:', error);
        // Fail open - allow request if Redis is down
        return { allowed: true, remaining: config.maxRequests };
    }
}

/**
 * Socket.IO middleware for rate limiting
 * Limits connection attempts per IP
 */
export function socketRateLimitMiddleware(config: RateLimitConfig) {
    return async (socket: Socket, next: (err?: Error) => void) => {
        const ip = socket.handshake.address;
        const key = `ratelimit:connection:${ip}`;

        try {
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.expire(key, config.windowSeconds);
            }

            if (count > config.maxRequests) {
                return next(
                    new Error(
                        config.message ||
                            `Rate limit exceeded. Max ${config.maxRequests} connections per ${config.windowSeconds}s`
                    )
                );
            }

            next();
        } catch (error) {
            console.error('[RateLimit] Middleware error:', error);
            // Fail open
            next();
        }
    };
}
