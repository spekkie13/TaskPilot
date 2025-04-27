// app/api/subscription/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { getServerSession }         from 'next-auth/next'
import { authOptions }              from '../../../../lib/auth'
import { prisma }                   from '../../../../lib/prisma'
import { stripe }                   from '../../../../lib/stripe'

export async function GET(request: NextRequest) {
    // 1) Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const email = session.user.email

    // 2) Fast path: check your DB for an active subscription
    const subDB = await prisma.subscription.findFirst({
        where: { user: { email }, status: 'active' },
    })
    if (subDB) {
        return NextResponse.json({
            hasSubscription:    true,
            subscriptionId:     subDB.stripeSubscriptionId,
            status:             subDB.status,
        })
    }

    // 3) Fallback: look up the customer in Stripe
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
        return NextResponse.json({ hasSubscription: false, status: 'free' })
    }
    const cust = customers.data[0]

    // 4) Fetch active subscriptions for that customer
    const activeList = await stripe.subscriptions.list({
        customer: cust.id,
        status:   'active',
        limit:    1,
    })
    if (activeList.data.length === 0) {
        return NextResponse.json({ hasSubscription: false, status: 'free' })
    }
    const stripeSub = activeList.data[0]

    // 5) Upsert into your DB by userId (1-to-1)
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
        await prisma.subscription.upsert({
            where: { userId: user.id },            // ← unique on userId
            create: {
                userId:               user.id,
                stripeCustomerId:     cust.id,
                stripeSubscriptionId: stripeSub.id,
                status:               stripeSub.status,
            },
            update: {
                stripeCustomerId:     cust.id,
                stripeSubscriptionId: stripeSub.id,
                status:               stripeSub.status,
            },
        })
    }

    // 6) Return the Stripe‐driven result
    return NextResponse.json({
        hasSubscription:    true,
        subscriptionId:     stripeSub.id,
        status:             stripeSub.status,
    })
}
