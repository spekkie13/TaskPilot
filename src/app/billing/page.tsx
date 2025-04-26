// app/billing/page.tsx
export const dynamic = 'force-dynamic'

import BillingPageClient    from './BillingPageClient'

interface Props {
    searchParams: Promise<{
        success?: string
        canceled?: string
    }>
}

export default async function BillingPage({ searchParams }: Props) {
    const { success, canceled } = await searchParams

    return (
        <BillingPageClient
            success={success}
            canceled={canceled}
        />
    )
}
