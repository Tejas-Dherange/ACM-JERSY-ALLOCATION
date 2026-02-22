'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/hooks/useAuth';
import Image from 'next/image';

interface BookingFormModalProps {
    jerseyNumber: number | null;
    user: AuthUser | null;
    onSuccess: (jerseyNumber: number) => void;
    onCancel: () => void;
}

const HOODIE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PAYMENT_MODES = ['Google Pay', 'Phone Pe', 'Bhim UPI', 'Paytm', 'Other'];

export default function BookingFormModal({
    jerseyNumber,
    user,
    onSuccess,
    onCancel,
}: BookingFormModalProps) {
    const [fullName, setFullName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [hoodieSize, setHoodieSize] = useState('');
    const [nameToPrint, setNameToPrint] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-fill name if available
    useEffect(() => {
        if (user?.displayName && !fullName) {
            setFullName(user.displayName);
        }
    }, [user, fullName]);

    if (jerseyNumber === null) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !file) return;

        setIsSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('jerseyNumber', jerseyNumber.toString());
        formData.append('fullName', fullName);
        formData.append('contactNumber', contactNumber);
        formData.append('hoodieSize', hoodieSize);
        formData.append('nameToPrint', nameToPrint.toUpperCase());
        formData.append('paymentMode', paymentMode);
        formData.append('paymentScreenshot', file);

        try {
            const res = await fetch('/api/backend/booking/submit', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit booking');
            }

            onSuccess(jerseyNumber);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
            <div className="glass-card w-full max-w-2xl my-auto p-5 sm:p-8 animate-scale-up border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 relative z-10">
                    <div className="text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Jersey Allocation
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Reserve your customized hoodie</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
                            <span className="text-xl font-black text-white italic">#{jerseyNumber.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Your Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Contact */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">WhatsApp Number</label>
                            <input
                                required
                                type="tel"
                                placeholder="+91 ..."
                                value={contactNumber}
                                onChange={(e) => setContactNumber(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Hoodie Size */}
                        <div className="sm:col-span-2 space-y-3">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Select Hoodie Size</label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {HOODIE_SIZES.map((size) => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setHoodieSize(size)}
                                        className={`py-3 rounded-xl text-sm font-bold transition-all border ${hoodieSize === size
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                                            }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name to Print */}
                        <div className="sm:col-span-2 space-y-2">
                            <label className="flex justify-between items-end ml-1">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name on Hoodie</span>
                                <span className="text-[10px] text-blue-400 font-mono tracking-tighter">UPPERCASE ENFORCED</span>
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="E.G. PHOENIX"
                                value={nameToPrint}
                                onChange={(e) => setNameToPrint(e.target.value.toUpperCase())}
                                className="w-full px-4 py-4 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-mono text-lg tracking-widest placeholder:text-slate-700 placeholder:italic"
                            />
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                            <div className="w-full lg:w-1/2 space-y-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-3">
                                        <span>💳</span> SECURE PAYMENT
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight">Pay Rs: 700/-</h3>
                                    <p className="text-slate-400 text-xs mt-1">Scan the QR and attach name in note.</p>
                                </div>

                                <div className="relative group mx-auto lg:mx-0 w-full max-w-[240px] aspect-square bg-white p-3 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                                    <Image
                                        className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-500"
                                        src="/qr.jpeg"
                                        alt="Payment QR Code"
                                        width={240}
                                        height={240}
                                        priority
                                    />
                                    <div className="absolute inset-0 border-4 border-slate-950/20 rounded-2xl pointer-events-none" />
                                </div>
                            </div>

                            <div className="w-full lg:w-1/2 flex flex-col gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Payment Method</label>
                                    <select
                                        required
                                        value={paymentMode}
                                        onChange={(e) => setPaymentMode(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none text-sm appearance-none cursor-pointer focus:border-blue-500/50"
                                    >
                                        <option value="" disabled>Select Method</option>
                                        {PAYMENT_MODES.map((mode) => (
                                            <option key={mode} value={mode}>{mode}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Upload Receipt</label>
                                    <input
                                        required
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="screenshot-upload"
                                    />
                                    <label
                                        htmlFor="screenshot-upload"
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${file
                                            ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                                            : 'border-white/5 bg-slate-900/50 hover:border-blue-500/30 hover:bg-slate-800/80 shadow-inner'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-transform ${file ? 'bg-emerald-500/20 scale-110' : 'bg-white/5'}`}>
                                            <span className="text-xl">{file ? '✅' : '📸'}</span>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-300 px-4 text-center truncate w-full">
                                            {file ? file.name : 'Upload Screenshot'}
                                        </span>
                                        {!file && <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter">JPG, PNG or PDF (MAX 10MB)</span>}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-shake">
                            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-500 text-xs font-bold">!</span>
                            <p className="text-red-400 text-xs font-medium">{error}</p>
                        </div>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:flex-1 px-6 py-4 rounded-xl font-bold text-slate-400 border border-white/5 bg-white/5 hover:bg-white/10 transition-all hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !file}
                            className="w-full sm:flex-[2] px-6 py-4 rounded-xl font-black text-white shadow-2xl transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group overflow-hidden relative"
                            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
                        >
                            <span className="relative z-10">{isSubmitting ? 'Processing...' : 'CONFIRM RESERVATION'}</span>
                            {!isSubmitting && <span className="relative z-10 transition-transform group-hover:translate-x-1">🚀</span>}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
