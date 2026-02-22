import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../redis/client';
import { isEmailAllowed } from './emailWhitelist';

export interface AuthUser {
    userId: string;
    email: string;
}

/**
 * Validates a user ID token (which is the user's ID from NextAuth session)
 * by looking up the user in the database with Redis caching
 */
export async function validateToken(token: string): Promise<AuthUser> {
    try {
        // Token is the user ID from NextAuth session
        const userId = token;
        const cacheKey = `user:auth:${userId}`;

        // Try to get from cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Auth] Cache hit for user: ${userId}`);
            const authUser = JSON.parse(cached);
            
            // Recheck whitelist even for cached users (in case CSV updated)
            if (!isEmailAllowed(authUser.email)) {
                console.error(`[Auth] Cached user email not in whitelist: ${authUser.email}`);
                throw new Error('Unauthorized: email not in whitelist');
            }
            
            return authUser;
        }

        // Cache miss - query database
        console.log(`[Auth] Cache miss for user: ${userId}, querying database`);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true },
        });

        if (!user || !user.email) {
            console.error('[Auth] User not found or missing email:', userId);
            throw new Error('Unauthorized: user not found');
        }

        // Check if email is in whitelist
        if (!isEmailAllowed(user.email)) {
            console.error(`[Auth] User email not in whitelist: ${user.email}`);
            throw new Error('Unauthorized: email not in whitelist');
        }

        const authUser: AuthUser = { userId: user.id, email: user.email };

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(authUser));

        console.log(`[Auth] Token validated and cached for user: ${userId}`);
        return authUser;
    } catch (err: any) {
        console.error('[Auth] Token validation error:', err.message);
        throw err;
    }
}

/**
 * Express middleware for protected REST routes
 */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized: Missing token' });
        return;
    }

    const token = authHeader.slice(7);
    try {
        const user = await validateToken(token);
        (req as any).user = user;
        next();
    } catch (err: any) {
        res.status(401).json({ error: err.message });
    }
}
