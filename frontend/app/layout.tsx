import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
    title: 'Jersey Allocation – Real-Time Booking',
    description:
        'Book your unique jersey number in real-time. Fair, atomic, first-come-first-served.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className="antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
