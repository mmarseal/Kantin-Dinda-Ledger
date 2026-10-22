import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch business milik user yang sedang login
  async function fetchBusiness(userId) {
    if (!userId) {
      setBusiness(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', userId)
        .single()

      if (error) {
        console.error('Gagal memuat data bisnis:', error.message)
        setBusiness(null)
      } else {
        setBusiness(data)
      }
    } catch (err) {
      console.error('Gagal memuat data bisnis:', err)
      setBusiness(null)
    }
  }

  useEffect(() => {
    let initialLoad = true

    // Cek session yang sudah ada
    supabase.auth.getSession()
      .then(async (res) => {
        const currentUser = res?.data?.session?.user ?? null
        setUser(currentUser)
        try {
          await fetchBusiness(currentUser?.id)
        } finally {
          setLoading(false)
          initialLoad = false
        }
      })
      .catch((err) => {
        console.error('Gagal mengambil sesi:', err)
        setLoading(false)
        initialLoad = false
      })

    // Listen perubahan auth state.
    // PENTING: callback TIDAK BOLEH await Supabase network call secara langsung,
    // karena menyebabkan deadlock pada internal auth lock SDK Supabase.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Initial session sudah ditangani oleh getSession() di atas
        if (initialLoad) return

        // Defer business fetch agar callback kembali secara sinkron
        // dan melepas Supabase internal auth lock terlebih dahulu
        setTimeout(async () => {
          try {
            await fetchBusiness(currentUser?.id)
          } finally {
            setLoading(false)
          }
        }, 0)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password, nama) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama } }
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setBusiness(null)
  }

  return (
    <AuthContext.Provider value={{ user, business, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}