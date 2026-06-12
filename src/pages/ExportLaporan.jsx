import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatRupiah } from '../utils/formatCurrency'
import { ArrowLeft, FileSpreadsheet, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

export default function ExportLaporan() {
  const navigate = useNavigate()
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth())
  const [tahun, setTahun] = useState(now.getFullYear())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const totalIncome  = data.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = data.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const laba = totalIncome - totalExpense

  async function fetchData() {
    setLoading(true)
    setStatus(null)
    const start = `${tahun}-${String(bulan + 1).padStart(2, '0')}-01`
    const lastDay = new Date(tahun, bulan + 1, 0).getDate()
    const end = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${lastDay}`

    const { data: rows, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: true })

    if (!error) setData(rows || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [bulan, tahun])

  // ── Export Excel ──
  function exportExcel() {
    if (data.length === 0) return setStatus({ type: 'error', msg: 'Tidak ada data untuk diexport.' })

    const rows = data.map(t => ({
      'Tanggal': t.transaction_date,
      'Jenis': t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      'Kategori': t.category || '-',
      'Catatan': t.note || '-',
      'Nominal (Rp)': Number(t.amount),
    }))

    // Tambah baris ringkasan
    rows.push({})
    rows.push({ 'Tanggal': 'TOTAL PEMASUKAN',  'Nominal (Rp)': totalIncome })
    rows.push({ 'Tanggal': 'TOTAL PENGELUARAN', 'Nominal (Rp)': totalExpense })
    rows.push({ 'Tanggal': 'LABA BERSIH',       'Nominal (Rp)': laba })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${BULAN[bulan]} ${tahun}`)
    XLSX.writeFile(wb, `Laporan_KantinDinda_${BULAN[bulan]}_${tahun}.xlsx`)
    setStatus({ type: 'success', msg: 'File Excel berhasil didownload!' })
  }

  // ── Export PDF ──
  function exportPDF() {
    if (data.length === 0) return setStatus({ type: 'error', msg: 'Tidak ada data untuk diexport.' })

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN KEUANGAN KANTIN DINDA', 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gedung Ventura | Periode: ${BULAN[bulan]} ${tahun}`, 105, 26, { align: 'center' })

    // Ringkasan
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Ringkasan', 14, 36)
    autoTable(doc, {
      startY: 39,
      head: [['Keterangan', 'Jumlah']],
      body: [
        ['Total Pemasukan', formatRupiah(totalIncome)],
        ['Total Pengeluaran', formatRupiah(totalExpense)],
        ['Laba Bersih', formatRupiah(laba)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    // Detail Transaksi
    const afterSummary = doc.lastAutoTable.finalY + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Detail Transaksi', 14, afterSummary)

    autoTable(doc, {
      startY: afterSummary + 3,
      head: [['Tanggal', 'Jenis', 'Kategori', 'Catatan', 'Nominal']],
      body: data.map(t => [
        t.transaction_date,
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.category || '-',
        t.note || '-',
        formatRupiah(Number(t.amount)),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
      columnStyles: { 4: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(150)
      doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Hal ${i} dari ${pageCount}`, 105, 290, { align: 'center' })
    }

    doc.save(`Laporan_KantinDinda_${BULAN[bulan]}_${tahun}.pdf`)
    setStatus({ type: 'success', msg: 'File PDF berhasil didownload!' })
  }

  const tahunOptions = [now.getFullYear() - 1, now.getFullYear()]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 md:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-green-100 mb-3">
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1 className="text-white text-2xl font-bold">Export Laporan</h1>
        <p className="text-green-100 text-sm mt-1">Download rekap keuangan</p>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-4 pb-8">

        {/* Pilih Periode */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pilih Periode</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bulan</label>
              <select
                value={bulan}
                onChange={e => setBulan(Number(e.target.value))}
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
              >
                {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tahun</label>
              <select
                value={tahun}
                onChange={e => setTahun(Number(e.target.value))}
                className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"
              >
                {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ringkasan Preview */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Ringkasan {BULAN[bulan]} {tahun}
          </p>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Pemasukan</span>
                <span className="text-sm font-bold text-green-600">{formatRupiah(totalIncome)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Pengeluaran</span>
                <span className="text-sm font-bold text-red-500">{formatRupiah(totalExpense)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-semibold text-gray-700">Laba Bersih</span>
                <span className={`text-sm font-bold ${laba >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatRupiah(laba)}
                </span>
              </div>
              <div className="mt-1 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">{data.length} transaksi tercatat</p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        {status && (
          <div className={`flex items-center gap-3 p-4 rounded-xl ${
            status.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{status.msg}</span>
          </div>
        )}

        {/* Tombol Export */}
        <p className="text-sm font-semibold text-gray-700 -mb-2">Pilih Format</p>

        <button
          onClick={exportExcel}
          disabled={loading}
          className="w-full py-4 px-5 rounded-2xl bg-emerald-600 text-white font-bold flex items-center gap-3 shadow-lg shadow-emerald-100 disabled:opacity-50"
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <FileSpreadsheet size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold">Download Excel</p>
            <p className="text-emerald-100 text-xs font-normal">Format .xlsx — buka di Excel / Google Sheets</p>
          </div>
          <Download size={18} className="ml-auto" />
        </button>

        <button
          onClick={exportPDF}
          disabled={loading}
          className="w-full py-4 px-5 rounded-2xl bg-red-500 text-white font-bold flex items-center gap-3 shadow-lg shadow-red-100 disabled:opacity-50"
        >
          <div className="bg-white/20 p-2 rounded-lg">
            <FileText size={22} />
          </div>
          <div className="text-left">
            <p className="font-bold">Download PDF</p>
            <p className="text-red-100 text-xs font-normal">Format .pdf — untuk arsip & cetak</p>
          </div>
          <Download size={18} className="ml-auto" />
        </button>

      </div>
    </div>
  )
}