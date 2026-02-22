'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import JerseyGrid from '@/components/JerseyGrid';
import BookingFormModal from '@/components/BookingFormModal';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
    const { user: authUser, getAccessToken, isLoading } = useAuth();
    const [token, setToken] = useState<string | null>(null);
    const [pendingJersey, setPendingJersey] = useState<number | null>(null);

    // Get session token for WebSocket connection
    useEffect(() => {
        console.log('[DashboardPage] Auth user changed:', authUser?.id);
        if (authUser) {
            getAccessToken().then((t) => {
                console.log('[DashboardPage] Got access token:', t ? 'TOKEN_EXISTS' : 'NULL');
                setToken(t);
            });
        } else {
            console.log('[DashboardPage] No auth user, clearing token');
            setToken(null);
        }
    }, [authUser, getAccessToken]);

    const { jerseyStates, myJersey, isConnected, error, reserveJersey } =
        useSocket(token, authUser?.id ?? null);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-slate-400 animate-pulse">Loading…</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Header
                user={authUser}
                myJersey={myJersey}
                isConnected={isConnected}
            />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Error banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-500/40 bg-red-900/20 text-red-300 text-sm font-medium animate-slide-up flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Success banner */}
                {myJersey !== null && (
                    <div className="mb-6 p-4 rounded-xl border border-blue-500/40 animate-slide-up"
                        style={{ background: 'linear-gradient(135deg, rgba(79,114,232,0.15), rgba(79,114,232,0.05))' }}>
                        <div className="flex items-center gap-3">
                            <div className="text-3xl">🎉</div>
                            <div>
                                <p className="text-white font-bold text-lg">
                                    Your jersey number is{' '}
                                    <span className="text-gradient text-2xl">#{myJersey}</span>
                                </p>
                                <p className="text-slate-400 text-sm">Successfully reserved and confirmed!</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Info bar */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Select Your Jersey</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            100 jerseys available · First-come, first-served · Each member gets one
                        </p>
                    </div>
                    {/* Legend */}
                    <div className="hidden md:flex items-center gap-4 text-xs">
                        {[
                            { cls: 'bg-slate-700 border border-emerald-400/50', label: 'Available' },
                            { cls: 'bg-amber-900/50 border border-amber-500/60', label: 'Locked' },
                            { cls: 'bg-red-900/50 border border-red-500/60', label: 'Taken' },
                            { cls: 'border-2 border-blue-500', label: 'Mine', style: { background: 'rgba(79,114,232,0.3)' } },
                        ].map(({ cls, label, style }) => (
                            <div key={label} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded ${cls}`} style={style} />
                                <span className="text-slate-400">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <JerseyGrid
                    jerseyStates={jerseyStates}
                    myJersey={myJersey}
                    currentUserId={authUser?.id ?? null}
                    onReserve={(num) => { if (myJersey === null) setPendingJersey(num); }}
                />

                {/* Stats */}
                <div className="mt-8 grid grid-cols-3 gap-4">
                    {[
                        { label: 'Available', color: 'text-emerald-400', state: 'available' },
                        { label: 'Locked', color: 'text-amber-400', state: 'locked' },
                        { label: 'Taken', color: 'text-red-400', state: 'taken' },
                    ].map(({ label, color, state }) => (
                        <div key={label} className="glass-card p-4 text-center">
                            <div className={`text-2xl font-bold ${color}`}>
                                {Object.values(jerseyStates).filter((v) => v.state === state).length}
                            </div>
                            <div className="text-slate-400 text-sm mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Booking Form Modal */}
            <BookingFormModal
                jerseyNumber={pendingJersey}
                user={authUser}
                onSuccess={(formData) => {
                    reserveJersey(formData);
                    setPendingJersey(null);
                }}
                onCancel={() => setPendingJersey(null)}
            />
        </div>
    );
}
