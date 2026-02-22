import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

/**
 * Issues a short-lived HMAC-signed token for WebSocket authentication.
 * The backend shares AUTH_SECRET and validates this token.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name ?? '',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    const payloadB64 = Buffer.from(payload).toString('base64url');
    const sig = createHmac('sha256', process.env.AUTH_SECRET!)
        .update(payloadB64)
        .digest('hex');

    return NextResponse.json({ token: `${payloadB64}.${sig}` });
}
