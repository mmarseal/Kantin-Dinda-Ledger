import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ nama: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit() {
    setError('')
    setSuccess('')

    if (!form.email || !form.password) return setError('Email dan password wajib diisi.')
    if (mode === 'register' && !form.nama.trim()) return setError('Nama wajib diisi.')
    if (form.password.length < 6) return setError('Password minimal 6 karakter.')

    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password)
      if (error) setError('Email atau password salah.')
    } else {
      const { error } = await signUp(form.email, form.password, form.nama)
      if (error) setError('Gagal daftar. Email mungkin sudah dipakai.')
      else setSuccess('Akun berhasil dibuat! Silakan login.')
      setMode('login')
      setForm(prev => ({ ...prev, password: '' }))
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Logo & Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4">
          <img src="/icon-192.png" alt="Kantin Dinda" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Kantin Dinda</h1>
        <p className="text-gray-500 text-sm mt-1">Sistem Manajemen Keuangan</p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Nama — hanya register */}
          {mode === 'register' && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Nama</label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Contoh: Bu Injainah"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-600 text-sm bg-green-50 px-3 py-2.5 rounded-xl border border-green-100">
              {success}
            </div>
          )}

          {/* Tombol Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-gray-500">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-green-600 font-semibold"
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}