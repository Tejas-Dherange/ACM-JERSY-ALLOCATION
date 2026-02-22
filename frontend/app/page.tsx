'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status !== 'loading') {
            if (session?.user) {
                router.push('/dashboard');
            } else {
                router.push('/auth/signin');
            }
        }
    }, [session, status, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-slate-400 animate-pulse">Loading...</div>
        </div>
    );
}
