'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ConnectionDebug() {
    const [debugInfo, setDebugInfo] = useState<any>({});
    const { data: session, status } = useSession();

    useEffect(() => {
        const checkConnection = async () => {
            const info: any = {
                status,
                hasSession: !!session,
                hasUser: !!session?.user,
                userId: (session?.user as any)?.id || 'NULL',
                email: session?.user?.email || 'NULL',
                name: session?.user?.name || 'NULL',
                hasToken: !!(session?.user as any)?.id,
                tokenLocation: 'user.id',
            };

            // Check backend connectivity
            try {
                const response = await fetch('http://localhost:4000/api/health');
                info.backendReachable = response.ok;
                info.backendStatus = response.status;
            } catch (error) {
                info.backendReachable = false;
                info.backendError = String(error);
            }

            setDebugInfo(info);
        };

        checkConnection();
    }, [session, status]);

    return (
        <div className="fixed bottom-4 right-4 bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-md shadow-xl z-50">
            <h3 className="text-white font-bold mb-2">🔍 Connection Debug</h3>
            <div className="text-xs space-y-1 font-mono">
                <div className={debugInfo.status === 'loading' ? 'text-yellow-400' : 'text-green-400'}>
                    Status: {debugInfo.status || 'UNKNOWN'}
                </div>
                <div className={debugInfo.hasSession ? 'text-green-400' : 'text-red-400'}>
                    Session: {debugInfo.hasSession ? '✓ EXISTS' : '✗ MISSING'}
                </div>
                <div className={debugInfo.hasUser ? 'text-green-400' : 'text-red-400'}>
                    User: {debugInfo.hasUser ? '✓ EXISTS' : '✗ MISSING'}
                </div>
                {debugInfo.userId !== 'NULL' && (
                    <div className="text-blue-400">
                        User ID: {debugInfo.userId}
                    </div>
                )}
                {debugInfo.email !== 'NULL' && (
                    <div className="text-blue-400">
                        Email: {debugInfo.email}
                    </div>
                )}
                <div className={debugInfo.hasToken ? 'text-green-400' : 'text-red-400'}>
                    Token: {debugInfo.hasToken ? '✓ EXISTS' : '✗ MISSING'}
                </div>
                <div className={debugInfo.backendReachable ? 'text-green-400' : 'text-red-400'}>
                    Backend: {debugInfo.backendReachable ? '✓ REACHABLE' : '✗ UNREACHABLE'}
                </div>
            </div>
        </div>
    );
}
