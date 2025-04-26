// app/api/stripe/subscription/cancel/route.ts
import { NextResponse } from 'next/server'
import { stripe }              from '../../../../../../lib/stripe'
import { getServerSession }    from 'next-auth/next'
import { authOptions }         from '../../../../../../lib/auth'
import { prisma }              from '../../../../../../lib/prisma'

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Look up the user's DB record (if any)
    const sub = await prisma.subscription.findFirst({
        where: { user: { email: session.user.email } },
    })
    if (!sub) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // 2) Cancel it in Stripe (immediate cancel)
    try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (err) {
        console.error('Stripe cancellation error', err)
    }

    // 3) Mark it canceled in your DB
    await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'canceled' },
    })

    return NextResponse.json({ status: 'canceled' })
}
