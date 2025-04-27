// app/api/stripe/webhook/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { stripe }                  from '../../../../../lib/stripe'
import { prisma }                  from '../../../../../lib/prisma'
import { Buffer }                  from 'buffer'
import Stripe from "stripe";

// Disable Next.js body parsing so we can verify the signature
export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature')!
    const buf = Buffer.from(await req.arrayBuffer())

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(
            buf,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error('Webhook signature failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const sess = event.data.object as any
            const subId   = sess.subscription      as string
            const custId  = sess.customer          as string
            const email   = sess.metadata.userEmail as string

            // 1) lookup your user
            const user = await prisma.user.findUnique({ where: { email } })
            if (!user) {
                console.warn('⚠️ No user for email', email)
                break
            }

            // 2) upsert by userId, *not* stripeSubscriptionId
            await prisma.subscription.upsert({
                where: { userId: user.id },            // <- unique key is now userId
                create: {
                    userId:               user.id,       // set the FK directly
                    stripeCustomerId:     custId,
                    stripeSubscriptionId: subId,
                    status:               'active',
                },
                update: {
                    stripeCustomerId:     custId,        // update in case changed
                    stripeSubscriptionId: subId,
                    status:               'active',
                },
            })
            console.log('✅ Synced subscription for user', user.id, '→', subId)
            break
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: sub.id },
                data: { status: 'canceled' },
            })
            console.log('🗑️ Subscription canceled:', sub.id)
            break
        }

        case 'invoice.payment_failed': {
            const inv       = event.data.object as any
            const subId     = inv.subscription as string
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subId },
                data: { status: 'past_due' },
            })
            console.log('⚠️ Payment failed, marked past_due:', subId)
            break
        }

        default:
            console.warn(`Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
