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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Jersey preview */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4 bg-[var(--accent-primary)] text-white text-2xl font-bold">
                        {jerseyNumber.toString().padStart(2, '0')}
                    </div>

                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Confirm Selection</h2>
                    <p className="text-[var(--text-secondary)] text-sm">
                        Reserving jersey <span className="font-semibold text-[var(--accent-primary)]">#{jerseyNumber}</span>.
                        <br />
                        This action cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-[var(--accent-primary)] hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
