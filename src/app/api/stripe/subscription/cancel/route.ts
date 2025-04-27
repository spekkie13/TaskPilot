// app/api/stripe/subscription/cancel/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession }         from 'next-auth/next'
import { authOptions }              from '../../../../../../lib/auth'
import { stripe }                   from '../../../../../../lib/stripe'
import { prisma }                   from '../../../../../../lib/prisma'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Look up your record
    const sub = await prisma.subscription.findFirst({
        where: { user: { email: session.user.email } },
    })
    if (!sub) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // 2) Cancel in Stripe
    try {
        await stripe.subscriptions.cancel(sub.stripeSubscriptionId)
    } catch (err) {
        console.error('Stripe cancellation error', err)
        return NextResponse.json({ error: 'Stripe API error' }, { status: 500 })
    }

    // 3) Mark canceled locally
    await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'canceled' },
    })

    return NextResponse.json({ status: 'canceled' })
}
