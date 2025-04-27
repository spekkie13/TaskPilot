// app/api/habits/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

// @ts-ignore
export async function GET(request: NextRequest, { params }) {
    const rawId = params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const habit = await prisma.habit.findFirst({
        where: { id, user: { email: session.user.email } },
    })
    if (!habit) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }
    return NextResponse.json(habit)
}

// @ts-ignore
export async function PUT(request: NextRequest, { params }) {
    const rawId = params.id
    const id = Array.isArray(rawId) ? rawId[0] : rawId

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
        where: { id, user: { email: session.user.email } },
        data: { ...(title && { title }), ...(frequency && { frequency }) },
    })
    if (result.count === 0) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    const updated = await prisma.habit.findUnique({ where: { id } })
    return NextResponse.json(updated)
}

// @ts-ignore
export async function DELETE(request: NextRequest, { params }) {
    const rawId = await params.id
    let id = Array.isArray(rawId) ? rawId[0] : rawId
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.habit.delete({
        where: { id: rawId },
    })

    return new NextResponse(null, { status: 200 })
}
