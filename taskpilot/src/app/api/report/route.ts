// app/api/report/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import nodemailer from 'nodemailer'

// Read env
const {
    EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER,
    EMAIL_SERVER_PASS,
    EMAIL_FROM,
    REPORT_SECRET
} = process.env

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    host: EMAIL_SERVER_HOST,
    port: Number(EMAIL_SERVER_PORT),
    secure: false,               // use TLS
    auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASS,
    },
})

export async function GET(request: Request) {
    try {
        console.log('📬  /api/report called')

        // 1) Secret header check (optional but recommended)
        if (REPORT_SECRET) {
            const provided = request.headers.get('x-report-secret')
            if (provided !== REPORT_SECRET) {
                console.warn('⛔️ Unauthorized report call')
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        // 2) Compute one-week window
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        // 3) Fetch users + their habits + logs
        const users = await prisma.user.findMany({
            where: { email: { not: null } },
            include: {
                habits: true,
                logs: {
                    where: { completedAt: { gte: weekAgo } },
                    include: { taskInstance: { include: { habit: true } } },
                },
            },
        })
        console.log(`Found ${users.length} users to report on`)

        // 4) Loop & send
        for (const user of users) {
            if (!user.email) continue
            console.log(`➤ Reporting for ${user.email}, ${user.logs.length} logs`)

            // Count completions per habit
            const counts: Record<string, number> = {}
            for (const log of user.logs) {
                const h = log.taskInstance.habit
                counts[h.id] = (counts[h.id] || 0) + 1
            }

            // Build email HTML
            const items = user.habits
                .map(habit =>
                    `<li><strong>${habit.title}</strong>: ${counts[habit.id] || 0} completions</li>`
                )
                .join('')
            const html = `
        <p>Hi ${user.name ?? ''},</p>
        <p>Here’s your weekly habit summary:</p>
        <ul>${items}</ul>
        <p>Keep up the great work!</p>
      `

            // Send via Nodemailer
            await transporter.sendMail({
                from: EMAIL_FROM,
                to: user.email,
                subject: 'Your Weekly Habit Report',
                html,
            })
            console.log('Mail sent to', user.email)
        }

        return NextResponse.json({ status: 'reports sent' })
    } catch (err: any) {
        console.error('❌ /api/report error:', err)
        return NextResponse.json(
            { error: err.message || 'Unknown error' },
            { status: 500 }
        )
    }
}
