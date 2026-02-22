'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

export type JerseyState = 'available' | 'locked' | 'taken';

export interface JerseyStateMap {
    [number: string]: {
        state: JerseyState;
        userId?: string;
        ownerName?: string;
    };
}

interface UseSocketReturn {
    jerseyStates: JerseyStateMap;
    myJersey: number | null;
    isConnected: boolean;
    error: string | null;
    reserveJersey: (formData: {
        jerseyNumber: number;
        fullName: string;
        contactNumber: string;
        hoodieSize: string;
        nameToPrint: string;
        paymentMode: string;
        paymentScreenshot: string;
    }) => void;
}

export function useSocket(
    token: string | null,
    userId: string | null
): UseSocketReturn {
    const [jerseyStates, setJerseyStates] = useState<JerseyStateMap>({});
    const [myJersey, setMyJersey] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        console.log('[useSocket] Effect triggered - token:', token ? 'EXISTS' : 'NULL', 'userId:', userId || 'NULL');
        
        if (!token || !userId) {
            console.log('[useSocket] Waiting for token and userId', { hasToken: !!token, hasUserId: !!userId });
            return;
        }

        console.log('[useSocket] Initializing socket connection for user:', userId);
        const socket = getSocket(token);
        socketRef.current = socket;

        // ── Connection events ──────────────────────────────────────────────────
        socket.on('connect', () => {
            setIsConnected(true);
            setError(null);
            console.log('[Socket] Connected:', socket.id);
        });

        socket.on('disconnect', (reason) => {
            setIsConnected(false);
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (err) => {
            setIsConnected(false);
            setError(`Connection error: ${err.message}`);
            console.error('[Socket] Connect error:', err.message);
        });

        // ── State events ───────────────────────────────────────────────────────
        socket.on('state:init', (state: JerseyStateMap) => {
            console.log('[useSocket] Received state:init with', Object.keys(state).length, 'jerseys');
            setJerseyStates(state);
            // Check if current user already has a jersey
            const myEntry = Object.entries(state).find(
                ([_, v]) => v.userId === userId && v.state === 'taken'
            );
            if (myEntry) {
                console.log('[useSocket] User already has jersey:', myEntry[0]);
                setMyJersey(parseInt(myEntry[0], 10));
            }
        });

        socket.on(
            'state:update',
            (update: { jerseyNumber: number; state: JerseyState; userId?: string; ownerName?: string }) => {
                setJerseyStates((prev) => ({
                    ...prev,
                    [update.jerseyNumber.toString()]: {
                        state: update.state,
                        userId: update.userId,
                        ownerName: update.ownerName,
                    },
                }));
            }
        );

        // ── Jersey events ──────────────────────────────────────────────────────
        socket.on('jersey:success', (data: { jerseyNumber: number; message: string }) => {
            setMyJersey(data.jerseyNumber);
        });

        socket.on('jersey:failed', (data: { jerseyNumber: number; reason: string }) => {
            setError(data.reason);
            // Clear error after 4 seconds
            setTimeout(() => setError(null), 4000);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('state:init');
            socket.off('state:update');
            socket.off('jersey:success');
            socket.off('jersey:failed');
            disconnectSocket();
        };
    }, [token, userId]);

    const reserveJersey = useCallback((formData: {
        jerseyNumber: number;
        fullName: string;
        contactNumber: string;
        hoodieSize: string;
        nameToPrint: string;
        paymentMode: string;
        paymentScreenshot: string;
    }) => {
        if (socketRef.current?.connected) {
            console.log(`[useSocket] Attempting to reserve jersey ${formData.jerseyNumber} with form data`);
            socketRef.current.emit('jersey:reserve', formData);
        } else {
            console.error('[useSocket] Cannot reserve: socket not connected');
        }
    }, []);

    return { jerseyStates, myJersey, isConnected, error, reserveJersey };
}
