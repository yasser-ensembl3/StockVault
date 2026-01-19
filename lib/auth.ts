import { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/documents.readonly"
          ].join(" ")
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      console.log("[NextAuth] JWT callback triggered", { hasAccount: !!account })
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        console.log("[NextAuth] JWT callback - Added tokens to JWT", { provider: account.provider })
      }
      return token
    },
    async session({ session, token }) {
      console.log("[NextAuth] Session callback triggered")
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.provider = token.provider as string
      console.log("[NextAuth] Session callback - Session created", {
        user: session.user?.email,
        provider: token.provider
      })
      return session
    }
  },
  pages: {
    signIn: "/auth/signin"
  },
  debug: true
}
