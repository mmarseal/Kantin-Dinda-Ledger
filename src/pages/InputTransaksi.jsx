import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/useAuth";
import { formatLocalDate } from "../utils/dateUtils";
import { formatRupiah } from "../utils/formatCurrency";
import { AlertCircle, CheckCircle, Lightbulb, QrCode, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const KATEGORI = ["Bahan Baku", "Operasional", "Tagihan", "Lain-lain"];
const getDefaultForm = () => ({ type: "", amount: "", category: "", payment_method: "", note: "", transaction_date: formatLocalDate() });

export default function InputTransaksi() {
  const { business } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const transaction = location.state?.transaction ?? null;
  const [form, setForm] = useState(() => ({
    ...getDefaultForm(),
    ...(transaction ? { ...transaction, amount: String(transaction.amount), category: transaction.category || "", payment_method: transaction.payment_method || "", note: transaction.note || "" } : {}),
    type: transaction?.type || (["income", "expense"].includes(location.state?.type) ? location.state.type : ""),
  }));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const hasSelectedType = form.type === "income" || form.type === "expense";

  function chooseType(type) {
    setForm((prev) => ({ ...prev, type, category: "", payment_method: "" }));
    setStatus(null);
  }

  async function handleSubmit() {
    if (!["income", "expense"].includes(form.type)) return setStatus({ type: "error", msg: "Pilih jenis transaksi dulu." });
    if (!form.amount || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) return setStatus({ type: "error", msg: "Nominal harus lebih dari 0." });
    if (form.type === "expense" && !form.category) return setStatus({ type: "error", msg: "Pilih kategori pengeluaran." });
    const [year, month, day] = (form.transaction_date || "").split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.transaction_date || "") || parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() + 1 !== month || parsedDate.getUTCDate() !== day) return setStatus({ type: "error", msg: "Tanggal transaksi tidak valid." });
    if (form.type === "income" && !["cash", "qris"].includes(form.payment_method)) return setStatus({ type: "error", msg: "Pilih sumber pemasukan (Cash/QRIS)." });
    if (!business?.id) return setStatus({ type: "error", msg: "Data bisnis tidak ditemukan. Harap refresh atau login ulang." });

    setLoading(true);
    setStatus(null);
    const payload = { business_id: business.id, type: form.type, amount: Number(form.amount), category: form.type === "expense" ? form.category : null, payment_method: form.type === "income" ? form.payment_method : null, note: form.note || null, transaction_date: form.transaction_date };
    let result;
    try {
      result = transaction?.id
        ? await supabase.from("transactions").update(payload).eq("business_id", business.id).eq("id", transaction.id).select("id").maybeSingle()
        : await supabase.from("transactions").insert(payload);
    } catch {
      result = { error: new Error("Mutation failed"), data: null };
    }
    if (result.error || (transaction?.id && !result.data)) {
      setStatus({ type: "error", msg: result.error ? "Gagal menyimpan. Coba lagi." : "Transaksi tidak ditemukan atau sudah tidak dapat diubah." });
    } else if (transaction?.id) {
      navigate("/riwayat", { replace: true, state: { notice: "Transaksi berhasil diperbarui." } });
      setLoading(false);
      return;
    } else {
      setStatus({ type: "success", msg: "Transaksi berhasil disimpan!" });
      setForm(getDefaultForm());
    }
    setLoading(false);
  }

  const fieldClass = "min-h-12 w-full rounded-[var(--kf-radius-md)] border border-[var(--kf-border-strong)] bg-white px-4 text-base text-[var(--kf-text)] outline-none transition focus:border-[var(--kf-accent)]";
  const labelClass = "mb-1.5 block text-sm font-semibold text-[var(--kf-text)]";
  const typeButton = (type, label, Icon) => {
    const active = form.type === type;
    const income = type === "income";
    return <button type="button" aria-pressed={active} onClick={() => chooseType(type)} className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[var(--kf-radius-md)] border px-4 text-base font-semibold transition ${active ? income ? "border-[var(--kf-accent)] bg-[var(--kf-accent-soft)] text-[var(--kf-accent-hover)] ring-1 ring-[var(--kf-accent)]" : "border-rose-400 bg-rose-50 text-rose-700 ring-1 ring-rose-300" : "border-[var(--kf-border)] bg-white text-[var(--kf-text-muted)] hover:bg-[var(--kf-surface-soft)]"}`}><Icon size={19} aria-hidden="true" />{label}</button>;
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-8 md:gap-5">
      <header className="px-1">
        <p className="text-sm text-[var(--kf-text-muted)]">Catat pemasukan atau pengeluaran usaha Anda dengan mudah.</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--kf-text)] sm:text-3xl">{transaction ? "Edit Transaksi" : "Catat Transaksi"}</h1>
      </header>

      <section aria-label="Jenis transaksi" className="grid grid-cols-2 gap-2 rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white/80 p-2 shadow-sm sm:inline-grid sm:w-fit sm:min-w-80">
        {typeButton("income", "Pemasukan", TrendingUp)}{typeButton("expense", "Pengeluaran", TrendingDown)}
      </section>

      {hasSelectedType && <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)] lg:gap-5">
        <section className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-4 shadow-sm sm:p-6">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div><label className={labelClass} htmlFor="transaction-date">Tanggal</label><input id="transaction-date" type="date" name="transaction_date" value={form.transaction_date} onChange={(e) => setForm((prev) => ({ ...prev, transaction_date: e.target.value }))} className={fieldClass} /></div>
            {form.type === "expense" && <div><label className={labelClass} htmlFor="transaction-category">Kategori Pengeluaran</label><select id="transaction-category" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} className={fieldClass}><option value="">Pilih kategori</option>{KATEGORI.map((category) => <option key={category}>{category}</option>)}</select></div>}
            <div className="sm:col-span-2"><label className={labelClass} htmlFor="transaction-amount">Nominal</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[var(--kf-text-muted)]">Rp</span><input id="transaction-amount" type="number" name="amount" value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} min="1" inputMode="numeric" placeholder="0" className={`${fieldClass} min-h-14 pl-12 text-xl font-bold`} /></div><div className="mt-2 flex flex-wrap gap-2">{[10000, 25000, 50000, 100000].map((amount) => <button type="button" key={amount} onClick={() => setForm((prev) => ({ ...prev, amount: String(amount) }))} className="min-h-10 rounded-full border border-[var(--kf-border)] bg-[var(--kf-surface-soft)] px-3 text-sm font-semibold text-[var(--kf-text-muted)] hover:border-[var(--kf-accent)]">{amount / 1000}rb</button>)}</div>{form.amount && <p className="mt-1.5 text-sm font-semibold text-[var(--kf-accent-hover)]">{formatRupiah(Number(form.amount) || 0)}</p>}</div>
            {form.type === "income" && <fieldset className="w-full sm:col-span-2"><legend className={labelClass}>Sumber Pembayaran</legend><div className="grid w-full grid-cols-2 items-stretch gap-2">{[{ value: "cash", label: "Cash", Icon: Wallet }, { value: "qris", label: "QRIS", Icon: QrCode }].map(({ value, label, Icon }) => <button type="button" key={value} aria-pressed={form.payment_method === value} onClick={() => setForm((prev) => ({ ...prev, payment_method: value }))} className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--kf-radius-md)] border px-4 text-base font-semibold transition ${form.payment_method === value ? "border-[var(--kf-accent)] bg-[var(--kf-accent-soft)] text-[var(--kf-accent-hover)] ring-1 ring-[var(--kf-accent)]" : "border-[var(--kf-border)] bg-white text-[var(--kf-text-muted)] hover:bg-[var(--kf-surface-soft)]"}`}><Icon size={18} aria-hidden="true" />{label}</button>)}</div></fieldset>}
            <div className="sm:col-span-2"><label className={labelClass} htmlFor="transaction-note">Keterangan <span className="font-normal text-[var(--kf-text-subtle)]">(opsional)</span></label><textarea id="transaction-note" name="note" value={form.note} onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))} placeholder={form.type === "income" ? "Contoh: pendapatan penjualan siang" : "Contoh: beli bahan baku"} rows={3} className="w-full resize-y rounded-[var(--kf-radius-md)] border border-[var(--kf-border-strong)] px-4 py-3 text-base outline-none focus:border-[var(--kf-accent)]" /></div>
          </div>
          {status && <div role={status.type === "error" ? "alert" : "status"} className={`mt-4 flex items-center gap-3 rounded-xl border p-3 text-sm font-medium ${status.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>{status.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}{status.msg}</div>}
          <button type="button" onClick={handleSubmit} disabled={loading} className={`mt-5 min-h-12 w-full rounded-[var(--kf-radius-md)] px-4 text-base font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${form.type === "income" ? "bg-[var(--kf-accent)] hover:bg-[var(--kf-accent-hover)]" : "bg-rose-600 hover:bg-rose-700"}`}>{loading ? "Menyimpan..." : transaction ? "Simpan Perubahan" : `Simpan ${form.type === "income" ? "Pemasukan" : "Pengeluaran"}`}</button>
        </section>

        <aside className="hidden space-y-4 lg:block">
          <section className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white/90 p-5 shadow-sm"><h2 className="font-bold text-[var(--kf-text)]">{form.type === "expense" ? "Kategori Pengeluaran" : "Sumber Pemasukan"}</h2><p className="mt-1 text-sm text-[var(--kf-text-muted)]">{form.type === "expense" ? "Pilih kategori yang paling sesuai." : "Pilih metode pembayaran yang diterima."}</p><div className="mt-3 flex flex-wrap gap-2">{form.type === "expense" ? KATEGORI.map((category) => <span key={category} className="rounded-full bg-[var(--kf-surface-soft)] px-3 py-1.5 text-sm text-[var(--kf-text-muted)]">{category}</span>) : <><span className="rounded-full bg-[var(--kf-accent-soft)] px-3 py-1.5 text-sm text-[var(--kf-accent-hover)]">Cash</span><span className="rounded-full bg-[var(--kf-surface-soft)] px-3 py-1.5 text-sm text-[var(--kf-text-muted)]">QRIS</span></>}</div></section>
          <section className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white/80 p-5 shadow-sm"><div className="flex items-start gap-3"><Lightbulb size={19} className="mt-0.5 shrink-0 text-[var(--kf-accent)]" /><div><h2 className="font-bold text-[var(--kf-text)]">Tips pencatatan</h2><p className="mt-1 text-sm leading-relaxed text-[var(--kf-text-muted)]">Catat transaksi sesuai tanggal dan pilih keterangan singkat agar riwayat usaha mudah ditinjau.</p></div></div></section>
        </aside>
      </div>}
      {!hasSelectedType && <p className="rounded-[var(--kf-radius-lg)] border border-dashed border-[var(--kf-border-strong)] bg-white/70 p-5 text-center text-[var(--kf-text-muted)]">Pilih Pemasukan atau Pengeluaran untuk melanjutkan.</p>}
    </div>
  );
}
