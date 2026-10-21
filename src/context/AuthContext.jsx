import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

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
  }

  useEffect(() => {
    // Cek session yang sudah ada
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      await fetchBusiness(currentUser?.id)
      setLoading(false)
    })

    // Listen perubahan auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        await fetchBusiness(currentUser?.id)
        setLoading(false)
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

export function useAuth() {
  return useContext(AuthContext)
}