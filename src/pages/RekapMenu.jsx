import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Settings, Plus, Minus, Trophy, AlertCircle, CheckCircle } from 'lucide-react'

const FILTER = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu Ini', value: 'week' },
]

function getDateRange(filter) {
  const today = new Date().toISOString().split('T')[0]
  if (filter === 'today') return { start: today, end: today }
  const start = new Date()
  start.setDate(start.getDate() - 6)
  return { start: start.toISOString().split('T')[0], end: today }
}

export default function RekapMenu() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('today')
  const [menus, setMenus] = useState([])         // master menu
  const [sales, setSales] = useState([])          // rekap penjualan
  const [qty, setQty] = useState({})              // { menu_id: number }
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchAll() {
    setLoading(true)
    const { start, end } = getDateRange(filter)

    const [{ data: menuData }, { data: salesData }] = await Promise.all([
      supabase.from('menus').select('*').eq('is_active', true).order('created_at'),
      supabase.from('menu_sales').select('*').gte('sale_date', start).lte('sale_date', end)
    ])

    if (menuData) setMenus(menuData)
    if (salesData) setSales(salesData)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [filter])

  function changeQty(menuName, delta) {
    setQty(prev => {
      const current = prev[menuName] || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [menuName]: next }
    })
  }

  async function handleSimpan() {
    const entries = Object.entries(qty).filter(([_, q]) => q > 0)
    if (entries.length === 0) return setStatus({ type: 'error', msg: 'Belum ada menu yang dipilih.' })

    setSaving(true)
    setStatus(null)
    const today = new Date().toISOString().split('T')[0]

    const inserts = entries.map(([menu_name, quantity]) => ({
      menu_name, quantity, sale_date: today
    }))

    const { error } = await supabase.from('menu_sales').insert(inserts)

    if (!error) {
      setStatus({ type: 'success', msg: `${entries.length} menu berhasil dicatat!` })
      setQty({})
      fetchAll()
    } else {
      setStatus({ type: 'error', msg: 'Gagal menyimpan. Coba lagi.' })
    }
    setSaving(false)
  }

  // Agregasi sales untuk ranking
  const aggregated = sales.reduce((acc, item) => {
    const found = acc.find(a => a.menu_name.toLowerCase() === item.menu_name.toLowerCase())
    if (found) found.quantity += item.quantity
    else acc.push({ menu_name: item.menu_name, quantity: item.quantity })
    return acc
  }, []).sort((a, b) => b.quantity - a.quantity)

  const maxQty = aggregated[0]?.quantity || 1
  const medalColor = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
  const totalDipilih = Object.values(qty).filter(q => q > 0).length

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-green-600 px-4 pt-10 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-white text-2xl font-bold">Rekap Menu</h1>
          <p className="text-green-100 text-sm mt-1">Catat menu terjual hari ini</p>
        </div>
        <button
          onClick={() => navigate('/kelola-menu')}
          className="bg-green-700 p-2.5 rounded-xl text-white mt-1"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="px-4 -mt-4 flex flex-col gap-4 pb-8">

        {/* Card Menu — Tap untuk pilih qty */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-gray-700">Pilih Menu Terjual</p>
            {totalDipilih > 0 && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                {totalDipilih} menu dipilih
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-400 text-sm mb-3">Belum ada menu. Setup dulu!</p>
              <button
                onClick={() => navigate('/kelola-menu')}
                className="bg-green-600 text-white text-sm px-4 py-2 rounded-xl font-medium"
              >
                + Kelola Menu
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {menus.map(menu => {
                const q = qty[menu.name] || 0
                const dipilih = q > 0
                return (
                  <div
                    key={menu.id}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      dipilih
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Nama Menu */}
                    <p className={`text-sm font-semibold mb-3 truncate ${dipilih ? 'text-green-700' : 'text-gray-700'}`}>
                      {menu.name}
                    </p>

                    {/* Stepper */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => changeQty(menu.name, -1)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          q > 0 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        <Minus size={14} />
                      </button>

                      <span className={`text-lg font-bold ${dipilih ? 'text-green-600' : 'text-gray-400'}`}>
                        {q}
                      </span>

                      <button
                        onClick={() => changeQty(menu.name, 1)}
                        className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
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

        {/* Tombol Simpan */}
        {totalDipilih > 0 && (
          <button
            onClick={handleSimpan}
            disabled={saving}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base shadow-lg shadow-green-200 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : `Simpan Rekap (${totalDipilih} menu)`}
          </button>
        )}

        {/* Filter Tab Ranking */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 flex gap-1">
          {FILTER.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f.value ? 'bg-green-600 text-white' : 'text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-500" />
            <p className="font-semibold text-gray-800">Menu Paling Laris</p>
          </div>

          {aggregated.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">Belum ada data penjualan</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {aggregated.map((item, idx) => (
                <div key={item.menu_name} className="flex items-center gap-3">
                  <div className="w-7 text-center shrink-0">
                    {idx < 3
                      ? <Trophy size={16} className={medalColor[idx]} />
                      : <span className="text-gray-400 text-sm font-bold">{idx + 1}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.menu_name}</p>
                      <p className="text-sm font-bold text-green-600 shrink-0 ml-2">{item.quantity} porsi</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(item.quantity / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}