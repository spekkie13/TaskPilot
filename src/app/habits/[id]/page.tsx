// app/habits/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HabitDetailPage() {
    const { id } = useParams<{ id: string }>()       // grabs [id]
    const router = useRouter()
    const { data: habit, error, mutate } = useSWR(
        id ? `/api/habits/${encodeURIComponent(id)}` : null,
        fetcher
    )

    const [title, setTitle] = useState('')
    const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    // Populate form when habit loads
    useEffect(() => {
        if (habit) {
            setTitle(habit.title)
            setFrequency(habit.frequency)
        }
    }, [habit])

    // Handle updating the habit
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMsg(null)

        const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, frequency }),
        })

        if (res.ok) {
            await mutate()
            setMsg('✅ Saved successfully!')
            setTimeout(() => router.push('/habits'), 800)
        } else {
            const data = await res.json()
            setMsg(data.error || '❌ Error saving habit')
        }

        setSaving(false)
    }

    // Handle deleting the habit
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this habit?')) return

        setDeleting(true)
        setMsg(null)

        const res = await fetch(`/api/habits/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        })

        if (res.ok) {
            router.push('/habits')
        } else {
            const data = await res.json()
            setMsg(data.error || '❌ Error deleting habit')
            setDeleting(false)
        }
    }

    if (error) return <p className="p-4 text-red-600">Error loading habit.</p>
    if (!habit) return <p className="p-4">Loading…</p>

    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Habit</h1>

            <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block mb-1 font-medium">Title</label>
                    <input
                        type="text"
                        className="w-full border px-3 py-2 rounded"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        disabled={saving || deleting}
                    />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Frequency</label>
                    <select
                        className="w-full border px-3 py-2 rounded"
                        value={frequency}
                        onChange={e => setFrequency(e.target.value as any)}
                        disabled={saving || deleting}
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>
                </div>

                {msg && <p className="text-green-600">{msg}</p>}

                <div className="flex space-x-2">
                    <button
                        type="submit"
                        disabled={saving || deleting}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>

                    <button
                        type="button"
                        onClick={() => router.push('/habits')}
                        disabled={saving || deleting}
                        className="px-4 py-2 border rounded"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving || deleting}
                        className="px-4 py-2 bg-red-600 text-white rounded"
                    >
                        {deleting ? 'Deleting…' : 'Delete Habit'}
                    </button>
                </div>
            </form>
        </div>
    )
}
