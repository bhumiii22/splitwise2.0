import { getUserFromCookies } from "@/lib/get-user"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
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

    const member = group.members.find(
      (m) => m.userId === user.id
    )

    if (!member) {
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
      member.role === "admin" ||
      group.createdById === user.id

    const canDelete =
      expense.paidById === user.id ||
      isAdmin

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "Only the expense payer or group admin can delete this expense",
        },
        { status: 403 }
      )
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    const io = (global as any).io

    if (io) {
      io.to(`group:${id}`).emit("expense:deleted", {
        expenseId,
        deletedBy: user.name ?? user.email,
      })
    }

    return NextResponse.json({
      success: true,
      expenseId,
    })
  } catch (error: any) {
    console.error("Expense deletion error:", error)

    return NextResponse.json(
      {
        error:
          error?.message ??
          "Something went wrong while deleting the expense",
      },
      { status: 500 }
    )
  }
}