import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateUser } from "@/lib/local-store";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        return authenticateUser(credentials.email as string, credentials.password as string);
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/en/auth/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
  secret: process.env.AUTH_SECRET || "local-development-secret-change-me",
});
