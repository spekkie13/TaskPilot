// app/billing/BillingPageClient.tsx
'use client'

import { useEffect, useState } from 'react'
import useSWR                  from 'swr'
import { loadStripe }          from '@stripe/stripe-js'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type BillingStatus = { hasSubscription: boolean; status: string }

type Props = {
    success?: string
    canceled?: string
}

export default function BillingPageClient({ success, canceled }: Props) {
    // 1) SWR with no fallbackData
    const { data, error, mutate } = useSWR<BillingStatus>(
        '/api/subscription',
        fetcher
    )

    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [cancelLoading, setCancelLoading]     = useState(false)
    const [msg, setMsg]                         = useState<string | null>(null)
    const stripePromise = loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )

    // 2) Immediate UI override on success/cancel
    useEffect(() => {
        if (success) {
            setMsg('🎉 Subscription successful!')
            // override cache to "active" immediately
            mutate({ hasSubscription: true, status: 'active' }, false)
            // then revalidate after a short delay to pick up webhook/DB
            setTimeout(() => mutate(), 2000)
        }
        if (canceled) {
            setMsg('⚠️ Subscription cancelled.')
            // override cache to "free"
            mutate({ hasSubscription: false, status: 'free' }, false)
        }
    }, [success, canceled, mutate])

    // 3) Upgrade handler
    const handleSubscribe = async () => {
        setMsg(null)
        setCheckoutLoading(true)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID }),
            })
            const { url } = await res.json()
            if (url) window.location.href = url
            else setMsg('❌ Failed to start checkout.')
        } catch {
            setMsg('❌ Network error.')
        } finally {
            setCheckoutLoading(false)
        }
    }

    // 4) Cancel handler
    const handleCancel = async () => {
        setMsg(null)
        setCancelLoading(true)
        try {
            const res = await fetch('/api/stripe/subscription/cancel', { method: 'POST' })
            const payload = await res.json()
            if (res.ok) {
                setMsg('✅ Subscription cancelled.')
                // override cache to "free" immediately
                mutate({ hasSubscription: false, status: 'free' }, false)
            } else {
                setMsg(payload.error || '❌ Could not cancel subscription.')
            }
        } catch {
            setMsg('❌ Network error.')
        } finally {
            setCancelLoading(false)
        }
    }

    // 5) Render
    if (error)
        return <p className="p-6 text-red-600">Error loading billing data.</p>
    if (!data) return <p className="p-6">Loading billing info…</p>

    return (
        <div className="p-6 max-w-lg mx-auto space-y-6">
            <h1 className="text-2xl font-bold">Billing & Subscription</h1>
            {msg && <p className="text-green-600">{msg}</p>}

            {data.hasSubscription && data.status === 'active' ? (
                <div className="space-y-2">
                    <p>You’re on <strong>TaskPilot Pro</strong> (status: {data.status}).</p>
                    <button
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded"
                    >
                        {cancelLoading ? 'Cancelling…' : 'Cancel Subscription'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p>You’re currently on the <strong>Free</strong> plan.</p>
                    <button
                        onClick={handleSubscribe}
                        disabled={checkoutLoading}
                        className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                        {checkoutLoading
                            ? 'Redirecting…'
                            : 'Upgrade to Pro — $10/month'}
                    </button>
                </div>
            )}
        </div>
    )
}
