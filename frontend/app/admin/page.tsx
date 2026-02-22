'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'tejasdherange0099@gmail.com';

interface Booking {
    jerseyNumber: number;
    name: string;
    email: string;
    bookedAt: string;
}

export default function AdminPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/auth/signin');
        }
        if (!isLoading && user && user.email !== ADMIN_EMAIL) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;
        fetch('/api/admin/bookings')
            .then(async (r) => {
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    throw new Error(d.error || `HTTP ${r.status}`);
                }
                return r.json();
            })
            .then((data) => {
                setBookings(data.bookings ?? []);
                setTotal(data.total ?? 0);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = bookings.filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.email.toLowerCase().includes(search.toLowerCase()) ||
            b.jerseyNumber.toString().includes(search)
    );

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-slate-400 animate-pulse text-lg">Loading admin data…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 py-10 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        Admin <span className="text-gradient">Dashboard</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {total} jersey{total !== 1 ? 's' : ''} booked
                    </p>
                </div>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white transition-all"
                >
                    ← Back
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Booked', value: total, color: 'text-blue-400' },
                    { label: 'Remaining', value: 100 - total, color: 'text-emerald-400' },
                    { label: 'Total Jerseys', value: 100, color: 'text-slate-300' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card p-5 text-center">
                        <div className={`text-3xl font-bold ${color}`}>{value}</div>
                        <div className="text-slate-400 text-sm mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by name, email or jersey number…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors text-sm"
                />
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        {bookings.length === 0 ? 'No jerseys booked yet.' : 'No results match your search.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700/60">
                                    {['Jersey #', 'Name', 'Print Name', 'Size', 'Payment', 'Booked At'].map((h) => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filtered.map((b: any) => (
                                    <tr
                                        key={b.jerseyNumber}
                                        className="hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="px-5 py-3.5">
                                            <span
                                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold text-white"
                                                style={{
                                                    background: 'linear-gradient(135deg, #4f72e8, #6366f1)',
                                                }}
                                            >
                                                {b.jerseyNumber.toString().padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="text-white font-medium">{b.fullName || b.name}</div>
                                            <div className="text-slate-500 text-[10px]">{b.email}</div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded">
                                                {b.nameToPrint}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-300 font-bold">
                                            {b.hoodieSize}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <a
                                                href={b.paymentScreenshot}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] text-indigo-400 hover:text-white underline underline-offset-2 flex items-center gap-1"
                                            >
                                                <span>🖼️</span> View Proof
                                            </a>
                                            <div className="text-[9px] text-slate-500 mt-0.5">{b.paymentMode}</div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-400">
                                            {formatTime(b.bookedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
