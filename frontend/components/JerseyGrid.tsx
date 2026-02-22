'use client';

import { JerseyStateMap } from '@/hooks/useSocket';
import JerseyCard from './JerseyCard';

interface JerseyGridProps {
    jerseyStates: JerseyStateMap;
    myJersey: number | null;
    currentUserId: string | null;
    onReserve: (jerseyNumber: number) => void;
}

export default function JerseyGrid({
    jerseyStates,
    myJersey,
    currentUserId,
    onReserve,
}: JerseyGridProps) {
    const jerseyNumbers = Array.from({ length: 100 }, (_, i) => i);

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 shadow-sm">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-3 place-items-stretch">
                {jerseyNumbers.map((num) => {
                    const info = jerseyStates[num.toString()];
                    const state = info?.state ?? 'available';
                    const ownerName = info?.ownerName;
                    
                    const isMine = num === myJersey;
                    
                    const isDisabled = (state !== 'available' && !isMine) || (myJersey !== null && !isMine);

                    return (
                        <JerseyCard
                            key={num}
                            jerseyNumber={num}
                            state={state}
                            isMine={isMine}
                            disabled={isDisabled}
                            ownerName={ownerName}
                            onReserve={onReserve}
                        />
                    );
                })}
            </div>
        </div>
    );
}
