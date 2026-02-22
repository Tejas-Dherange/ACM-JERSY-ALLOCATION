'use client';

import { JerseyState } from '@/hooks/useSocket';

interface JerseyCardProps {
    jerseyNumber: number;
    state: JerseyState;
    isMine: boolean;
    disabled: boolean;
    ownerName?: string;
    onReserve: (jerseyNumber: number) => void;
}

const STATE_ICONS: Record<JerseyState, string> = {
    available: '',
    locked: '🔒',
    taken: '✓',
};

export default function JerseyCard({
    jerseyNumber,
    state,
    isMine,
    disabled,
    ownerName,
    onReserve,
}: JerseyCardProps) {
    const isClickable = state === 'available' && !disabled;

    const getClassName = () => {
        if (isMine) return 'jersey-mine z-10 scale-105 shadow-lg shadow-[var(--accent-primary)]/20';
        switch (state) {
            case 'locked':
                return 'jersey-locked';
            case 'taken':
                return 'jersey-taken';
            default:
                return 'jersey-available hover:text-[var(--accent-primary)] hover:scale-110 hover:-translate-y-1 hover:shadow-lg hover:shadow-[var(--accent-primary)]/20 active:scale-95 z-0 hover:z-10 bg-[var(--card-bg)]';
        }
    };

    return (
        <button
            className={`group relative aspect-square rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${getClassName()}`}
            onClick={() => isClickable && onReserve(jerseyNumber)}
            disabled={!isClickable}
            title={
                isMine
                    ? `Your jersey: #${jerseyNumber}`
                    : state === 'locked'
                        ? 'Temporarily locked'
                        : state === 'taken'
                            ? ownerName ? `Taken by ${ownerName}` : 'Already taken'
                            : `Click to reserve #${jerseyNumber}`
            }
            aria-label={`Jersey ${jerseyNumber} - ${isMine ? 'yours' : state}`}
        >
            {/* Jersey number */}
            <span className="text-sm sm:text-base font-bold tabular-nums leading-none transition-colors">
                {jerseyNumber.toString().padStart(2, '0')}
            </span>

            {/* Owner name for taken jerseys */}
            {state === 'taken' && ownerName && !isMine && (
                <span className="text-[9px] mt-1 leading-tight opacity-70 truncate w-full text-center px-1 font-medium z-10">
                    {ownerName}
                </span>
            )}

            {/* State icon */}
            {state !== 'available' && !ownerName && (
                <span className="text-[10px] mt-1 leading-none opacity-70">
                    {isMine ? '★' : STATE_ICONS[state]}
                </span>
            )}
        </button>
    );
}
