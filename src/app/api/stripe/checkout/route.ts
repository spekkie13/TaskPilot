// app/api/stripe/checkout/route.ts
import { NextResponse, NextRequest } from 'next/server'
import { stripe }              from '../../../../../lib/stripe'
import { getServerSession }    from 'next-auth/next'
import { authOptions }         from '../../../../../lib/auth'

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await req.json()
    const checkout = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: session.user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
        cancel_url:  `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
        metadata: { userEmail: session.user.email },
    })

    return NextResponse.json({ url: checkout.url })
}
