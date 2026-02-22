'use client';

import { useState, useEffect } from 'react';
import { AuthUser } from '@/hooks/useAuth';
import Image from 'next/image';

interface BookingFormModalProps {
    jerseyNumber: number | null;
    user: AuthUser | null;
    onSuccess: (formData: {
        jerseyNumber: number;
        fullName: string;
        contactNumber: string;
        hoodieSize: string;
        nameToPrint: string;
        paymentMode: string;
        paymentScreenshot: string;
    }) => void;
    onCancel: () => void;
}

const HOODIE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
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
    const [showSizeChart, setShowSizeChart] = useState(false);
    const [showQR, setShowQR] = useState(false);

    // Auto-fill name if available
    useEffect(() => {
        if (user?.displayName && !fullName) {
            setFullName(user.displayName);
        }
    }, [user, fullName]);

    if (jerseyNumber === null) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !file || jerseyNumber === null) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Upload file to Cloudinary first
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/payment-screenshot`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) {
                const errorData = await uploadRes.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to upload payment screenshot');
            }

            const { url: cloudinaryUrl } = await uploadRes.json();

            // Pass all form data to parent component via onSuccess callback
            onSuccess({
                jerseyNumber,
                fullName: fullName.trim(),
                contactNumber: contactNumber.trim(),
                hoodieSize: hoodieSize.trim(),
                nameToPrint: nameToPrint.trim().toUpperCase(),
                paymentMode: paymentMode.trim(),
                paymentScreenshot: cloudinaryUrl,
            });
        } catch (err: any) {
            setError(err.message || 'Failed to submit booking');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-lg shadow-xl border border-[var(--card-border)] max-h-[90vh] overflow-y-auto animate-zoom-in">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                Confirm Allocation
                            </h2>
                            <p className="text-[var(--text-secondary)] text-sm">Please fill in your details to reserve jersey <span className="font-bold text-[var(--accent-primary)]">#{jerseyNumber}</span></p>
                        </div>
                        <button onClick={onCancel} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* Contact */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">WhatsApp Number</label>
                                <input
                                    required
                                    type="tel"
                                    value={contactNumber}
                                    onChange={(e) => setContactNumber(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            {/* Hoodie Size */}
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Hoodie Size</label>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {HOODIE_SIZES.map((size) => (
                                        <button
                                            key={size}
                                            type="button"
                                            onClick={() => setHoodieSize(size)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${hoodieSize === size
                                                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                                                : 'bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>

                                {/* Inline Size Chart */}
                                <div className="bg-white rounded-lg p-2 border border-[var(--border-color)] mt-2">
                                    <p className="text-xs text-center text-slate-500 mb-1">Standard Size Chart (Inches)</p>
                                    <div className="relative w-full h-48 sm:h-64 cursor-zoom-in" onClick={() => setShowSizeChart(true)}>
                                        <Image
                                            src="/sizechart.png"
                                            alt="Size Chart"
                                            fill
                                            className="object-contain"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                           <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">Click to Expand</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Name to Print */}
                            <div className="sm:col-span-2 space-y-1.5">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Name on Hoodie (Uppercase)</label>
                                <input
                                    required
                                    type="text"
                                    value={nameToPrint}
                                    onChange={(e) => setNameToPrint(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all font-mono"
                                    placeholder="PHOENIX"
                                />
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Payment Details</h3>
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="shrink-0 flex flex-col items-center">
                                    <button 
                                        type="button"
                                        onClick={() => setShowQR(true)}
                                        className="w-32 h-32 bg-white p-2 rounded-lg hover:ring-2 ring-[var(--accent-primary)] transition-all cursor-zoom-in relative group"
                                    >
                                        <Image
                                            src="/qr.jpeg"
                                            alt="QR Code"
                                            width={128}
                                            height={128}
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                            <span className="bg-black/70 text-white text-[10px] px-2 py-1 rounded">Click to Expand</span>
                                        </div>
                                    </button>
                                    <p className="text-center text-xs text-[var(--text-secondary)] mt-2">Scan to pay ₹700</p>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">Payment Method</label>
                                        <select
                                            required
                                            value={paymentMode}
                                            onChange={(e) => setPaymentMode(e.target.value)}
                                            className="w-full px-3 py-2 rounded-md bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                        >
                                            <option value="" disabled>Select Method</option>
                                            {PAYMENT_MODES.map((mode) => (
                                                <option key={mode} value={mode}>{mode}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">Upload Screenshot</label>
                                        <input
                                            required
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="block w-full text-sm text-[var(--text-secondary)]
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-[var(--accent-primary)] file:text-white
                                                hover:file:bg-blue-600
                                                cursor-pointer"
                                        />
                                        {file && <p className="text-xs text-green-500 mt-1">Successfully selected: {file.name}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !file}
                                className="flex-[2] px-4 py-2 rounded-md bg-[var(--accent-primary)] text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Processing...' : 'Confirm Reservation'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Size Chart Modal */}
            {showSizeChart && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowSizeChart(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 overflow-auto" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setShowSizeChart(false)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 z-10"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <Image
                            src="/sizechart.png"
                            alt="Size Chart"
                            width={800}
                            height={600}
                            className="w-full h-auto object-contain"
                        />
                    </div>
                </div>
            )}

            {/* QR Code Modal - Click anywhere to close */}
            {showQR && (
                <div 
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-zoom-out"
                    onClick={() => setShowQR(false)}
                >
                    <div className="relative bg-white p-4 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <Image
                            src="/qr.jpeg"
                            alt="Scan to Pay"
                            width={400}
                            height={400}
                            className="w-auto h-auto max-w-[80vw] max-h-[80vh] object-contain"
                        />
                        <p className="text-center text-sm font-medium mt-4 text-slate-900">Scan via any UPI App</p>
                    </div>
                </div>
            )}
        </div>
    );
}