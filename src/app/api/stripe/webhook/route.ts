// app/api/stripe/webhook/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { stripe } from '../../../../../lib/stripe'
import { prisma } from '../../../../../lib/prisma'
import { Buffer } from 'buffer'

export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
    const sig = request.headers.get('stripe-signature')!
    const arrayBuffer = await request.arrayBuffer()
    const rawBody = Buffer.from(arrayBuffer)

    let event
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const sess = event.data.object as any
            await prisma.subscription.upsert({
                where: { stripeCustomerId: sess.customer as string },
                update: {
                    stripeSubscriptionId: sess.subscription as string,
                    status: 'active',
                },
                create: {
                    user: { connect: { email: sess.metadata.userEmail as string } },
                    stripeCustomerId: sess.customer as string,
                    stripeSubscriptionId: sess.subscription as string,
                    status: 'active',
                },
            })
            console.log('✅ checkout.session.completed handled')
            break
        }
        case 'invoice.payment_failed': {
            const invoice = event.data.object as any
            const subscriptionId: string = invoice.subscription
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: { status: 'past_due' },
            })
            console.log('⚠️ invoice.payment_failed handled')
            break
        }
        case 'customer.subscription.deleted': {
            const sub = event.data.object as any
            await prisma.subscription.updateMany({
                where: { stripeSubscriptionId: sub.id as string },
                data: { status: 'canceled' },
            })
            console.log('🗑️ customer.subscription.deleted handled')
            break
        }
        default:
            console.warn(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
}
