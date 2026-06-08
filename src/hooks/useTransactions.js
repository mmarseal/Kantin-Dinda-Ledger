import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook untuk fetch dan manage data transaksi
 * @param {'today' | 'week' | 'month' | '7days'} range - periode data
 */
export function useTransactions(range = 'today') {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  async function fetchTransactions() {
    setLoading(true)
    setError(null)

    const { start, end } = getDateRange(range)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setTransactions(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [range])

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
    refetch: fetchTransactions,
  }
}