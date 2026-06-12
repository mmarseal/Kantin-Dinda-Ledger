import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatRupiah } from "../utils/formatCurrency";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [todayData, setTodayData] = useState({ income: 0, expense: 0 });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function fetchData() {
    setLoading(true);
    const todayISO = new Date().toISOString().split("T")[0];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });
    const startDate = days[0];

    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount, transaction_date")
      .gte("transaction_date", startDate)
      .lte("transaction_date", todayISO);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const todayTx = data.filter((t) => t.transaction_date === todayISO);
    const income = todayTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expense = todayTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    setTodayData({ income, expense });

    const weekly = days.map((date) => {
      const dayTx = data.filter((t) => t.transaction_date === date);
      const d = new Date(date);
      return {
        hari: HARI[d.getDay()],
        Pemasukan: dayTx
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + Number(t.amount), 0),
        Pengeluaran: dayTx
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + Number(t.amount), 0),
      };
    });
    setWeeklyData(weekly);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const labaHariIni = todayData.income - todayData.expense;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 flex justify-between items-start md:hidden">
        <div>
          <p className="text-green-100 text-sm">{today}</p>
          <h1 className="text-white text-2xl font-bold mt-1">Kantin Dinda</h1>
          <p className="text-green-100 text-sm mt-0.5">Gedung Ventura</p>
        </div>
        <button
          onClick={() => navigate("/export")}
          className="bg-green-700 p-2.5 rounded-xl text-white mt-1"
        >
          <FileDown size={20} />
        </button>
      </div>
      {/* Desktop page title */}
      <div className="hidden md:flex items-center justify-between mb-2 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Ringkasan keuangan hari ini</p>
        </div>
        <button
          onClick={() => navigate("/export")}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <FileDown size={16} />
          Export Laporan
        </button>
      </div>

      <div className="px-4 -mt-4 md:mt-0 flex flex-col gap-4 pb-6">
        {/* 3 Kartu Metrik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Pemasukan Hari Ini</p>
              {loading ? (
                <div className="h-7 w-32 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-green-600 text-xl font-bold">
                  {formatRupiah(todayData.income)}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-xl">
              <TrendingDown className="text-red-500" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-gray-500 text-sm">Pengeluaran Hari Ini</p>
              {loading ? (
                <div className="h-7 w-32 bg-gray-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-red-500 text-xl font-bold">
                  {formatRupiah(todayData.expense)}
                </p>
              )}
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${
              labaHariIni >= 0
                ? "bg-green-600 border-green-500"
                : "bg-red-500 border-red-400"
            }`}
          >
            <div className="bg-white/20 p-3 rounded-xl">
              <Wallet className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-white/80 text-sm">Laba Bersih Hari Ini</p>
              {loading ? (
                <div className="h-7 w-32 bg-white/20 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-white text-xl font-bold">
                  {formatRupiah(labaHariIni)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">
              Tren 7 Hari Terakhir
            </h2>
            <button
              onClick={fetchData}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Memuat data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barGap={2}>
                <XAxis
                  dataKey="hari"
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => formatRupiah(value)}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Pemasukan" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="Pengeluaran"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
