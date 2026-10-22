import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'
import { formatRupiah } from '../utils/formatCurrency'
import { FileSpreadsheet, FileText, Download, AlertCircle, CheckCircle, CalendarDays } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
]

export default function ExportLaporan() {
  const { business } = useAuth()
  const businessName = business?.name || 'KasFlow'
  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth())
  const [tahun, setTahun] = useState(now.getFullYear())
  const [queryResult, setQueryResult] = useState({ key: null, data: [], error: null })
  const [status, setStatus] = useState(null)

  const businessId = business?.id ?? null
  const queryKey = JSON.stringify([businessId, bulan, tahun])
  const currentResult = businessId && queryResult.key === queryKey ? queryResult : null
  const data = currentResult?.data ?? []
  const queryError = currentResult?.error ?? null
  const loading = Boolean(businessId) && !currentResult

  const totalIncome  = data.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = data.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const selisihBersih = totalIncome - totalExpense

  useEffect(() => {
    if (!businessId) return undefined

    let active = true
    const start = `${tahun}-${String(bulan + 1).padStart(2, '0')}-01`
    const lastDay = new Date(tahun, bulan + 1, 0).getDate()
    const end = `${tahun}-${String(bulan + 1).padStart(2, '0')}-${lastDay}`

    async function loadData() {
      try {
        const { data: rows, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('business_id', businessId)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: true })

        if (!active) return
        setQueryResult({ key: queryKey, data: error ? [] : (rows || []), error: error?.message ?? null })
      } catch (error) {
        if (active) setQueryResult({ key: queryKey, data: [], error: error.message || 'Gagal memuat laporan.' })
      }
    }

    loadData()
    return () => { active = false }
  }, [businessId, bulan, tahun, queryKey])

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
    rows.push({ 'Tanggal': 'SELISIH BERSIH',    'Nominal (Rp)': selisihBersih })

    const ws = XLSX.utils.json_to_sheet(rows)
    const sanitizedName = businessName.replace(/[^a-zA-Z0-9_-]/g, '_')
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `${BULAN[bulan]} ${tahun}`)
    XLSX.writeFile(wb, `Laporan_${sanitizedName}_${BULAN[bulan]}_${tahun}.xlsx`)
    setStatus({ type: 'success', msg: 'File Excel berhasil didownload!' })
  }

  // ── Export PDF ──
  function exportPDF() {
    if (data.length === 0) return setStatus({ type: 'error', msg: 'Tidak ada data untuk diexport.' })

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`LAPORAN KEUANGAN ${businessName.toUpperCase()}`, 105, 18, { align: 'center' })
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Periode: ${BULAN[bulan]} ${tahun}`, 105, 26, { align: 'center' })

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
        ['Selisih Bersih', formatRupiah(selisihBersih)],
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

    const sanitizedName = businessName.replace(/[^a-zA-Z0-9_-]/g, '_')
    doc.save(`Laporan_${sanitizedName}_${BULAN[bulan]}_${tahun}.pdf`)
    setStatus({ type: 'success', msg: 'File PDF berhasil didownload!' })
  }

  const tahunOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5">
      {/* Header */}
      <div className="px-1 pt-1">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--kf-text)] sm:text-3xl">Export Laporan</h1>
        <p className="mt-1 text-sm text-[var(--kf-text-muted)]">Unduh laporan keuangan {businessName}</p>
      </div>

      <div className="flex flex-col gap-5 pb-4">

        {/* Pilih Periode */}
        <div className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-4 shadow-[var(--kf-shadow-sm)] sm:p-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--kf-text)]"><CalendarDays size={18} className="text-[var(--kf-accent)]" />Periode Laporan</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bulan</label>
              <select
                value={bulan}
                onChange={e => setBulan(Number(e.target.value))}
                className="min-h-12 w-full rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kf-accent-soft)]"
              >
                {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tahun</label>
              <select
                value={tahun}
                onChange={e => setTahun(Number(e.target.value))}
                className="min-h-12 w-full rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--kf-accent-soft)]"
              >
                {tahunOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ringkasan Preview */}
        <div className="rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-4 shadow-[var(--kf-shadow-sm)] sm:p-5">
          <p className="mb-3 text-sm font-semibold text-[var(--kf-text)]">
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
                <span className="text-sm font-semibold text-[var(--kf-text)]">Selisih Bersih</span>
                <span className={`text-sm font-bold ${selisihBersih >= 0 ? 'text-[var(--kf-accent)]' : 'text-red-600'}`}>
                  {formatRupiah(selisihBersih)}
                </span>
              </div>
              <div className="mt-1 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">{data.length} transaksi tercatat</p>
              </div>
            </div>
          )}
        </div>

        {/* Status */}
        {queryError && (
          <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm font-medium">Gagal memuat laporan. Coba ubah periode atau muat ulang halaman.</span>
          </div>
        )}
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

        <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start gap-4 rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-5 shadow-[var(--kf-shadow-sm)]">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-[var(--kf-accent-soft)] p-2.5 text-[var(--kf-accent)]">
            <FileSpreadsheet size={22} />
          </div><div><p className="font-semibold text-[var(--kf-text)]">Excel</p><p className="text-sm text-[var(--kf-text-muted)]">Data transaksi dalam format .xlsx</p></div></div>
          <button onClick={exportExcel} disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--kf-radius-sm)] bg-[var(--kf-accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--kf-accent-hover)] disabled:opacity-50">Download Excel <Download size={17} /></button>
        </div>

        <div className="flex flex-col items-start gap-4 rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-5 shadow-[var(--kf-shadow-sm)]">
          <div className="flex items-center gap-3"><div className="rounded-xl bg-red-50 p-2.5 text-red-700">
            <FileText size={22} />
          </div><div><p className="font-semibold text-[var(--kf-text)]">PDF</p><p className="text-sm text-[var(--kf-text-muted)]">Laporan siap dicetak dalam format .pdf</p></div></div>
          <button onClick={exportPDF} disabled={loading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-4 text-sm font-semibold text-[var(--kf-text)] hover:bg-[var(--kf-surface-soft)] disabled:opacity-50">Download PDF <Download size={17} /></button>
        </div>
        </div>

      </div>
    </div>
  )
}
