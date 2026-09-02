"use client"

import { useState } from "react"

export default function UpiSettings({
  currentUpiId,
}: {
  currentUpiId: string | null
}) {
  const [upiId, setUpiId] = useState(currentUpiId ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function saveUpi() {
    setMessage("")

    if (!upiId.includes("@")) {
      setMessage("Please enter a valid UPI ID")
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/profile/upi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upiId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to save")
      }

      setMessage("UPI ID saved successfully ✓")
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        marginBottom: 28,
        padding: 18,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "rgba(255,255,255,0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          margin: "0 0 8px",
        }}
      >
        UPI Payments
      </p>

      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          margin: "0 0 12px",
        }}
      >
        Add your UPI ID so friends can pay you directly.
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourname@upi"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            color: "#fff",
            outline: "none",
            fontFamily: "inherit",
            fontSize: 13,
          }}
        />

        <button
          onClick={saveUpi}
          disabled={saving}
          style={{
            padding: "10px 16px",
            borderRadius: 9,
            border: "none",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {message && (
        <p
          style={{
            fontSize: 12,
            color: message.includes("successfully")
              ? "#34d399"
              : "#fb7185",
            margin: "8px 0 0",
          }}
        >
          {message}
        </p>
      )}
    </div>
  )
}