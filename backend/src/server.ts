import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { initSocketIO } from './sockets/index';
import healthRouter from './routes/health.route';
import adminRouter from './routes/admin.route';
import uploadRouter from './routes/upload.route';

export function createApp(): {
    app: express.Application;
    httpServer: ReturnType<typeof createServer>;
    io: SocketIOServer;
} {
    const app = express();

    // Middleware
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        })
    );
    app.use(express.json());

    // Routes
    app.use('/api', healthRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/upload', uploadRouter);
    // Note: booking.route.ts is incomplete - reservations handled via WebSocket

    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Init Socket.IO
    const io = initSocketIO(httpServer);

    return { app, httpServer, io };
}
