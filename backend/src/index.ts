import 'dotenv/config';
import { createApp } from './server';
import { redis } from './redis/client';
import { startWorker } from './workers/jersey.worker';
import { setIOInstance } from './workers/jersey.worker';
import { disconnectPrisma } from './lib/prisma';
import { jerseyQueue } from './queue/jersey.queue';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function bootstrap(): Promise<void> {
    // Verify Redis connection
    await redis.ping();
    console.log('[Bootstrap] Redis connected');

    // Create Express + Socket.IO app
    const { httpServer, io } = createApp();

    // Pass IO instance to worker for real-time notifications
    setIOInstance(io);

    // Start BullMQ worker
    const worker = startWorker();

    // Start HTTP server
    httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`[Bootstrap] Server listening on port ${PORT}`);
        console.log(`[Bootstrap] Health: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log('[Bootstrap] Shutting down gracefully...');
        
        try {
            // 1. Stop accepting new connections
            console.log('[Bootstrap] Closing HTTP server...');
            await new Promise<void>((resolve) => {
                httpServer.close(() => resolve());
            });
            
            // 2. Close all WebSocket connections
            console.log('[Bootstrap] Closing Socket.IO connections...');
            io.close();
            
            // 3. Close BullMQ worker and drain queue
            console.log('[Bootstrap] Closing worker and draining queue...');
            await worker.close();
            await jerseyQueue.close();
            
            // 4. Disconnect Prisma (closes DB connection pool)
            console.log('[Bootstrap] Disconnecting Prisma...');
            await disconnectPrisma();
            
            // 5. Close Redis connection
            console.log('[Bootstrap] Closing Redis...');
            await redis.quit();
            
            console.log('[Bootstrap] Shutdown complete');
            process.exit(0);
        } catch (error) {
            console.error('[Bootstrap] Error during shutdown:', error);
            process.exit(1);
        }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
    console.error('[Bootstrap] Fatal error:', err);
    process.exit(1);
});
