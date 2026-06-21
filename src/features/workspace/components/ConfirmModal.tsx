import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    isClosing?: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDestructive?: boolean;
}

export function ConfirmModal({
    isOpen,
    isClosing = false,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    isDestructive = false
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div
                className={`fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm transition-all duration-200 ${isClosing ? 'modal-overlay-exit' : 'animate-slow-fade'}`}
                onClick={onCancel}
            />

            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
                <div className={`w-full max-w-[380px] rounded-3xl border border-white/10 bg-[#020617]/90 p-6 text-slate-100 shadow-2xl shadow-black/30 backdrop-blur-2xl light:border-slate-200/70 light:bg-white/95 light:text-slate-900 light:shadow-slate-300/30 ${isClosing ? 'modal-content-exit' : 'animate-zoom-in-fade'}`}>
                    <div className="flex items-start gap-4">
                        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isDestructive ? 'bg-red-500/10 text-red-400 light:bg-red-500/10 light:text-red-600' : 'bg-brand-500/10 text-brand-400 light:bg-brand-500/10 light:text-brand-600'}`}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>

                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                            <div className="mt-1.5 space-y-1 text-sm leading-relaxed text-slate-400 light:text-slate-600">
                                {message.split('\n').map((line, index) => (
                                    <p key={index} className={index === 1 ? 'font-semibold text-slate-200 light:text-slate-800' : ''}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2">
                        <button
                            onClick={onCancel}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-slate-200 light:text-slate-600 light:hover:bg-slate-950/5 light:hover:text-slate-900"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold text-white shadow-lg transition active:scale-[0.985] ${isDestructive
                                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20 hover:shadow-red-500/30'
                                : 'bg-gradient-to-r from-brand-500 to-orange-500 shadow-brand-500/20 hover:shadow-brand-500/30'
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
