import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../utils/auth';

const router = Router();

/**
 * POST /api/user/sync
 * Creates/updates user record in database
 * Called after Neon Auth login/signup
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    try {
        console.log(`[API] Syncing user to database: ${user.userId}`);
        
        const dbUser = await prisma.user.upsert({
            where: { id: user.userId },
            update: { 
                email: user.email 
            },
            create: { 
                id: user.userId,
                email: user.email 
            },
        });

        console.log(`[API] User synced successfully:`, dbUser);

        res.json({ 
            success: true, 
            user: dbUser 
        });
    } catch (error: any) {
        console.error('[API] User sync failed:', error);
        res.status(500).json({ 
            error: 'Failed to sync user',
            message: error.message 
        });
    }
});

/**
 * GET /api/user/me
 * Get current user info from database
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    const { userId } = (req as any).user;
    
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        res.json(user);
    } catch (error: any) {
        console.error('[API] Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

export default router;
