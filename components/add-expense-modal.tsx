
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "./ui/glass-card"
import { GradientButton } from "./ui/gradient-button"
import { X } from "lucide-react"

const CATEGORIES = [
  { id: "food", label: "Food", icon: "🍕" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "accommodation", label: "Stay", icon: "🏠" },
  { id: "entertainment", label: "Fun", icon: "🎮" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "utilities", label: "Bills", icon: "⚡" },
  { id: "general", label: "Other", icon: "📦" },
]

interface AddExpenseModalProps {
  group: any
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AddExpenseModal({
  group,
  currentUserId,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("general")
  const [splitType, setSplitType] = useState("equal")
  const [paidById, setPaidById] = useState(currentUserId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit() {
    if (loading) return

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    if (
      !amount.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/groups/${group.id}/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category,
          splitType,
          paidById,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to add expense. Please try again.")
      }

      onSuccess()
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="my-auto w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white">
                  Add Expense
                </h2>
                <p className="mt-0.5 truncate text-xs text-white/35">
                  {group.name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                aria-label="Close add expense modal"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSubmit()
              }}
            >
              {/* Title */}
              <div>
                <label
                  htmlFor="expense-title"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  What's this for?
                </label>

                <input
                  id="expense-title"
                  autoFocus
                  type="text"
                  placeholder="e.g. Dinner at Barbeque Nation"
                  value={title}
                  disabled={loading}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setError("")
                  }}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="expense-amount"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  Amount (₹)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                    ₹
                  </span>

                  <input
                    id="expense-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    value={amount}
                    disabled={loading}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setError("")
                    }}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] py-3 pl-8 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      disabled={loading}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        category === cat.id
                          ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                          : "border-white/[0.06] bg-white/[0.04] text-white/40 hover:bg-white/[0.07] hover:text-white/60"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paid by */}
              <div>
                <label
                  htmlFor="expense-paid-by"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  Paid by
                </label>

                <select
                  id="expense-paid-by"
                  value={paidById}
                  disabled={loading}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all focus:border-indigo-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {group.members.map((m: any) => (
                    <option
                      key={m.userId}
                      value={m.userId}
                      className="bg-[#0f0f0f]"
                    >
                      {m.userId === currentUserId ? "You" : m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Split
                </label>

                <div className="flex gap-2">
                  {[
                    { id: "equal", label: "Equal" },
                    { id: "percentage", label: "By %" },
                    { id: "exact", label: "Exact" },
                  ].map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      disabled={loading}
                      onClick={() => setSplitType(type.id)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                        splitType === type.id
                          ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-300"
                          : "border-white/[0.06] bg-white/[0.04] text-white/40 hover:text-white/60"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <GradientButton
                className="w-full"
                onClick={handleSubmit}
                loading={loading}
              >
                {loading ? "Adding..." : "Add Expense"}
              </GradientButton>
            </form>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
