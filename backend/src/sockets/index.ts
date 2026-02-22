import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { validateToken } from '../utils/auth';
import { socketRateLimitMiddleware } from '../utils/rateLimit';
import { registerJerseySocket } from './jersey.socket';

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    });

    // ── Rate Limiting Middleware ────────────────────────────────────────────────
    // Limit connection attempts: max 5 connections per 10 seconds per IP
    io.use(
        socketRateLimitMiddleware({
            maxRequests: 5,
            windowSeconds: 10,
            message: 'Too many connection attempts. Please wait.',
        })
    );

    // ── Auth Middleware ──────────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
            console.error('[Socket.IO] Connection rejected: No token provided');
            return next(new Error('Unauthorized: No token provided'));
        }

        try {
            const user = await validateToken(token);
            (socket as any).userId = user.userId;
            (socket as any).email = user.email;
            console.log(`[Socket.IO] Auth successful for user: ${user.userId}`);
            next();
        } catch (err: any) {
            console.error(`[Socket.IO] Auth failed: ${err.message}`);
            next(new Error(`Unauthorized: ${err.message}`));
        }
    });

    // ── Connection Handler ───────────────────────────────────────────────────────
    io.on('connection', (socket) => {
        registerJerseySocket(io, socket);
    });

    console.log('[Socket.IO] Initialized with auth middleware');
    return io;
}
