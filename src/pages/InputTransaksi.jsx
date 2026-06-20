import { useState } from "react";
import { supabase, getUserId } from "../lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Wallet,
  QrCode,
} from "lucide-react";

const KATEGORI = ["Bahan Baku", "Operasional", "Tagihan", "Lain-lain"];

const defaultForm = {
  type: "",
  amount: "",
  category: "",
  payment_method: "",
  note: "",
  transaction_date: new Date().toISOString().split("T")[0],
};

export default function InputTransaksi() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error'

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function pilihTipe(type) {
    setForm((prev) => ({ ...prev, type, category: "", payment_method: "" }));
    setStatus(null);
  }

  async function handleSubmit() {
    // Validasi
    if (!form.type)
      return setStatus({ type: "error", msg: "Pilih jenis transaksi dulu." });
    if (!form.amount || Number(form.amount) <= 0)
      return setStatus({ type: "error", msg: "Nominal harus lebih dari 0." });
    if (form.type === "expense" && !form.category)
      return setStatus({ type: "error", msg: "Pilih kategori pengeluaran." });
    if (form.type === "income" && !form.payment_method)
      return setStatus({
        type: "error",
        msg: "Pilih sumber pemasukan (Cash/QRIS).",
      });

    setLoading(true);
    setStatus(null);

    const userId = await getUserId();

    const payload = {
      user_id: userId,
      type: form.type,
      amount: Number(form.amount),
      category: form.type === "expense" ? form.category : null,
      payment_method: form.type === "income" ? form.payment_method : null,
      note: form.note || null,
      transaction_date: form.transaction_date,
    };

    const { error } = await supabase.from("transactions").insert(payload);

    if (error) {
      setStatus({ type: "error", msg: "Gagal menyimpan. Coba lagi." });
    } else {
      setStatus({ type: "success", msg: "Transaksi berhasil disimpan! ✓" });
      setForm(defaultForm);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 md:hidden">
        <h1 className="text-white text-2xl font-bold">Catat Transaksi</h1>
        <p className="text-green-100 text-sm mt-1">
          Pilih jenis dan isi nominal
        </p>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-4 pb-8">
        {/* Pilih Tipe */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Jenis Transaksi
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => pilihTipe("income")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.type === "income"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-full ${form.type === "income" ? "bg-green-100" : "bg-gray-200"}`}
              >
                <TrendingUp
                  size={24}
                  className={
                    form.type === "income" ? "text-green-600" : "text-gray-400"
                  }
                />
              </div>
              <span
                className={`font-semibold text-sm ${form.type === "income" ? "text-green-600" : "text-gray-500"}`}
              >
                Pemasukan
              </span>
            </button>

            <button
              onClick={() => pilihTipe("expense")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                form.type === "expense"
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div
                className={`p-2 rounded-full ${form.type === "expense" ? "bg-red-100" : "bg-gray-200"}`}
              >
                <TrendingDown
                  size={24}
                  className={
                    form.type === "expense" ? "text-red-500" : "text-gray-400"
                  }
                />
              </div>
              <span
                className={`font-semibold text-sm ${form.type === "expense" ? "text-red-500" : "text-gray-500"}`}
              >
                Pengeluaran
              </span>
            </button>
          </div>
        </div>

        {/* Kategori — hanya muncul kalau expense */}
        {form.type === "expense" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Kategori Pengeluaran
            </p>
            <div className="grid grid-cols-2 gap-2">
              {KATEGORI.map((kat) => (
                <button
                  key={kat}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, category: kat }))
                  }
                  className={`py-3 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.category === kat
                      ? "border-red-400 bg-red-50 text-red-600"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sumber Pemasukan*/}
        {form.type === "income" && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Sumber Pemasukan
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setForm((prev) => ({ ...prev, payment_method: "cash" }))
                }
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.payment_method === "cash"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${form.payment_method === "cash" ? "bg-green-100" : "bg-gray-200"}`}
                >
                  <Wallet
                    size={22}
                    className={
                      form.payment_method === "cash"
                        ? "text-green-600"
                        : "text-gray-400"
                    }
                  />
                </div>
                <span
                  className={`font-semibold text-sm ${form.payment_method === "cash" ? "text-green-600" : "text-gray-500"}`}
                >
                  Cash
                </span>
              </button>

              <button
                onClick={() =>
                  setForm((prev) => ({ ...prev, payment_method: "qris" }))
                }
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.payment_method === "qris"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${form.payment_method === "qris" ? "bg-blue-100" : "bg-gray-200"}`}
                >
                  <QrCode
                    size={22}
                    className={
                      form.payment_method === "qris"
                        ? "text-blue-600"
                        : "text-gray-400"
                    }
                  />
                </div>
                <span
                  className={`font-semibold text-sm ${form.payment_method === "qris" ? "text-blue-600" : "text-gray-500"}`}
                >
                  QRIS
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Form Input */}
        {form.type && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
            {/* Nominal */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Nominal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
            </div>

            {/* Tanggal */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Tanggal
              </label>
              <input
                type="date"
                name="transaction_date"
                value={form.transaction_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Catatan{" "}
                <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder={
                  form.type === "income"
                    ? "Contoh: pendapatan penjualan siang"
                    : "Contoh: beli ayam dan tempe"
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400 transition-colors resize-none text-sm"
              />
            </div>
          </div>
        )}

        {/* Status message */}
        {status && (
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${
              status.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="text-sm font-medium">{status.msg}</span>
          </div>
        )}

        {/* Tombol Simpan */}
        {form.type && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : form.type === "income"
                  ? "bg-green-600 active:bg-green-700 shadow-lg shadow-green-200"
                  : "bg-red-500 active:bg-red-600 shadow-lg shadow-red-200"
            }`}
          >
            {loading
              ? "Menyimpan..."
              : `Simpan ${form.type === "income" ? "Pemasukan" : "Pengeluaran"}`}
          </button>
        )}
      </div>
    </div>
  );
}
