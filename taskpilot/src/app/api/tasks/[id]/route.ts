// app/api/tasks/[id]/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    // 1) Pull out the task ID
    let { id } = await context.params
    id = decodeURIComponent(id)
    console.log('🕵️ Fetching task with id:', id)

    // 2) Check the user session
    const session = await getServerSession(authOptions)
    console.log(session?.user?.email)
    if (!session?.user?.email) {
        console.warn('⛔️ Unauthorized: no session')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('👤 Session user email:', session.user.email)
    const firstTask = await prisma.taskInstance.findFirst({
        include: {
            habit: {
                include: {
                    user: true
                }
            }
        }
    })
    console.log('first task email: ', firstTask?.habit?.user?.email)
    // 3) Try to find the task *and* ensure it belongs to this user
    const task = await prisma.taskInstance.findFirst({
        where: {
            id,
            habit: {
                user: {
                    email: session.user.email,
                },
            },
        },
        include: {
            habit: true,    // so we can show habit.title
        },
    })
    console.log('found task: ', task)
    if (!task) {
        console.warn('🔍 Task not found or not owned by user')
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    // 4) Return the task
    return NextResponse.json(task)
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    let { id } = await context.params
    id = decodeURIComponent(id)
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark it completed (only if it belongs to this user)
    const updated = await prisma.taskInstance.updateMany({
        where: {
            id,
            habit: { user: { email: session.user.email } },
        },
        data: { isCompleted: true },
    })
    if (updated.count === 0) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    // Log it
    await prisma.completionLog.create({
        data: {
            user: { connect: { email: session.user.email } },
            taskInstance: { connect: { id } },
        },
    })

    // Return the freshly updated task
    const task = await prisma.taskInstance.findUnique({
        where: { id },
        include: { habit: true },
    })
    return NextResponse.json(task)
}
