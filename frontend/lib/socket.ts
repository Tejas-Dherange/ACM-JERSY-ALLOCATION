import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

let socketInstance: Socket | null = null;

export function getSocket(token: string): Socket {
    console.log('[socket.ts] getSocket called with token:', token ? 'TOKEN_EXISTS' : 'NO_TOKEN');
    console.log('[socket.ts] BACKEND_URL:', BACKEND_URL);
    
    if (socketInstance && socketInstance.connected) {
        console.log('[socket.ts] Reusing existing connected socket');
        return socketInstance;
    }

    // Disconnect stale socket if exists
    if (socketInstance) {
        console.log('[socket.ts] Disconnecting stale socket');
        socketInstance.disconnect();
    }

    console.log('[socket.ts] Creating new socket connection...');
    socketInstance = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    // Add connection debugging
    socketInstance.on('connect', () => {
        console.log('[socket.ts] Socket connected successfully!', socketInstance?.id);
    });

    socketInstance.on('connect_error', (error) => {
        console.error('[socket.ts] Socket connection error:', error.message);
    });

    socketInstance.on('disconnect', (reason) => {
        console.log('[socket.ts] Socket disconnected:', reason);
    });

    return socketInstance;
}

export function disconnectSocket(): void {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
}
