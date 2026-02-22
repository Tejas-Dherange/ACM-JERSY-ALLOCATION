'use client';

import { useEffect } from 'react';

interface ConfirmationModalProps {
    jerseyNumber: number | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmationModal({
    jerseyNumber,
    onConfirm,
    onCancel,
}: ConfirmationModalProps) {
    if (jerseyNumber === null) return null;

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
            onClick={onCancel}
        >
            <div
                className="glass-card p-8 w-full max-w-sm animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Jersey preview */}
                <div className="text-center mb-6">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 text-4xl font-black text-white"
                        style={{
                            background: 'linear-gradient(135deg, #4f72e8, #6366f1)',
                            boxShadow: '0 8px 30px rgba(79, 114, 232, 0.45)',
                        }}
                    >
                        {jerseyNumber.toString().padStart(2, '0')}
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Confirm Your Jersey</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        You're about to claim jersey{' '}
                        <span className="text-white font-semibold">#{jerseyNumber.toString().padStart(2, '0')}</span>.
                        <br />
                        <span className="text-amber-400 font-medium">This cannot be changed later.</span>
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-300 border border-slate-600 hover:border-slate-500 transition-all duration-200 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                        style={{
                            background: 'linear-gradient(135deg, #4f72e8, #6366f1)',
                            boxShadow: '0 4px 20px rgba(79, 114, 232, 0.4)',
                        }}
                    >
                        Claim #
                        {jerseyNumber.toString().padStart(2, '0')} 🎽
                    </button>
                </div>
            </div>
        </div>
    );
}
