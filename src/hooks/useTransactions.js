import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

/**
 * Hook untuk fetch dan manage data transaksi
 * @param {'today' | 'week' | 'month' | '7days'} range - periode data
 */
export function useTransactions(range = 'today') {
  const { business } = useAuth()
  const businessId = business?.id ?? null
  const [refreshToken, setRefreshToken] = useState(0)
  const [result, setResult] = useState({ key: null, transactions: [], error: null })

  function getDateRange(range) {
    const today = new Date().toISOString().split('T')[0]

    if (range === 'today') return { start: today, end: today }

    if (range === '7days') {
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { start: start.toISOString().split('T')[0], end: today }
    }

    if (range === 'week') {
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { start: start.toISOString().split('T')[0], end: today }
    }

    if (range === 'month') {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: start.toISOString().split('T')[0], end: today }
    }

    return { start: today, end: today }
  }

  const key = JSON.stringify([businessId, range, refreshToken])

  useEffect(() => {
    if (!businessId) return undefined

    let active = true
    const { start, end } = getDateRange(range)

    async function loadTransactions() {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('business_id', businessId)
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (!active) return
        setResult({
          key,
          transactions: error ? [] : (data || []),
          error: error?.message ?? null,
        })
      } catch (error) {
        if (!active) return
        setResult({ key, transactions: [], error: error.message || 'Gagal memuat transaksi.' })
      }
    }

    loadTransactions()
    return () => { active = false }
  }, [businessId, key, range])

  const currentResult = businessId && result.key === key ? result : null
  const transactions = currentResult?.transactions ?? []
  const loading = Boolean(businessId) && !currentResult
  const error = currentResult?.error ?? null

  const summary = {
    totalIncome:  transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    totalExpense: transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    get laba() { return this.totalIncome - this.totalExpense }
  }

  return {
    transactions,
    loading,
    error,
    summary,
    refetch: () => setRefreshToken((token) => token + 1),
  }
}