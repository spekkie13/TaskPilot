// app/api/habits/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habit = await prisma.habit.findFirst({
        where: {
            id: params.id,
            user: { email: session.user.email },
        },
    })
    if (!habit) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }
    return NextResponse.json(habit)
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, frequency } = body
    if (!title && !frequency) {
        return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const result = await prisma.habit.updateMany({
        where: {
            id: params.id,
            user: { email: session.user.email },
        },
        data: {
            ...(title ? { title } : {}),
            ...(frequency ? { frequency } : {}),
        },
    })

    if (result.count === 0) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const updated = await prisma.habit.findUnique({
        where: { id: params.id },
    })
    return NextResponse.json(updated)
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await prisma.habit.deleteMany({
        where: {
            id: params.id,
            user: { email: session.user.email },
        },
    })

    if (result.count === 0) {
        return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    return NextResponse.json(null, { status: 204 })
}
