'use client';

import { JerseyState } from '@/hooks/useSocket';

interface JerseyCardProps {
    jerseyNumber: number;
    state: JerseyState;
    isMine: boolean;
    disabled: boolean;
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
    onReserve,
}: JerseyCardProps) {
    const isClickable = state === 'available' && !disabled;

    const getClassName = () => {
        if (isMine) return 'jersey-mine';
        switch (state) {
            case 'locked':
                return 'jersey-locked';
            case 'taken':
                return 'jersey-taken';
            default:
                return 'jersey-available';
        }
    };

    const getNumberColor = () => {
        if (isMine) return 'text-blue-300';
        switch (state) {
            case 'locked':
                return 'text-amber-400';
            case 'taken':
                return 'text-red-400';
            default:
                return 'text-slate-300 group-hover:text-emerald-300';
        }
    };

    return (
        <button
            className={`group relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-200 ${getClassName()}`}
            onClick={() => isClickable && onReserve(jerseyNumber)}
            disabled={!isClickable}
            title={
                isMine
                    ? `Your jersey: #${jerseyNumber}`
                    : state === 'locked'
                        ? 'Temporarily locked'
                        : state === 'taken'
                            ? 'Already taken'
                            : `Click to reserve #${jerseyNumber}`
            }
            aria-label={`Jersey ${jerseyNumber} - ${isMine ? 'yours' : state}`}
        >
            {/* Jersey number */}
            <span className={`text-xs font-bold tabular-nums leading-none transition-colors ${getNumberColor()}`}>
                {jerseyNumber.toString().padStart(2, '0')}
            </span>

            {/* State icon */}
            {state !== 'available' && (
                <span className="text-[8px] mt-0.5 leading-none">
                    {isMine ? '★' : STATE_ICONS[state]}
                </span>
            )}

            {/* Mine indicator ring */}
            {isMine && (
                <div className="absolute inset-0 rounded-lg border-2 border-blue-400 opacity-60 animate-ping" />
            )}
        </button>
    );
}
