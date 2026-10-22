import { useState } from 'react'
import { useAuth } from '../context/useAuth'
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--kf-page)] px-4 py-8">
      {/* Logo & Title */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 h-20 w-20 overflow-hidden rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white shadow-[var(--kf-shadow-sm)]">
          <img src="/icon-192.png" alt="KasFlow" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--kf-text)]">KasFlow</h1>
        <p className="mt-1 text-sm text-[var(--kf-text-muted)]">Sistem Manajemen Keuangan</p>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-sm rounded-[var(--kf-radius-lg)] border border-[var(--kf-border)] bg-white p-6 shadow-[var(--kf-shadow-sm)]">
        <h2 className="mb-5 text-lg font-bold text-[var(--kf-text)]">
          {mode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
        </h2>

        <div className="flex flex-col gap-4">
          {/* Nama — hanya register */}
          {mode === 'register' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--kf-text)]">Nama</label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Contoh: Bu Injainah"
                className="min-h-12 w-full rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-4 text-base text-[var(--kf-text)] outline-none transition focus:border-[var(--kf-accent)] focus:ring-2 focus:ring-[var(--kf-accent-soft)]"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--kf-text)]">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@contoh.com"
              className="min-h-12 w-full rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-4 text-base text-[var(--kf-text)] outline-none transition focus:border-[var(--kf-accent)] focus:ring-2 focus:ring-[var(--kf-accent-soft)]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--kf-text)]">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Minimal 6 karakter"
                className="min-h-12 w-full rounded-[var(--kf-radius-sm)] border border-[var(--kf-border-strong)] bg-white px-4 pr-12 text-base text-[var(--kf-text)] outline-none transition focus:border-[var(--kf-accent)] focus:ring-2 focus:ring-[var(--kf-accent-soft)]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--kf-text-muted)]"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {success}
            </div>
          )}

          {/* Tombol Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="min-h-12 w-full rounded-[var(--kf-radius-sm)] bg-[var(--kf-accent)] px-4 text-base font-bold text-white transition-colors hover:bg-[var(--kf-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>

          {/* Toggle mode */}
          <p className="text-center text-sm text-[var(--kf-text-muted)]">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
            {' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="font-semibold text-[var(--kf-accent-hover)]"
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
