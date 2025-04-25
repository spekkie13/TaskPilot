'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HabitsPage() {
    const router = useRouter()
    const { data: habits, error, mutate } = useSWR('/api/habits', fetcher)

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this habit?')) return
        await fetch(`/api/habits/${id}`, { method: 'DELETE' })
        mutate()
    }

    if (error) return <p className="p-4 text-red-600">Failed to load habits.</p>
    if (!habits) return <p className="p-4">Loading...</p>

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Your Habits</h1>
                <Link href="/habits/new">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded">+ New Habit</button>
                </Link>
            </div>
            <ul className="space-y-4">
                {habits.map((habit: any) => (
                    <li key={habit.id} className="flex justify-between p-4 border rounded">
                        <Link href={`/habits/${habit.id}`}>
                            <span className="text-lg">{habit.title}</span>
                        </Link>
                        <button
                            onClick={() => handleDelete(habit.id)}
                            className="text-red-600 hover:underline"
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
