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
        <header className="sticky top-0 z-50 border-b border-subtle backdrop-blur-xl"
            style={{ background: 'rgba(10, 14, 26, 0.85)' }}>
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl"
                        style={{ background: 'linear-gradient(135deg, #4f72e8, #818cf8)' }}>
                        <span className="text-lg">👕</span>
                    </div>
                    <div>
                        <span className="text-white font-bold text-lg leading-none">
                            Jersey<span className="text-gradient">Alloc</span>
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`}
                                style={isConnected ? { boxShadow: '0 0 6px rgba(34, 197, 94, 0.8)' } : {}}
                            />
                            <span className="text-xs text-slate-500">
                                {isConnected ? 'Live' : 'Connecting…'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side: user info */}
                {user ? (
                    <div className="flex items-center gap-4">
                        {myJersey !== null && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-500/30"
                                style={{ background: 'rgba(79, 114, 232, 0.12)' }}>
                                <span className="text-blue-400 text-xs font-medium">My Jersey</span>
                                <span className="text-white font-bold text-sm">#{myJersey}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, #4f72e8, #818cf8)' }}>
                                {(user.displayName ?? user.email)[0].toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-white text-sm font-medium leading-none">
                                    {user.displayName ?? user.email.split('@')[0]}
                                </p>
                                <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm">Not logged in</div>
                )}
            </div>
        </header>
    );
}
