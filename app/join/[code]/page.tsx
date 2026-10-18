import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect(`/signin?callbackUrl=/join/${code}`)
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect("/signin")
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode: code },
  })

  if (!group) {
    redirect("/dashboard")
  }

  const existing = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
  })

  if (!existing) {
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        role: "member",
      },
    })
  }

  redirect(`/group/${group.id}`)
}

