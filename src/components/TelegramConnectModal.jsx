import React, { useEffect, useState, useCallback } from "react";
import {
    Bot,
    Copy,
    Check,
    Unplug,
    RefreshCw,
    Smartphone,
    X,
    ExternalLink,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export const TelegramConnectModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [linkCode, setLinkCode] = useState("");
    const [isLinked, setIsLinked] = useState(false);
    const [telegramUsername, setTelegramUsername] = useState("");
    const [copied, setCopied] = useState(false);
    const [unlinking, setUnlinking] = useState(false);
    const [error, setError] = useState("");

    const fetchStatus = useCallback(async () => {
        if (!supabase) return;
        setError("");
        try {
            const { data, error: rpcError } = await supabase.rpc("get_or_create_telegram_link_code");
            if (rpcError) throw rpcError;

            if (data) {
                setLinkCode(data.link_code);
                setIsLinked(data.is_linked);
                setTelegramUsername(data.telegram_username || "");
            }
        } catch (err) {
            console.error("Error fetching Telegram status:", err);
            setError(err.message || "Gagal mendapatkan status Telegram");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetchStatus();

            // Auto-poll every 3 seconds while modal is open and not linked
            const interval = setInterval(() => {
                if (!isLinked) {
                    fetchStatus();
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [isOpen, isLinked, fetchStatus]);

    if (!isOpen) return null;

    const handleCopy = () => {
        if (!linkCode) return;
        navigator.clipboard.writeText(linkCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUnlink = async () => {
        if (!window.confirm("Adakah anda pasti ingin memutuskan sambungan Telegram Bot?")) {
            return;
        }
        setUnlinking(true);
        setError("");
        try {
            const { error: rpcError } = await supabase.rpc("unlink_telegram_account");
            if (rpcError) throw rpcError;
            setIsLinked(false);
            setTelegramUsername("");
            await fetchStatus();
        } catch (err) {
            console.error("Error unlinking:", err);
            setError(err.message || "Gagal memutuskan sambungan");
        } finally {
            setUnlinking(false);
        }
    };

    return (
        <div className="board-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div
                className="board-modal board-modal--md"
                role="dialog"
                aria-modal="true"
                aria-labelledby="telegram-modal-title"
                tabIndex={-1}
            >
                {/* Header */}
                <div className="board-modal-header" style={{ background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)" }}>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div>
                            <h2 id="telegram-modal-title" className="board-modal-title" style={{ fontSize: "16px" }}>
                                Sambungkan Telegram Bot
                            </h2>
                            <p className="text-[12px] text-slate-500 m-0">Tambah & agihkan task terus dari Telegram</p>
                        </div>
                    </div>
                    <button type="button" className="board-icon-btn" onClick={onClose} aria-label="Close dialog">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="board-modal-body" style={{ padding: "20px 24px" }}>
                    {error && (
                        <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                            {error.includes("function") ? (
                                <>
                                    <strong>Perlu Setup SQL:</strong> Sila jalankan fail migrasi <code>docs/SUPABASE_TELEGRAM_MIGRATION.sql</code> dalam Supabase SQL Editor terlebih dahulu.
                                </>
                            ) : (
                                error
                            )}
                        </div>
                    )}

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <RefreshCw size={24} className="animate-spin text-blue-500" />
                            <span className="text-sm">Menghubungi Supabase...</span>
                        </div>
                    ) : isLinked ? (
                        /* Connected State */
                        <div className="flex flex-col items-center text-center py-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                                <Check size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">
                                Telegram Berjaya Disambungkan!
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mb-4">
                                Anda kini boleh menggunakan arahan <code>/add</code>, <code>/assign</code>, dan <code>/tasks</code> terus di Telegram.
                            </p>

                            <div className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2.5 text-left">
                                    <Smartphone size={16} className="text-slate-400" />
                                    <div>
                                        <div className="text-xs text-slate-400 font-medium">Akaun Telegram</div>
                                        <div className="text-sm font-semibold text-slate-800">
                                            {telegramUsername ? `@${telegramUsername}` : "Tersambung"}
                                        </div>
                                    </div>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Aktif
                                </span>
                            </div>

                            <button
                                type="button"
                                className="board-btn board-btn--ghost text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/60 w-full"
                                onClick={handleUnlink}
                                disabled={unlinking}
                            >
                                <Unplug size={14} />
                                {unlinking ? "Memutuskan sambungan..." : "Putuskan Sambungan Telegram"}
                            </button>
                        </div>
                    ) : (
                        /* Not Connected State */
                        <div className="flex flex-col gap-4">
                            {linkCode && (
                                <a
                                    href={`https://t.me/${process.env.REACT_APP_TELEGRAM_BOT_USERNAME || "Todoos_bot"}?start=${linkCode}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="board-btn w-full justify-center text-xs py-2.5 font-semibold shadow-xs flex items-center gap-2 rounded-xl transition-all"
                                    style={{ background: "#229ED9", borderColor: "#229ED9", color: "#ffffff" }}
                                >
                                    <Bot size={16} />
                                    <span>Buka @{process.env.REACT_APP_TELEGRAM_BOT_USERNAME || "Todoos_bot"} di Telegram</span>
                                    <ExternalLink size={14} className="opacity-80" />
                                </a>
                            )}

                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 border border-blue-100 flex flex-col items-center text-center">
                                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1.5">
                                    Atau Salin Kod Sambungan Peribadi Anda
                                </span>
                                <div className="flex items-center gap-2 my-2">
                                    <span className="text-2xl font-black font-mono tracking-widest text-slate-900 bg-white px-4 py-2 rounded-xl border border-blue-200/80 shadow-xs">
                                        {linkCode || "------"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all"
                                        title="Salin kod"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                                        <span>{copied ? "Disalin!" : "Salin"}</span>
                                    </button>
                                </div>
                                <span className="text-[11px] text-slate-500">
                                    Hantar kod ini kepada bot Telegram anda untuk menghubungkan akaun.
                                </span>
                            </div>

                            {/* Step by step guide */}
                            <div className="flex flex-col gap-2.5 text-xs text-slate-600">
                                <span className="font-semibold text-slate-800">Langkah-langkah:</span>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                                    <span>Buka bot anda di Telegram dan tekan <b>Start</b>.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                                    <span>
                                        Hantar arahan: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-blue-600">/start {linkCode}</code>
                                    </span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                                    <span>Tetingkap ini akan automatik mengesahkan sambungan anda.</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <RefreshCw size={12} className="animate-spin text-blue-500" />
                                    Menunggu mesej Telegram...
                                </span>
                                <button
                                    type="button"
                                    onClick={fetchStatus}
                                    className="text-blue-600 hover:underline font-medium"
                                >
                                    Semak Semula
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
