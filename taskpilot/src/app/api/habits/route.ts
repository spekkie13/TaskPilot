// app/api/habits/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habits = await prisma.habit.findMany({
        where: { user: { email: session.user.email } },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(habits)
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, frequency } = body
    if (!title || !frequency) {
        return NextResponse.json(
            { error: 'Missing title or frequency' },
            { status: 400 }
        )
    }

    const newHabit = await prisma.habit.create({
        data: {
            title,
            frequency,
            user: { connect: { email: session.user.email } },
        },
    })
    return NextResponse.json(newHabit, { status: 201 })
}
