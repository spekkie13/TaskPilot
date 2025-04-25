'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewHabitPage() {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [frequency, setFrequency] = useState('daily')
    const [error, setError] = useState<string|null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const res = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, frequency }),
        })

        if (res.ok) {
            router.push('/habits')
        } else {
            const data = await res.json()
            setError(data.error || 'An unexpected error occurred')
        }

        setLoading(false)
    }

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Create New Habit</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        className="w-full border px-3 py-2 rounded"
                    />
                </div>
                <div>
                    <label className="block mb-1">Frequency</label>
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>
                {error && <p className="text-red-600">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded"
                >
                    {loading ? 'Creating…' : 'Create Habit'}
                </button>
            </form>
        </div>
    )
}
