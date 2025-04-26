// app/api/subscription/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession }    from 'next-auth/next'
import { authOptions }         from '../../../../lib/auth'
import { prisma }              from '../../../../lib/prisma'
import { stripe }              from '../../../../lib/stripe'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const email = session.user.email

    // 1) Check your DB for an *active* subscription
    const subDB = await prisma.subscription.findFirst({
        where: { user: { email }, status: 'active' },
    })
    if (subDB) {
        return NextResponse.json({
            hasSubscription: true,
            status: subDB.status,
        })
    }

    // 2) Otherwise ask Stripe directly for any *active* subs
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) {
        return NextResponse.json({ hasSubscription: false, status: 'free' })
    }
    const cust = customers.data[0]

    const activeSubs = await stripe.subscriptions.list({
        customer: cust.id,
        status:   'active',
        limit:    1,
    })
    if (!activeSubs.data.length) {
        return NextResponse.json({ hasSubscription: false, status: 'free' })
    }
    // if there is an active subscription in Stripe:
    return NextResponse.json({
        hasSubscription: true,
        status: activeSubs.data[0].status,
    })
}
