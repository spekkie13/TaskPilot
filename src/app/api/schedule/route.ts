// app/api/schedule/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// Helper: build dates from now → +7 days at daily/weekly intervals
function getDates(start: Date, end: Date, freq: 'daily' | 'weekly') {
    const dates: Date[] = []
    const step = freq === 'daily' ? 1 : 7
    const cur = new Date(start)
    while (cur <= end) {
        dates.push(new Date(cur))
        cur.setDate(cur.getDate() + step)
    }
    return dates
}

export async function GET(request: Request) {
    // 1) Auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Load user’s habits
    const habits = await prisma.habit.findMany({
        where: { user: { email: session.user.email } },
    })

    // 3) Upsert TaskInstances for next 7 days
    const now = new Date()
    const weekOut = new Date(now)
    weekOut.setDate(now.getDate() + 7)

    for (const habit of habits) {
        const dates = getDates(now, weekOut, habit.frequency as 'daily' | 'weekly')
        for (const scheduledAt of dates) {
            const id = `${habit.id}::${scheduledAt.toISOString()}`
            await prisma.taskInstance.upsert({
                where: { id },
                create: {
                    id,
                    habit: { connect: { id: habit.id } },
                    scheduledAt,
                },
                update: {},
            })
        }
    }

    // 4) Return tasks including their habit data
    const tasks = await prisma.taskInstance.findMany({
        where: {
            habit: { user: { email: session.user.email } },
            scheduledAt: { gte: now, lte: weekOut },
        },
        include: { habit: true },
        orderBy: { scheduledAt: 'asc' },
    })

    return NextResponse.json(tasks)
}
