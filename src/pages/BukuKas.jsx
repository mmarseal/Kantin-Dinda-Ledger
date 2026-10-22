import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/useAuth";
import { formatRupiah } from "../utils/formatCurrency";
import { parseLocalDate } from "../utils/dateUtils";
import { useTransactions } from "../hooks/useTransactions";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  AlertCircle,
  Wallet,
  QrCode,
} from "lucide-react";

const FILTER = [
  { label: "Hari Ini", value: "today" },
  { label: "Minggu Ini", value: "week" },
  { label: "Bulan Ini", value: "month" },
];

function groupByDate(transactions) {
  return transactions.reduce((groups, tx) => {
    const date = tx.transaction_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {});
}

function formatTanggalGrup(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BukuKas() {
  const { business } = useAuth();
  const [filter, setFilter] = useState("today");
  const [deleteSelection, setDeleteSelection] = useState({ businessId: null, id: null });
  const [deleteError, setDeleteError] = useState("");
  const { transactions, loading, summary, error, refetch } = useTransactions(filter);
  const deleteId = business?.id && deleteSelection.businessId === business.id ? deleteSelection.id : null;

  async function handleDelete(id) {
    if (!business?.id) return;
    setDeleteError("");
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("business_id", business.id);
      if (error) {
        setDeleteError("Gagal menghapus transaksi. Coba lagi.");
        return;
      }
    } catch {
      setDeleteError("Gagal menghapus transaksi. Coba lagi.");
      return;
    }
    refetch();
    setDeleteSelection({ businessId: business.id, id: null });
  }

  const grouped = groupByDate(transactions);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 md:hidden">
        <h1 className="text-white text-2xl font-bold">Buku Kas</h1>
        <p className="text-green-100 text-sm mt-1">Riwayat transaksi</p>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-3 pb-8">
        {/* Filter Tab */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
          {FILTER.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.value
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ringkasan */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pemasukan</p>
              <p className="text-green-600 font-bold text-sm">
                {formatRupiah(summary.totalIncome)}
              </p>
            </div>
            <div className="border-x border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Pengeluaran</p>
              <p className="text-red-500 font-bold text-sm">
                {formatRupiah(summary.totalExpense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Laba Bersih</p>
              <p
                className={`font-bold text-sm ${summary.laba >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {formatRupiah(summary.laba)}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Cash vs QRIS */}
        {(() => {
          const cashTotal = transactions
            .filter((t) => t.type === "income" && t.payment_method === "cash")
            .reduce((s, t) => s + Number(t.amount), 0);
          const qrisTotal = transactions
            .filter((t) => t.type === "income" && t.payment_method === "qris")
            .reduce((s, t) => s + Number(t.amount), 0);

          if (cashTotal === 0 && qrisTotal === 0) return null;

          return (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Sumber Pemasukan
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Wallet size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cash</p>
                    <p className="text-sm font-bold text-green-600">
                      {formatRupiah(cashTotal)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <QrCode size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">QRIS</p>
                    <p className="text-sm font-bold text-blue-600">
                      {formatRupiah(qrisTotal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* List Transaksi */}
        {deleteError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            {deleteError}
          </div>
        )}
        {error && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
            Gagal memuat transaksi. Coba ubah filter atau muat ulang halaman.
          </div>
        )}
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3 mb-2" />
                <div className="h-6 bg-gray-100 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-400 font-medium">Belum ada transaksi</p>
            <p className="text-gray-400 text-sm mt-1">
              Mulai catat dari tab Catat
            </p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                {formatTanggalGrup(date)}
              </p>
              <div className="flex flex-col gap-2">
                {grouped[date].map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-3"
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${tx.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                    >
                      {tx.type === "income" ? (
                        <TrendingUp size={18} className="text-green-600" />
                      ) : (
                        <TrendingDown size={18} className="text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {tx.note ||
                          (tx.type === "income" ? "Pemasukan" : tx.category)}
                      </p>
                      {tx.category && (
                        <span className="text-xs text-gray-400">
                          {tx.category}
                        </span>
                      )}
                      {tx.payment_method && (
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-md font-medium ml-1 ${
                            tx.payment_method === "cash"
                              ? "bg-green-50 text-green-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {tx.payment_method === "cash" ? "Cash" : "QRIS"}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-bold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
                      </p>
                    </div>
                    {deleteId === tx.id ? (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="bg-red-500 text-white text-xs px-2 py-1 rounded-lg font-medium"
                        >
                          Hapus
                        </button>
                        <button
                          onClick={() => setDeleteSelection({ businessId: business?.id ?? null, id: null })}
                          className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg font-medium"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteSelection({ businessId: business?.id ?? null, id: tx.id })}
                        className="p-1.5 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
