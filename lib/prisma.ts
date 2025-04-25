// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
    // to prevent multiple instances in dev
    var prisma: PrismaClient | undefined
}

export const prisma =
    global.prisma ||
    new PrismaClient({
        log: ['query', 'error'], // optional: helps debug
    })

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
}
