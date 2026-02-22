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
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--text-secondary)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <div className="text-[var(--text-secondary)] text-sm font-medium">Loading system...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] animate-fade-in">
            <Header
                user={authUser}
                myJersey={myJersey}
                isConnected={isConnected}
            />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Error banner */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3 animate-slide-in-right">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Success banner */}
                {myJersey !== null && (
                    <div className="mb-8 p-6 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm animate-slide-up">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-[var(--text-primary)] font-semibold text-lg">
                                    Jersey Allocated
                                </h3>
                                <p className="text-[var(--text-secondary)]">
                                    Your designated number is <span className="font-bold text-[var(--accent-primary)]">#{myJersey}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}


                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">FairPick Allocation</h2>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">Select your preferred jersey number below.</p>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-[var(--card-bg)] border border-[var(--border-color)] p-2 rounded-lg">
                        {[
                            { cls: 'jersey-available h-3 w-3', label: 'Available' },
                            { cls: 'jersey-locked h-3 w-3', label: 'Locked' },
                            { cls: 'jersey-taken h-3 w-3', label: 'Taken' },
                            { cls: 'bg-[var(--accent-primary)] border border-[var(--accent-primary)] h-3 w-3 rounded-full', label: 'Yours' },
                        ].map(({ cls, label }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className={`rounded-sm ${cls}`} />
                                <span className="text-[var(--text-secondary)] font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <JerseyGrid
                        jerseyStates={jerseyStates}
                        myJersey={myJersey}
                        currentUserId={authUser?.id ?? null}
                        onReserve={(num) => { if (myJersey === null) setPendingJersey(num); }}
                    />
                </div>

                {/* Stats */}
                <div className="mt-8 grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    {[
                        { label: 'Available', color: 'text-green-500', state: 'available' },
                        { label: 'Locked', color: 'text-yellow-500', state: 'locked' },
                        { label: 'Taken', color: 'text-slate-500', state: 'taken' },
                    ].map(({ label, color, state }) => (
                        <div key={label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-4 text-center shadow-sm hover:scale-[1.02] transition-transform duration-200">
                            <div className={`text-2xl font-bold ${color}`}>
                                {Object.values(jerseyStates).filter((v) => v.state === state).length}
                            </div>
                            <div className="text-[var(--text-secondary)] text-sm mt-1">{label}</div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Booking Form Modal */}
            {pendingJersey !== null && authUser && (
                <BookingFormModal
                    jerseyNumber={pendingJersey}
                    user={authUser}
                    onSuccess={(formData) => {
                        reserveJersey(formData);
                        setPendingJersey(null);
                    }}
                    onCancel={() => setPendingJersey(null)}
                />
            )}
        </div>
    );
}
