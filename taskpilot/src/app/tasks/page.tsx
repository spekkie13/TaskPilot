'use client'

import useSWR from 'swr'
import Link from 'next/link'

const fetcher = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        const err = new Error(`Error fetching ${url}: ${res.statusText}`)
        ;(err as any).status = res.status
        throw err
    }
    return res.json()
}

export default function TasksPage() {
    const { data: tasks, error } = useSWR('/api/schedule', fetcher)

    // 1) Loading / error states
    if (error) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <p className="text-red-600">Failed to load tasks: {error.message}</p>
            </div>
        )
    }
    if (!tasks) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <p>Loading tasks…</p>
            </div>
        )
    }

    // 2) Quick sanity‐check in the console
    console.log('🏷️ tasks from /api/schedule:', tasks)

    // 3) No tasks
    if (!Array.isArray(tasks) || tasks.length === 0) {
        return (
            <div className="p-6 max-w-2xl mx-auto">
                <p>No tasks scheduled for the next 7 days.</p>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Upcoming Tasks</h1>
            <ul className="space-y-4">
                {tasks.map((task: any) => {
                    // safe‐access habit
                    const habitTitle = task.habit?.title ?? '<no habit>'
                    const when = new Date(task.scheduledAt).toLocaleString()

                    return (
                        <li
                            key={task.id}
                            className="flex justify-between items-center p-4 border rounded"
                        >
                            <div>
                                <p className="font-semibold">{when}</p>
                                <p className="text-gray-700">{habitTitle}</p>
                            </div>
                            <Link href={`/tasks/${task.id}`}>
                                <button className="px-3 py-1 bg-blue-600 text-white rounded">
                                    View
                                </button>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
