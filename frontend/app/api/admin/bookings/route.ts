import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const ADMIN_EMAIL = 'tejasdherange0099@gmail.com';

export async function GET() {
    const session = await auth();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.email !== ADMIN_EMAIL) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
        const apiKey = process.env.BACKEND_API_KEY;

        const res = await fetch(`${backendUrl}/api/admin/bookings`, {
            headers: { 'x-api-key': apiKey || '' },
            cache: 'no-store',
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('[Admin proxy] Backend error:', res.status, text);
            return NextResponse.json({ error: `Backend error: ${res.status}` }, { status: 500 });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[Admin proxy] Fetch failed:', err.message);
        return NextResponse.json({ error: 'Failed to fetch from backend' }, { status: 500 });
    }
}
