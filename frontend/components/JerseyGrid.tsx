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
        <div className="glass-card p-6">
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}
            >
                {jerseyNumbers.map((num) => {
                    const info = jerseyStates[num.toString()];
                    const state = info?.state ?? 'available';
                    const isMine = num === myJersey;

                    return (
                        <JerseyCard
                            key={num}
                            jerseyNumber={num}
                            state={state}
                            isMine={isMine}
                            disabled={myJersey !== null}
                            ownerName={info?.ownerName}
                            onReserve={onReserve}
                        />
                    );
                })}
            </div>
        </div>
    );
}
