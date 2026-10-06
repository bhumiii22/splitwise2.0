import { getUserFromCookies } from "@/lib/get-user"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string
      expenseId: string
    }>
  }
) {
  try {
    const { id, expenseId } = await params

    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()

    const {
      title,
      amount,
      category,
      splitType,
      paidById,
      shares,
    } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const parsedAmount = Number(amount)

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return NextResponse.json(
        { error: "Valid amount required" },
        { status: 400 }
      )
    }

    if (
      !["equal", "percentage", "exact"].includes(
        splitType
      )
    ) {
      return NextResponse.json(
        { error: "Invalid split type" },
        { status: 400 }
      )
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: true,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      )
    }

    const currentMember = group.members.find(
      (member) => member.userId === user.id
    )

    if (!currentMember) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      )
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense || expense.groupId !== id) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    const isAdmin =
      currentMember.role === "admin" ||
      group.createdById === user.id

    const canEdit =
      expense.paidById === user.id ||
      isAdmin

    if (!canEdit) {
      return NextResponse.json(
        {
          error:
            "Only the expense payer or group admin can edit this expense",
        },
        { status: 403 }
      )
    }

    const validPayer = group.members.some(
      (member) => member.userId === paidById
    )

    if (!validPayer) {
      return NextResponse.json(
        { error: "Invalid payer" },
        { status: 400 }
      )
    }

    let splitRows: {
      userId: string
      amount: number
      isSettled: boolean
    }[] = []

    if (splitType === "equal") {
      const equalShare =
        parsedAmount / group.members.length

      splitRows = group.members.map((member) => ({
        userId: member.userId,
        amount: equalShare,
        isSettled: member.userId === paidById,
      }))
    }

    if (splitType === "percentage") {
      if (!shares || typeof shares !== "object") {
        return NextResponse.json(
          { error: "Percentage splits are required" },
          { status: 400 }
        )
      }

      const percentages = group.members.map(
        (member) => Number(shares[member.userId]) || 0
      )

      const percentageTotal = percentages.reduce(
        (sum, value) => sum + value,
        0
      )

      if (
        Math.abs(percentageTotal - 100) > 0.01
      ) {
        return NextResponse.json(
          {
            error:
              "Percentages must add up to 100%",
          },
          { status: 400 }
        )
      }

      splitRows = group.members.map(
        (member, index) => ({
          userId: member.userId,
          amount:
            parsedAmount *
            (percentages[index] / 100),
          isSettled:
            member.userId === paidById,
        })
      )
    }

    if (splitType === "exact") {
      if (!shares || typeof shares !== "object") {
        return NextResponse.json(
          { error: "Exact splits are required" },
          { status: 400 }
        )
      }

      const exactAmounts = group.members.map(
        (member) =>
          Number(shares[member.userId]) || 0
      )

      const exactTotal = exactAmounts.reduce(
        (sum, value) => sum + value,
        0
      )

      if (
        Math.abs(exactTotal - parsedAmount) > 0.01
      ) {
        return NextResponse.json(
          {
            error: `Exact shares must add up to ${parsedAmount.toFixed(
              2
            )}`,
          },
          { status: 400 }
        )
      }

      splitRows = group.members.map(
        (member, index) => ({
          userId: member.userId,
          amount: exactAmounts[index],
          isSettled:
            member.userId === paidById,
        })
      )
    }

    const updatedExpense =
      await prisma.$transaction(async (tx) => {
        await tx.expense.update({
          where: { id: expenseId },
          data: {
            title: title.trim(),
            amount: parsedAmount,
            category: category ?? "general",
            splitType,
            paidById,
          },
        })

        await tx.expenseSplit.deleteMany({
          where: {
            expenseId,
          },
        })

        await tx.expenseSplit.createMany({
          data: splitRows.map((split) => ({
            expenseId,
            userId: split.userId,
            amount: split.amount,
            isSettled: split.isSettled,
          })),
        })

        return tx.expense.findUnique({
          where: { id: expenseId },
          include: {
            paidBy: true,
            splits: {
              include: {
                user: true,
              },
            },
          },
        })
      })

    const io = (global as any).io

    if (io && updatedExpense) {
      io.to(`group:${id}`).emit(
        "expense:updated",
        {
          expense: updatedExpense,
          updatedBy: user.name ?? user.email,
        }
      )
    }

    return NextResponse.json(updatedExpense)
  } catch (error: any) {
    console.error("Expense update error:", error)

    return NextResponse.json(
      {
        error:
          error?.message ??
          "Something went wrong while updating the expense",
      },
      { status: 500 }
    )
  }
}