// pages/api/protected.ts
import { getSession } from 'next-auth/react'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const session = await getSession({ req })
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    // ...your protected logic
    res.status(200).json({ message: 'Hello, ' + session.user?.email })
}
