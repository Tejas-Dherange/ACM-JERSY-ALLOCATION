'use client';

import { AuthUser } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';

interface HeaderProps {
    user: AuthUser | null;
    myJersey: number | null;
    isConnected: boolean;
}

export default function Header({ user, myJersey, isConnected }: HeaderProps) {
    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: '/auth/signin' });
        } catch (error) {
            console.error('[Header] Sign out error:', error);
        }
    };

    console.log('[Header] Rendering with user:', user ? user.id : 'NO USER');

    return (
        <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold animate-pulse-slow">
                        FP
                    </div>
                    <div>
                        <h1 className="text-[var(--text-primary)] font-bold text-lg leading-tight">
                            FairPick
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <span className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)] font-medium">
                                {isConnected ? 'Online' : 'Connecting'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side: user info */}
                {user ? (
                    <div className="flex items-center gap-6">
                        {myJersey !== null && (
                            <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-md bg-[var(--card-bg)] border border-[var(--card-border)]">
                                <span className="text-[var(--text-secondary)] text-xs font-medium uppercase">Allocated</span>
                                <div className="w-px h-3 bg-[var(--border-color)]"></div>
                                <span className="text-[var(--accent-primary)] font-bold">#{myJersey}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-color)]">
                            <div className="hidden sm:flex flex-col items-end">
                                <p className="text-[var(--text-primary)] text-sm font-medium">
                                    {user.displayName ?? user.email.split('@')[0]}
                                </p>
                                <p className="text-[var(--text-secondary)] text-xs">{user.email}</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                                {(user.displayName ?? user.email)[0].toUpperCase()}
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                        <div className="w-2 h-2 rounded-full bg-[var(--text-secondary)]"></div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Unidentified</span>
                    </div>
                )}
            </div>
        </header>
    );
}
