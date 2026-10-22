import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/useAuth";
import { formatRupiah, formatTanggal } from "../utils/formatCurrency";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  FileDown,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIODS = [
  { label: "Hari Ini", value: "today" },
  { label: "7 Hari Terakhir", value: "7days" },
  { label: "Bulan Ini", value: "month" },
];

function jakartaParts(date = new Date()) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );
}

function dateString({ year, month, day }) {
  return `${year}-${month}-${day}`;
}

function shiftDate(date, days) {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

function shortDay(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)))
    .replace(".", "");
}

function greeting(hour) {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function paymentLabel(method) {
  if (method === "cash") return "Tunai";
  if (method === "qris") return "QRIS";
  return method || "";
}

function formatRecentDate(transaction) {
  const date = new Date(`${transaction.transaction_date}T12:00:00+07:00`);
  const dateLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  if (!transaction.created_at) return dateLabel;
  const timeLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(transaction.created_at));
  return `${dateLabel} · ${timeLabel} WIB`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { business, user } = useAuth();
  const businessId = business?.id ?? null;
  const businessName = business?.name || "KasFlow";
  const userName = user?.user_metadata?.nama || user?.email?.split("@")[0] || "";
  const [period, setPeriod] = useState("today");
  const [refreshToken, setRefreshToken] = useState(0);
  const [result, setResult] = useState({ key: null, transactions: [], recentTransactions: [], periodError: null, recentError: null });
  const now = new Date();
  const todayDate = dateString(jakartaParts(now));
  const currentHour = Number(jakartaParts(now).hour);
  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const monthStart = `${todayDate.slice(0, 7)}-01`;
  const weekStart = shiftDate(todayDate, -6);
  const queryStartDate = weekStart < monthStart ? weekStart : monthStart;
  const key = JSON.stringify([businessId, refreshToken]);

  useEffect(() => {
    if (!businessId) return undefined;
    let active = true;

    async function loadTransactions() {
      try {
        const [periodResult, recentResult] = await Promise.all([
          supabase
          .from("transactions")
          .select("id, type, amount, transaction_date, payment_method, category, note, created_at")
          .eq("business_id", businessId)
          .gte("transaction_date", queryStartDate)
          .lte("transaction_date", todayDate)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false }),
          supabase
            .from("transactions")
            .select("id, type, amount, transaction_date, payment_method, category, note, created_at")
            .eq("business_id", businessId)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (!active) return;
        setResult({
          key,
          transactions: periodResult.error ? [] : periodResult.data || [],
          recentTransactions: recentResult.error ? [] : recentResult.data || [],
          periodError: periodResult.error?.message ?? null,
          recentError: recentResult.error?.message ?? null,
        });
      } catch (error) {
        if (active) setResult({
          key,
          transactions: [],
          recentTransactions: [],
          periodError: error.message || "Gagal memuat transaksi.",
          recentError: error.message || "Gagal memuat transaksi.",
        });
      }
    }

    loadTransactions();
    return () => { active = false; };
  }, [businessId, key, queryStartDate, todayDate]);

  const current = businessId && result.key === key ? result : null;
  const transactions = current?.transactions ?? [];
  const loading = Boolean(businessId) && !current;
  const periodError = current?.periodError ?? null;
  const recentError = current?.recentError ?? null;
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => shiftDate(todayDate, index - 6)), [todayDate]);
  const summaryRange = period === "today"
    ? [todayDate, todayDate]
    : period === "7days"
      ? [shiftDate(todayDate, -6), todayDate]
      : [monthStart, todayDate];
  const summaryTransactions = transactions.filter((tx) => tx.transaction_date >= summaryRange[0] && tx.transaction_date <= summaryRange[1]);
  const income = summaryTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expense = summaryTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const net = income - expense;
  const chartData = days.map((date) => {
    const dayTransactions = transactions.filter((tx) => tx.transaction_date === date);
    return {
      date,
      hari: shortDay(date),
      Pemasukan: dayTransactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      Pengeluaran: dayTransactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
    };
  });
  const recentTransactions = current?.recentTransactions ?? [];
  const refresh = () => setRefreshToken((token) => token + 1);
  const openInput = (type) => navigate("/catat", { state: { type, from: location.pathname } });

  const summaryCards = [
    { label: "Pemasukan", amount: income, icon: TrendingUp, color: "text-emerald-700", surface: "bg-emerald-50", iconTone: "text-emerald-700" },
    { label: "Pengeluaran", amount: expense, icon: TrendingDown, color: "text-rose-700", surface: "bg-rose-50", iconTone: "text-rose-700" },
    { label: "Selisih Bersih", amount: net, icon: Banknote, color: "text-teal-800", surface: "bg-teal-50", iconTone: "text-teal-800" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 pb-4 md:gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium capitalize text-[var(--kf-text-muted)]">{todayLabel}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--kf-text)] sm:text-3xl">
            {greeting(currentHour)}{userName ? `, ${userName}` : ""} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 max-w-2xl truncate text-base text-[var(--kf-text-muted)]">Ringkasan keuangan {businessName}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button type="button" onClick={() => navigate("/export")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--kf-radius-md)] border border-[var(--kf-border)] bg-white px-3 text-sm font-semibold text-[var(--kf-text)] shadow-sm transition hover:bg-[var(--kf-surface-soft)] sm:px-4">
            <FileDown size={18} aria-hidden="true" /> Export Laporan
          </button>
          <button type="button" onClick={() => openInput("income")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--kf-radius-md)] bg-[var(--kf-accent)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--kf-accent-hover)] sm:px-4">
            <Plus size={18} aria-hidden="true" /> Catat Transaksi
          </button>
        </div>
      </header>

      <section aria-label="Ringkasan keuangan" className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--kf-text)]">Ringkasan keuangan</h2>
            <p className="text-sm text-[var(--kf-text-muted)]">Pilih periode untuk melihat pergerakan transaksi.</p>
          </div>
          <div role="group" aria-label="Periode ringkasan" className="grid grid-cols-3 rounded-[var(--kf-radius-md)] border border-[var(--kf-border)] bg-white p-1 shadow-sm">
            {PERIODS.map(({ label, value }) => (
              <button key={value} type="button" aria-pressed={period === value} onClick={() => setPeriod(value)} className={`min-h-11 rounded-[var(--kf-radius-sm)] px-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${period === value ? "bg-[var(--kf-accent-soft)] text-[var(--kf-accent-hover)] shadow-sm" : "text-[var(--kf-text-muted)] hover:bg-[var(--kf-surface-soft)]"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summaryCards.map(({ label, amount, icon: Icon, color, surface, iconTone }) => (
            <article key={label} className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-3.5 shadow-sm sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--kf-text-muted)]">{label}</p>
                  {loading ? <div className="mt-2 h-8 w-36 animate-pulse rounded-lg bg-[var(--kf-surface-soft)]" /> : <p className={`mt-1 break-all text-2xl font-bold tracking-tight ${color}`}>{formatRupiah(amount)}</p>}
                </div>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--kf-radius-md)] ${surface}`}><Icon size={23} className={iconTone} aria-hidden="true" /></span>
              </div>
              <p className="mt-2 text-xs text-[var(--kf-text-subtle)]">{PERIODS.find(({ value }) => value === period)?.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]">
        <article className="min-w-0 rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--kf-text)]">Arus Kas</h2>
              <p className="text-sm text-[var(--kf-text-muted)]">Pemasukan dan pengeluaran · 7 hari terakhir</p>
            </div>
            <button type="button" onClick={refresh} aria-label="Muat ulang transaksi" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--kf-radius-sm)] text-[var(--kf-text-muted)] transition hover:bg-[var(--kf-surface-soft)] hover:text-[var(--kf-text)]"><RefreshCw size={18} aria-hidden="true" /></button>
          </div>
          {loading ? <div className="h-56 animate-pulse rounded-xl bg-[var(--kf-surface-soft)]" /> : periodError ? (
            <p role="alert" className="flex min-h-32 items-center justify-center rounded-[var(--kf-radius-md)] bg-rose-50 px-5 text-center text-sm text-rose-700">Gagal memuat arus kas. Coba muat ulang.</p>
          ) : transactions.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-[var(--kf-radius-md)] bg-[var(--kf-surface-soft)] px-5 py-4 text-center">
              <CalendarDays size={25} className="text-[var(--kf-text-subtle)]" aria-hidden="true" />
              <p className="mt-2 font-semibold text-[var(--kf-text)]">Belum ada transaksi</p>
              <p className="mt-1 text-sm text-[var(--kf-text-muted)]">Arus kas tujuh hari akan muncul setelah transaksi dicatat.</p>
            </div>
          ) : (
            <div className="h-52 w-full" role="img" aria-label="Grafik pemasukan dan pengeluaran tujuh hari terakhir">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={3} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#edf1ef" />
                  <XAxis dataKey="hari" tick={{ fontSize: 12, fill: "#77837f" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#77837f" }} axisLine={false} tickLine={false} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(0)}jt` : value >= 1000 ? `${(value / 1000).toFixed(0)}rb` : value} width={45} />
                  <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.date ? formatTanggal(payload[0].payload.date) : ""} formatter={(value, name) => [formatRupiah(value), name]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e9e6", fontSize: 13, boxShadow: "0 8px 24px rgb(25 47 40 / 8%)" }} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} />
                  <Bar dataKey="Pemasukan" fill="#0f8b70" radius={[5, 5, 0, 0]} maxBarSize={26} />
                  <Bar dataKey="Pengeluaran" fill="#d26464" radius={[5, 5, 0, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="min-w-0 rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--kf-text)]">Transaksi Terbaru</h2>
              <p className="text-sm text-[var(--kf-text-muted)]">5 catatan terakhir</p>
            </div>
            <button type="button" onClick={() => navigate("/riwayat")} className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[var(--kf-accent-hover)] hover:bg-[var(--kf-accent-soft)]">Lihat semua <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
          {loading ? <div className="space-y-3 py-2">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-[var(--kf-surface-soft)]" />)}</div> : recentError ? (
            <p role="alert" className="flex min-h-32 items-center justify-center rounded-[var(--kf-radius-md)] bg-rose-50 px-5 text-center text-sm text-rose-700">Gagal memuat transaksi terbaru. Coba muat ulang.</p>
          ) : recentTransactions.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center rounded-[var(--kf-radius-md)] bg-[var(--kf-surface-soft)] px-5 py-4 text-center">
              <Banknote size={25} className="text-[var(--kf-text-subtle)]" aria-hidden="true" />
              <p className="mt-2 font-semibold text-[var(--kf-text)]">Belum ada catatan</p>
              <p className="mt-1 text-sm text-[var(--kf-text-muted)]">Transaksi terbaru akan tampil di sini.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--kf-border)]">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                const title = isIncome ? "Pemasukan" : tx.category || "Pengeluaran";
                const details = [tx.note, formatRecentDate(tx), paymentLabel(tx.payment_method)].filter(Boolean).join(" · ");
                return (
                  <li key={tx.id} className="flex min-w-0 items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isIncome ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                      {isIncome ? <ArrowDownLeft size={19} aria-hidden="true" /> : <ArrowUpRight size={19} aria-hidden="true" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--kf-text)]">{title}</p>
                      <p className="truncate text-xs text-[var(--kf-text-muted)]">{details}</p>
                    </div>
                    <p className={`shrink-0 text-sm font-bold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>{isIncome ? "+" : "−"}{formatRupiah(Number(tx.amount || 0))}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </section>

      <section aria-label="Aksi cepat" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => openInput("income")} className="flex min-h-14 items-center justify-between rounded-[var(--kf-radius-lg)] border border-emerald-200 bg-white px-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50 sm:px-5">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><TrendingUp size={20} aria-hidden="true" /></span><span><span className="block font-semibold text-[var(--kf-text)]">+ Catat Pemasukan</span><span className="block text-xs text-[var(--kf-text-muted)]">Tambahkan pemasukan usaha</span></span></span><ArrowRight size={18} className="text-emerald-700" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => openInput("expense")} className="flex min-h-14 items-center justify-between rounded-[var(--kf-radius-lg)] border border-rose-200 bg-white px-4 text-left shadow-sm transition hover:border-rose-300 hover:bg-rose-50/50 sm:px-5">
          <span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-700"><TrendingDown size={20} aria-hidden="true" /></span><span><span className="block font-semibold text-[var(--kf-text)]">− Catat Pengeluaran</span><span className="block text-xs text-[var(--kf-text-muted)]">Tambahkan pengeluaran usaha</span></span></span><ArrowRight size={18} className="text-rose-700" aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
