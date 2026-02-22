'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

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
        (b: any) =>
            b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            b.name?.toLowerCase().includes(search.toLowerCase()) ||
            b.email?.toLowerCase().includes(search.toLowerCase()) ||
            b.jerseyNumber?.toString().includes(search)
    );

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        
    const exportToExcel = () => {
        const dataToExport = filtered.map((b: any) => ({
            'Jersey Number': b.jerseyNumber,
            'Full Name': b.fullName || b.name,
            'Email': b.email,
            'Contact Number': b.contactNumber || 'N/A',
            'Print Name': b.nameToPrint,
            'Hoodie Size': b.hoodieSize,
            'Payment Mode': b.paymentMode,
            'Payment Screenshot': b.paymentScreenshot,
            'Booked At': formatTime(b.bookedAt),
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Jersey Bookings');

        // Auto-size columns
        const cols = [
            { wch: 12 }, // Jersey Number
            { wch: 20 }, // Full Name
            { wch: 30 }, // Email
            { wch: 15 }, // Contact Number
            { wch: 15 }, // Print Name
            { wch: 12 }, // Hoodie Size
            { wch: 15 }, // Payment Mode
            { wch: 50 }, // Payment Screenshot
            { wch: 20 }, // Booked At
        ];
        ws['!cols'] = cols;

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        const filename = `jersey-bookings-${date}.xlsx`;

        XLSX.writeFile(wb, filename);
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] animate-fade-in">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--text-secondary)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <div className="text-[var(--text-secondary)] text-sm font-medium animate-pulse">Loading data...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] animate-fade-in">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-slide-up">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-red-400 font-medium">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] animate-fade-in">
            <div className="px-4 py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 animate-slide-up">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            Admin Dashboard
                        </h1>
                        <p className="text-[var(--text-secondary)] text-sm mt-1">
                            {total} total allocations
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportToExcel}
                            disabled={filtered.length === 0}
                            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Excel
                        </button>
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="px-4 py-2 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-sm font-medium transition-colors"
                        >
                            Back to Grid
                        </button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                        { label: 'Allocated', value: total, color: 'text-blue-500' },
                        { label: 'Available', value: 100 - total, color: 'text-green-500' },
                        { label: 'Capacity', value: 100, color: 'text-[var(--text-secondary)]' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 shadow-sm">
                            <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
                            <div className="text-[var(--text-secondary)] text-xs font-medium uppercase tracking-wider">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-2 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent text-sm transition-all"
                    />
                </div>

                {/* Table */}
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
                    {filtered.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-[var(--text-secondary)]">
                            <p className="font-medium">No records found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                    <tr>
                                        {['ID', 'Name', 'Print Name', 'Size', 'Payment', 'Timestamp'].map((h) => (
                                            <th key={h} className="px-6 py-3 font-medium border-b border-[var(--border-color)]">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-color)]">
                                    {filtered.map((b: any) => (
                                        <tr
                                            key={b.jerseyNumber}
                                            className="hover:bg-[var(--bg-secondary)] transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold">
                                                    #{b.jerseyNumber.toString().padStart(2, '0')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[var(--text-primary)] font-medium text-sm">{b.fullName || b.name}</div>
                                                <div className="text-[var(--text-secondary)] text-xs mt-0.5 flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    {b.email}
                                                </div>
                                                {b.contactNumber && (
                                                    <div className="text-[var(--text-secondary)] text-xs mt-0.5 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        {b.contactNumber}
                                                    </div>
                                                )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black tracking-widest uppercase text-sm shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                {b.nameToPrint}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-black text-lg shadow-inner">
                                                {b.hoodieSize}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <a
                                                href={b.paymentScreenshot}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors text-xs font-bold uppercase tracking-wider"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                View Proof
                                            </a>
                                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1.5 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                {b.paymentMode}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-slate-300 font-medium text-sm">
                                                {formatTime(b.bookedAt).split(',')[0]}
                                            </div>
                                            <div className="text-slate-500 text-xs font-mono mt-0.5">
                                                {formatTime(b.bookedAt).split(',')[1]}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
}
