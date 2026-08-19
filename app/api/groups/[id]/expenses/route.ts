import { getUserFromCookies } from "@/lib/get-user"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { title, amount, category, splitType, paidById } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Valid amount required" },
        { status: 400 }
      )
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      )
    }

    const isMember = group.members.some(
      (m) => m.userId === user.id
    )

    if (!isMember) {
      return NextResponse.json(
        { error: "Not a member" },
        { status: 403 }
      )
    }

    const parsedAmount = Number(amount)
    const equalShare = parsedAmount / group.members.length
    const payerId = paidById ?? user.id

    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        paidById: payerId,
        title: title.trim(),
        amount: parsedAmount,
        category: category ?? "general",
        splitType: splitType ?? "equal",

        splits: {
          create: group.members.map((member) => ({
            userId: member.userId,
            amount: equalShare,
            isSettled: member.userId === payerId,
          })),
        },
      },

      include: {
        paidBy: true,
        splits: {
          include: {
            user: true,
          },
        },
      },
    })

    // Broadcast the new expense to everyone viewing this group
    const io = (global as any).io

    if (io) {
      io.to(`group:${group.id}`).emit("expense:added", {
        expense,
        addedBy: user.name,
      })

      console.log(
        `[Socket] Broadcasted to group:${group.id}`
      )
    }

    return NextResponse.json(expense)
  } catch (error: any) {
    console.error("Expense error:", error)

    return NextResponse.json(
      { error: error?.message ?? "Something went wrong" },
      { status: 500 }
    )
  }
}
