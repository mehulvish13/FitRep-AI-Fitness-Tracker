import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { verifyPassword } from "@/lib/auth-password";

const prisma = new PrismaClient();

export const authOptions = {
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordSalt: true,
            passwordIv: true,
            passwordHash: true,
          },
        });

        if (!user) return null;

        const isValid = verifyPassword(password, {
          passwordSalt: user.passwordSalt,
          passwordIv: (user as any).passwordIv,
          passwordHash: user.passwordHash,
        });

        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/landing",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
