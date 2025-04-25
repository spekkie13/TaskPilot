// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
    try {
        console.log(process.env.DATABASE_URL)
        const users = await prisma.user.findMany()
        return NextResponse.json({ users })
    } catch (err: any) {
        console.error('test-db error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
