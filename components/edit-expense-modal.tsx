"use client"

import { useEffect, useMemo, useState } from "react"
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

interface EditExpenseModalProps {
  group: any
  expense: any
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditExpenseModal({
  group,
  expense,
  currentUserId,
  onClose,
  onSuccess,
}: EditExpenseModalProps) {
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("general")
  const [splitType, setSplitType] = useState("equal")
  const [paidById, setPaidById] = useState(currentUserId)
  const [shares, setShares] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!expense) return

    setTitle(expense.title ?? "")
    setAmount(String(expense.amount ?? ""))
    setCategory(expense.category ?? "general")
    setSplitType(expense.splitType ?? "equal")
    setPaidById(expense.paidById ?? currentUserId)

    const initialShares: Record<string, string> = {}

    for (const member of group.members) {
      const split = expense.splits?.find(
        (s: any) => s.userId === member.userId
      )

      if (split) {
        if (expense.splitType === "percentage") {
          const percentage =
            expense.amount > 0
              ? (split.amount / expense.amount) * 100
              : 0

          initialShares[member.userId] =
            percentage.toFixed(2)
        } else {
          initialShares[member.userId] =
            Number(split.amount).toFixed(2)
        }
      }
    }

    setShares(initialShares)
  }, [expense, group.members, currentUserId])

  const numericAmount = Number(amount) || 0

  const calculatedShares = useMemo(() => {
    if (splitType === "equal") {
      const equalShare =
        group.members.length > 0
          ? numericAmount / group.members.length
          : 0

      return Object.fromEntries(
        group.members.map((member: any) => [
          member.userId,
          equalShare,
        ])
      )
    }

    if (splitType === "percentage") {
      return Object.fromEntries(
        group.members.map((member: any) => {
          const percentage =
            Number(shares[member.userId]) || 0

          return [
            member.userId,
            numericAmount * (percentage / 100),
          ]
        })
      )
    }

    return Object.fromEntries(
      group.members.map((member: any) => [
        member.userId,
        Number(shares[member.userId]) || 0,
      ])
    )
  }, [splitType, numericAmount, shares, group.members])

  const enteredTotal = Object.values(calculatedShares).reduce(
    (sum, value) => sum + value,
    0
  )

  const percentageTotal = Object.values(shares).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  )

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    if (
      !amount ||
      isNaN(Number(amount)) ||
      Number(amount) <= 0
    ) {
      setError("Please enter a valid amount")
      return
    }

    if (
      splitType === "percentage" &&
      Math.abs(percentageTotal - 100) > 0.01
    ) {
      setError("Percentages must add up to 100%")
      return
    }

    if (
      splitType === "exact" &&
      Math.abs(enteredTotal - numericAmount) > 0.01
    ) {
      setError(
        `Exact shares must add up to ${numericAmount.toFixed(2)}`
      )
      return
    }

    setLoading(true)
    setError("")

    try {
      const splitValues =
        splitType === "equal"
          ? undefined
          : Object.fromEntries(
              group.members.map((member: any) => [
                member.userId,
                Number(shares[member.userId]) || 0,
              ])
            )

      const res = await fetch(
        `/api/groups/${group.id}/expenses/${expense.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            amount: numericAmount,
            category,
            splitType,
            paidById,
            shares: splitValues,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.error ?? "Failed to update expense"
        )
      }

      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function updateShare(userId: string, value: string) {
    setShares((prev) => ({
      ...prev,
      [userId]: value,
    }))

    setError("")
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !loading) {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Edit Expense
                </h2>

                <p className="text-xs text-white/35 mt-0.5">
                  {group.name}
                </p>
              </div>

              <button
                onClick={onClose}
                disabled={loading}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                  What's this for?
                </label>

                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setError("")
                  }}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                  Amount (₹)
                </label>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      setError("")
                    }}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                  Category
                </label>

                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        category === cat.id
                          ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60"
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
                <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                  Paid by
                </label>

                <select
                  value={paidById}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                >
                  {group.members.map((member: any) => (
                    <option
                      key={member.userId}
                      value={member.userId}
                      className="bg-[#0f0f0f]"
                    >
                      {member.userId === currentUserId
                        ? "You"
                        : member.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split type */}
              <div>
                <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                  Split
                </label>

                <div className="flex gap-2">
                  {[
                    { id: "equal", label: "Equal" },
                    { id: "percentage", label: "By %" },
                    { id: "exact", label: "Exact" },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSplitType(type.id)
                        setError("")
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        splitType === type.id
                          ? "bg-indigo-500/20 border border-indigo-500/40 text-indigo-300"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Split values */}
              {splitType !== "equal" && (
                <div>
                  <label className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1.5 block">
                    {splitType === "percentage"
                      ? "Percentage per member"
                      : "Amount per member"}
                  </label>

                  <div className="space-y-2">
                    {group.members.map((member: any) => (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <p className="text-xs text-white/60">
                            {member.userId === currentUserId
                              ? "You"
                              : member.user.name}
                          </p>
                        </div>

                        <div className="relative w-28">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shares[member.userId] ?? ""}
                            onChange={(e) =>
                              updateShare(
                                member.userId,
                                e.target.value
                              )
                            }
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500/50"
                          />

                          {splitType === "percentage" && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
                              %
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-white/30 mt-2">
                    {splitType === "percentage"
                      ? `Total: ${percentageTotal.toFixed(2)}%`
                      : `Total: ₹${enteredTotal.toFixed(2)}`}
                  </p>
                </div>
              )}

              {/* Equal preview */}
              {splitType === "equal" && (
                <div className="bg-indigo-500/[0.06] border border-indigo-500/[0.12] rounded-xl px-3 py-3">
                  <p className="text-xs text-white/40 mb-1">
                    Equal split
                  </p>

                  <p className="text-sm text-indigo-300 font-semibold">
                    ₹
                    {(
                      group.members.length > 0
                        ? numericAmount /
                          group.members.length
                        : 0
                    ).toFixed(2)}
                    {" / member"}
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <GradientButton
                className="w-full"
                onClick={handleSubmit}
                loading={loading}
              >
                Save Changes
              </GradientButton>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}