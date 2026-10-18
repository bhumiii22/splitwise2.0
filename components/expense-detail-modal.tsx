"use client"

import { useEffect } from "react"
import { X, Receipt, CalendarDays, User, CheckCircle2 } from "lucide-react"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍕",
  transport: "🚗",
  accommodation: "🏠",
  entertainment: "🎮",
  shopping: "🛍️",
  utilities: "⚡",
  health: "💊",
  general: "📦",
}

interface ExpenseDetailModalProps {
  expense: any
  currentUserId: string
  onClose: () => void
}

export default function ExpenseDetailModal({
  expense,
  currentUserId,
  onClose,
}: ExpenseDetailModalProps) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  if (!expense) return null

  const payerName =
    expense.paidById === currentUserId
      ? "You"
      : expense.paidBy?.name ?? "Unknown user"

  return (
    <div
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
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
          maxWidth: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#111118",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "rgba(99,102,241,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {CATEGORY_ICONS[expense.category] ?? "📦"}
            </div>

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Expense Details
              </p>

              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {expense.category ?? "general"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close expense details"
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Main content */}
        <div style={{ padding: 20 }}>
          {/* Expense title + amount */}
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
              border: "1px solid rgba(99,102,241,0.15)",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 20,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {expense.title}
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: "#818cf8",
              }}
            >
              {formatCurrency(expense.amount)}
            </p>
          </div>

          {/* Basic information */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                padding: 13,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 6,
                }}
              >
                <User size={14} color="#818cf8" />
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                  }}
                >
                  Paid by
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {payerName}
              </p>
            </div>

            <div
              style={{
                padding: 13,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  marginBottom: 6,
                }}
              >
                <CalendarDays size={14} color="#818cf8" />
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                  }}
                >
                  Date
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                }}
              >
                {formatDate(expense.createdAt)}
              </p>
            </div>
          </div>

          {/* Split breakdown */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <Receipt size={15} color="#818cf8" />

              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.45)",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                Split Breakdown
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {expense.splits?.map((split: any) => {
                const isMe = split.userId === currentUserId

                return (
                  <div
                    key={split.id ?? split.userId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 12px",
                      borderRadius: 12,
                      background: isMe
                        ? "rgba(99,102,241,0.08)"
                        : "rgba(255,255,255,0.025)",
                      border: isMe
                        ? "1px solid rgba(99,102,241,0.16)"
                        : "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background:
                          "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(split.user?.name ?? "?")}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {isMe ? "You" : split.user?.name ?? "Unknown user"}
                      </p>

                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 11,
                          color: split.isSettled
                            ? "#34d399"
                            : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {split.isSettled ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle2 size={11} />
                            Settled
                          </span>
                        ) : (
                          "Not settled"
                        )}
                      </p>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {formatCurrency(split.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}