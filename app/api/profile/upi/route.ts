
import { NextResponse } from "next/server"
import { getUserFromCookies } from "@/lib/get-user"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const user = await getUserFromCookies()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { upiId } = await req.json()

    if (!upiId || !upiId.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid UPI ID" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        upiId: upiId.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      upiId: upiId.trim(),
    })
  } catch (error) {
    console.error("UPI update error:", error)

    return NextResponse.json(
      { error: "Failed to save UPI ID" },
      { status: 500 }
    )
  }
}