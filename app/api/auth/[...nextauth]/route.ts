import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
// import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaAdapter } from "@next-auth/prisma-adapter"  // 👈 changed
import { prisma } from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id
      }
      return session
    },
  },
  session: {
    strategy: "database",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }