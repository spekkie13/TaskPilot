// pages/api/auth/[...nextauth].ts

import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default NextAuth({
    // Use the Prisma adapter to persist users/sessions in your database
    adapter: PrismaAdapter(prisma),

    // Configure one or more authentication providers
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
        EmailProvider({
            server: {
                host: process.env.EMAIL_SERVER_HOST!,
                port: Number(process.env.EMAIL_SERVER_PORT!),
                auth: {
                    user: process.env.EMAIL_SERVER_USER!,
                    pass: process.env.EMAIL_SERVER_PASS!,
                },
            },
            from: process.env.EMAIL_FROM!,
        }),
    ],

    // A secret for encrypting tokens, sessions, etc.
    secret: process.env.NEXTAUTH_SECRET,

    // Optional: customize pages (e.g. signIn, verifyRequest)
    // pages: {
    //   signIn: '/auth/signin',
    //   verifyRequest: '/auth/verify-request',
    // },

    // Optional: callbacks for controlling JWT/session contents
    // callbacks: {
    //   async session({ session, user }) {
    //     session.user.id = user.id
    //     return session
    //   },
    // },
})
