"use client"

import { useState,useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import AddExpenseModal from "@/components/add-expense-modal"
import {
  ArrowLeft,
  Copy,
  Plus,
  Check,
  Share2,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react"
import { useSocket } from "@/hooks/use-socket"

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍕", transport: "🚗", accommodation: "🏠",
  entertainment: "🎮", shopping: "🛍️", utilities: "⚡",
  health: "💊", general: "📦"
}

interface Props {
  group: any
  currentUserId: string
  balances: Record<string, number>
  totalSpend: number
  myBalance: number
  inviteCode: string
}

export default function GroupPageClient({
  group, currentUserId, balances, totalSpend, myBalance, inviteCode
}: Props) {
 const [showExpenseModal, setShowExpenseModal] = useState(false)
const [copied, setCopied] = useState(false)
const [expenses, setExpenses] = useState<any[]>(group.expenses)
const [toast, setToast] = useState<string | null>(null)
const [expenseToDelete, setExpenseToDelete] = useState<any | null>(null)
const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

const router = useRouter()
const socket = useSocket()

useEffect(() => {
  if (!socket) return
  socket.emit("join-group", group.id)

  socket.on("expense:added", ({ expense, addedBy }) => {
    setExpenses(prev => [expense, ...prev])
    // Show toast notification
    setToast(`${addedBy} just added "${expense.title}"`)
    setTimeout(() => setToast(null), 3000)
  })
  socket.on("expense:deleted", ({ expenseId, deletedBy }) => {
  setExpenses(prev =>
    prev.filter(expense => expense.id !== expenseId)
  )

  setToast(`${deletedBy} deleted an expense`)
  setTimeout(() => setToast(null), 3000)

  router.refresh()
})

  return () => {
    socket.emit("leave-group", group.id)
    socket.off("expense:added")
    socket.off("expense:deleted")
  }
}, [socket, group.id])

async function deleteExpense() {
  if (!expenseToDelete) return

  setDeletingExpenseId(expenseToDelete.id)

  try {
    const response = await fetch(
      `/api/groups/${group.id}/expenses/${expenseToDelete.id}`,
      {
        method: "DELETE",
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(
        data.error ?? "Failed to delete expense"
      )
    }

    setExpenses((prev) =>
      prev.filter(
        (expense) => expense.id !== expenseToDelete.id
      )
    )

    setExpenseToDelete(null)

    setToast("Expense deleted successfully")
    setTimeout(() => setToast(null), 3000)

    router.refresh()
  } catch (error: any) {
    alert(error.message)
  } finally {
    setDeletingExpenseId(null)
  }
}

  function copyInvite() {
    navigator.clipboard.writeText(inviteCode)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
  }

  // Build clear settle-up suggestions
  
  // "Ishaa owes Mrunal ₹500" or "Mrunal owes Ishaa ₹2000"
  const settlements: { from: any; to: any; amount: number }[] = []
  const memberMap = Object.fromEntries(group.members.map((m: any) => [m.userId, m.user]))

  const debtors = group.members
    .filter((m: any) => (balances[m.userId] ?? 0) < -0.5)
    .map((m: any) => ({ userId: m.userId, amount: Math.abs(balances[m.userId]) }))

  const creditors = group.members
    .filter((m: any) => (balances[m.userId] ?? 0) > 0.5)
    .map((m: any) => ({ userId: m.userId, amount: balances[m.userId] }))

  // Greedy algorithm — pair biggest debtor with biggest creditor
  const d = debtors.map((x: any) => ({ ...x }))
  const c = creditors.map((x: any) => ({ ...x }))
  while (d.length && c.length) {
    const debtor = d[0]
    const creditor = c[0]
    const amount = Math.min(debtor.amount, creditor.amount)
    settlements.push({ from: memberMap[debtor.userId], to: memberMap[creditor.userId], amount })
    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount < 0.5) d.shift()
    if (creditor.amount < 0.5) c.shift()
  }

  const mySettlements = settlements.filter(
    s => s.from?.id === currentUserId || s.to?.id === currentUserId
  )

  const [settling, setSettling] = useState<string | null>(null)

async function markAsPaid(toUserId: string, amount: number) {
  setSettling(toUserId)
  try {
    const res = await fetch(`/api/groups/${group.id}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId, amount }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    router.refresh() // Refresh to recalculate balances
  } catch (e: any) {
    alert(e.message)
  } finally {
    setSettling(null)
  }
}



  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none", marginBottom: 16, transition: "color 0.2s" }}>
          <ArrowLeft size={13} /> Back to dashboard
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.25))",
              border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 700, color: "#818cf8",
            }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>{group.name}</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                {group.members.length} members · {expenses.length} expenses
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={copyInvite} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.1)", background: copied ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
              color: copied ? "#34d399" : "rgba(255,255,255,0.6)", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "inherit",
            }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Invite"}
            </button>
            <button onClick={() => setShowExpenseModal(true)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff", cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
            }}>
              <Plus size={13} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          {
            label: "Total Spent",
            value: formatCurrency(totalSpend),
            sub: `across ${expenses.length} expenses`,
            color: "#818cf8",
            bg: "rgba(99,102,241,0.08)",
          },
          {
            label: myBalance >= 0 ? "You Are Owed" : "You Owe",
            value: formatCurrency(Math.abs(myBalance)),
            sub: myBalance >= 0 ? "others owe you this" : "you need to pay this",
            color: myBalance >= 0 ? "#34d399" : "#fb7185",
            bg: myBalance >= 0 ? "rgba(52,211,153,0.08)" : "rgba(251,113,133,0.08)",
          },
          {
            label: "Members",
            value: String(group.members.length),
            sub: group.members.map((m: any) => m.user.name?.split(" ")[0]).join(", "),
            color: "#fbbf24",
            bg: "rgba(251,191,36,0.08)",
          },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: "16px 18px",
            background: stat.bg,
            border: `1px solid ${stat.color}20`,
            borderRadius: 14,
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 6px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: stat.color, margin: "0 0 3px", letterSpacing: "-0.5px" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }} className="group-layout">
        <style>{`@media(max-width:900px){.group-layout{grid-template-columns:1fr!important}}`}</style>

        {/* Left — Expenses */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Expenses
          </p>

          {expenses.length === 0 ? (
            <div style={{ padding: "48px 24px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)", borderRadius: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🧾</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>No expenses yet</p>
              <button onClick={() => setShowExpenseModal(true)} style={{
                padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "#fff", cursor: "pointer", fontFamily: "inherit",
              }}>
                Add first expense
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {expenses.map((expense: any) => {
  const paidByMe = expense.paidById === currentUserId

  const currentMember = group.members.find(
    (member: any) => member.userId === currentUserId
  )

  const isGroupAdmin =
    currentMember?.role === "admin" ||
    group.createdById === currentUserId

  const canDelete =
    paidByMe || isGroupAdmin

  const myShareSplit = expense.splits?.find(
    (s: any) => s.userId === currentUserId
  )
                const myShare = myShareSplit?.amount ?? 0
                const isSettled = myShareSplit?.isSettled ?? false

                return (
                  <div key={expense.id} style={{
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, flexShrink: 0,
                    }}>
                      {CATEGORY_ICONS[expense.category] ?? "📦"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {expense.title}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>
                        Paid by {paidByMe ? "you" : expense.paidBy?.name?.split(" ")[0]} · {formatDate(expense.createdAt)}
                      </p>
                    </div>

                    {/* Amount + Delete */}
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
  }}
>
  <div style={{ textAlign: "right" }}>
    <p
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "#fff",
        margin: 0,
      }}
    >
      {formatCurrency(expense.amount)}
    </p>

    {paidByMe ? (
      <p
        style={{
          fontSize: 12,
          color: "#34d399",
          margin: "2px 0 0",
        }}
      >
        you paid
      </p>
    ) : isSettled ? (
      <p
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.25)",
          margin: "2px 0 0",
        }}
      >
        settled
      </p>
    ) : (
      <p
        style={{
          fontSize: 12,
          color: "#fb7185",
          margin: "2px 0 0",
        }}
      >
        you owe {formatCurrency(myShare)}
      </p>
    )}
  </div>

  {canDelete && (
    <button
      onClick={(event) => {
        event.stopPropagation()
        setExpenseToDelete(expense)
      }}
      title="Delete expense"
      aria-label={`Delete ${expense.title}`}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid rgba(251,113,133,0.2)",
        background: "rgba(251,113,133,0.07)",
        color: "#fb7185",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Trash2 size={14} />
    </button>
  )}
</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Settle up */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
              Settle Up
            </p>

            {settlements.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ fontSize: 22, margin: "0 0 6px" }}>✅</p>
                <p style={{ fontSize: 13, color: "#34d399", margin: 0, fontWeight: 500 }}>All settled!</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "4px 0 0" }}>No outstanding balances</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {settlements.map((s, i) => {
                  const isMe = s.from?.id === currentUserId
                  // const upiLink = `upi://pay?pa=${s.to?.upiId ?? ""}&am=${s.amount.toFixed(2)}&tn=Splitwise+Settlement`
                  const upiLink = s.to?.upiId
  ? `upi://pay?pa=${encodeURIComponent(s.to.upiId)}&pn=${encodeURIComponent(
      s.to.name ?? ""
    )}&am=${s.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
      "Splitwise Settlement"
    )}`
  : null;

                  return (
                    <div key={i} style={{
                      padding: "12px 14px",
                      background: isMe ? "rgba(251,113,133,0.07)" : "rgba(52,211,153,0.07)",
                      border: `1px solid ${isMe ? "rgba(251,113,133,0.15)" : "rgba(52,211,153,0.15)"}`,
                      borderRadius: 10,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {getInitials(s.from?.name ?? "?")}
                        </div>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>→</span>
                        <div style={{
                          width: 26, height: 26, borderRadius: 8,
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {getInitials(s.to?.name ?? "?")}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                            <strong style={{ color: isMe ? "#fb7185" : "#fff" }}>
                              {isMe ? "You" : s.from?.name?.split(" ")[0]}
                            </strong>
                            {" "}→{" "}
                            <strong style={{ color: !isMe ? "#34d399" : "#fff" }}>
                              {!isMe ? "You" : s.to?.name?.split(" ")[0]}
                            </strong>
                          </p>
                        </div>
                      </div>

                      <p style={{ fontSize: 18, fontWeight: 800, color: isMe ? "#fb7185" : "#34d399", margin: "0 0 10px", letterSpacing: "-0.3px" }}>
                        {formatCurrency(s.amount)}
                      </p>

                {isMe && (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  {/* <a
                    href={`upi://pay?pa=${s.to?.upiId ?? "upi@bank"}&am=${s.amount.toFixed(
                      2
                    )}&tn=Splitwise`}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 0",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      color: "#818cf8",
                      textDecoration: "none",
                    }}
                  >
                    📲 Pay via UPI
                  </a> */}
                  {upiLink ? (
  <a
    href={upiLink}
    style={{
      flex: 1,
      textAlign: "center",
      padding: "8px 0",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      background: "rgba(99,102,241,0.15)",
      border: "1px solid rgba(99,102,241,0.3)",
      color: "#818cf8",
      textDecoration: "none",
    }}
  >
    📲 Pay via UPI
  </a>
) : (
  <span
    style={{
      flex: 1,
      textAlign: "center",
      padding: "8px 0",
      borderRadius: 8,
      fontSize: 12,
      color: "rgba(255,255,255,0.3)",
    }}
  >
    UPI not added
  </span>
)}

                  <button
                    onClick={() => markAsPaid(s.to?.id, s.amount)}
                    disabled={settling === s.to?.id}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      border: "none",
                      background:
                        settling === s.to?.id
                          ? "rgba(16,185,129,0.2)"
                          : "linear-gradient(135deg,#10b981,#059669)",
                      color: "#fff",
                      cursor:
                        settling === s.to?.id
                          ? "not-allowed"
                          : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {settling === s.to?.id
                      ? "Marking..."
                      : "✓ Mark as Paid"}
                  </button>
                </div>
              )}
                      
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Members */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 12px" }}>
              Members & Balances
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.members.map((m: any) => {
                const balance = balances[m.userId] ?? 0
                const isMe = m.userId === currentUserId
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      overflow: "hidden", flexShrink: 0,
                      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#fff",
                    }}>
                      {m.user.image
                        ? <img src={m.user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : getInitials(m.user.name ?? "U")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", margin: 0 }}>
                        {isMe ? "You" : m.user.name?.split(" ")[0]}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "1px 0 0" }}>
                        {Math.abs(balance) < 1 ? "settled up" : balance > 0 ? "is owed money" : "owes money"}
                      </p>
                    </div>
                    <p style={{
                      fontSize: 14, fontWeight: 700, margin: 0,
                      color: Math.abs(balance) < 1 ? "rgba(255,255,255,0.25)" : balance > 0 ? "#34d399" : "#fb7185",
                    }}>
                      {Math.abs(balance) < 1 ? "✓" : (balance > 0 ? "+" : "") + formatCurrency(balance)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Invite */}
          <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 10px" }}>
              Invite Members
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                {inviteCode}
              </p>
              <button onClick={copyInvite} style={{ background: "none", border: "none", cursor: "pointer", color: "#818cf8", padding: 0, display: "flex" }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
            <button onClick={copyInvite} style={{
              width: "100%", padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)",
              color: "#818cf8", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
            }}>
              {copied ? "✓ Copied!" : "Copy invite link"}
            </button>
          </div>
        </div>
      </div>
      {expenseToDelete && (
  <div
    onMouseDown={(event) => {
      if (
        event.target === event.currentTarget &&
        !deletingExpenseId
      ) {
        setExpenseToDelete(null)
      }
    }}
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 24px 70px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            background: "rgba(251,113,133,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fb7185",
          }}
        >
          <Trash2 size={19} />
        </div>

        <button
          onClick={() => setExpenseToDelete(null)}
          disabled={!!deletingExpenseId}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.5)",
            cursor: deletingExpenseId
              ? "not-allowed"
              : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={15} />
        </button>
      </div>

      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 19,
          fontWeight: 700,
          color: "#fff",
        }}
      >
        Delete expense?
      </h2>

      <p
        style={{
          margin: "0 0 8px",
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        Are you sure you want to delete{" "}
        <strong style={{ color: "#fff" }}>
          "{expenseToDelete.title}"
        </strong>
        ?
      </p>

      <p
        style={{
          margin: "0 0 20px",
          fontSize: 12,
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.3)",
        }}
      >
        This will remove the expense and its
        split details and recalculate the
        group's balances.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => setExpenseToDelete(null)}
          disabled={!!deletingExpenseId}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.7)",
            cursor: deletingExpenseId
              ? "not-allowed"
              : "pointer",
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          Cancel
        </button>

        <button
          onClick={deleteExpense}
          disabled={!!deletingExpenseId}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background:
              "linear-gradient(135deg,#fb7185,#e11d48)",
            color: "#fff",
            cursor: deletingExpenseId
              ? "not-allowed"
              : "pointer",
            fontFamily: "inherit",
            fontWeight: 700,
            opacity: deletingExpenseId ? 0.6 : 1,
          }}
        >
          {deletingExpenseId
            ? "Deleting..."
            : "Delete Expense"}
        </button>
      </div>
    </div>
  </div>
)}

      {showExpenseModal && (
        <AddExpenseModal
          group={group}
          currentUserId={currentUserId}
          onClose={() => setShowExpenseModal(false)}
          onSuccess={() => {
            setShowExpenseModal(false)
            router.refresh()
          }}
        />
      )}
      
    </div>
  )
}