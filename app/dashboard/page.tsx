import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { formatCurrency, getInitials } from "@/lib/utils"
import CreateGroupButton from "@/components/create-group-button"
import CreateGroupCTA from "@/components/create-group-cta"
import Link from "next/link"
import { ArrowUpRight, ArrowDownLeft, Users, Wallet, TrendingUp, Plus } from "lucide-react"
import GroupCards from "@/components/group-cards"
import JoinGroupButton from "@/components/join-group-button"
import UpiSettings from "@/components/upi-settings"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/signin")

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      groupMembers: {
        include: {
          group: {
            include: {
              members: { include: { user: true } },
              expenses: { include: { splits: true } },
            },
          },
        },
      },
      splits: { where: { isSettled: false }, include: { expense: true } },
      expensesPaid: { include: { splits: true } },
    },
  })

  if (!user) redirect("/signin")

  const groups = user.groupMembers.map((m) => m.group)
  const totalOwed = user.splits.reduce((sum, s) => sum + s.amount, 0)
  const totalToReceive = user.expensesPaid.reduce((sum, e) => {
    const others = e.splits.filter((s) => s.userId !== user.id && !s.isSettled)
    return sum + others.reduce((a, s) => a + s.amount, 0)
  }, 0)
  const totalExpenses = user.expensesPaid.reduce((sum, e) => sum + e.amount, 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
  <div>
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.4px" }}>
      {greeting},{" "}
      <span style={{ background: "linear-gradient(135deg,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {session.user?.name?.split(" ")[0]}
      </span>
    </h1>
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
      Here's your financial overview
    </p>
  </div>
  <div style={{ display: "flex", gap: 10 }}>
    <JoinGroupButton />    {/* 👈 new button */}
    <CreateGroupButton />
  </div>
</div>

<UpiSettings currentUpiId={user.upiId} />



      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 36 }} className="stats-grid">
        <style>{`@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
        {[
          { label: "Total Expenses", value: formatCurrency(totalExpenses), sub: "All time", icon: "💳", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
          { label: "You Owe", value: formatCurrency(totalOwed), sub: `${groups.length} group${groups.length !== 1 ? "s" : ""}`, icon: "📤", color: "#f43f5e", bg: "rgba(244,63,94,0.1)" },
          { label: "Owed to You", value: formatCurrency(totalToReceive), sub: "Pending", icon: "📥", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
          { label: "Groups", value: String(groups.length), sub: "Active", icon: "👥", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            padding: "18px 20px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16,
            transition: "all 0.2s",
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 14 }}>
              {stat.icon}
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: "0 0 2px", letterSpacing: "-0.5px" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Groups section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
              Your Groups
            </h2>
            {groups.length > 0 && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontWeight: 600 }}>
                {groups.length}
              </span>
            )}
          </div>
          {groups.length > 0 && <CreateGroupButton label="+ New" />}
        </div>

        {groups.length === 0 ? (
          <div style={{
            padding: "48px 24px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.08)",
            borderRadius: 20,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>No groups yet</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "0 0 20px", lineHeight: 1.6 }}>
              Create a group to start splitting expenses with friends, family, or roommates.
            </p>
            <CreateGroupCTA />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="groups-grid">
            <style>{`@media(max-width:900px){.groups-grid{grid-template-columns:repeat(2,1fr)!important}} @media(max-width:600px){.groups-grid{grid-template-columns:1fr!important}}`}</style>
            {groups.length === 0 ? (
  <div style={{
    padding: "56px 24px",
    background: "rgba(255,255,255,0.02)",
    border: "1px dashed rgba(255,255,255,0.07)",
    borderRadius: 20, textAlign: "center",
  }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
    <h3 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
      No groups yet
    </h3>
    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: "0 0 20px", lineHeight: 1.6 }}>
      Create a group to start splitting expenses with friends, family, or roommates.
    </p>
    <CreateGroupCTA />
  </div>
) : (
  <GroupCards groups={groups} userId={user.id} />
)}
          </div>
        )}
      </div>
    </div>
  )
}