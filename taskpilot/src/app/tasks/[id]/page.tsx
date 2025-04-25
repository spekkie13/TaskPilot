'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useParams, useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TaskDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { data: task, error, mutate } = useSWR(
        id ? `/api/tasks/${id}` : null,
        fetcher
    )

    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [loadingAI, setLoadingAI] = useState(false)

    // Auto-generate AI “Next Action” if it’s still null
    useEffect(() => {
        if (task && task.nextAction === null && !loadingAI) {
            setLoadingAI(true)
            fetch(`/api/next-action/${task.id}`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    // merge the new nextAction into our SWR cache without revalidation
                    mutate({ ...task, nextAction: data.nextAction }, false)
                })
                .finally(() => setLoadingAI(false))
        }
    }, [task, loadingAI, mutate])

    if (error) return <p className="p-4 text-red-600">Error loading task.</p>
    if (!task) return <p className="p-4">Loading…</p>

    const handleComplete = async () => {
        setLoading(true)
        setMsg(null)
        const res = await fetch(`/api/tasks/${id}`, { method: 'POST' })
        if (res.ok) {
            await mutate()
            setMsg('✅ Marked complete!')
        } else {
            const data = await res.json()
            setMsg(data.error || 'Error completing task')
        }
        setLoading(false)
    }

    return (
        <div className="p-6 max-w-md mx-auto space-y-4">
            <h1 className="text-2xl font-bold">{task.habit.title}</h1>
            <p>
                <span className="font-semibold">Scheduled:</span>{' '}
                {new Date(task.scheduledAt).toLocaleString()}
            </p>
            <p>
                <span className="font-semibold">Next action:</span>{' '}
                {loadingAI
                    ? 'Thinking… 🤖'
                    : task.nextAction ?? 'No AI step generated yet'}
            </p>
            {msg && <p className="text-green-600">{msg}</p>}
            {!task.isCompleted ? (
                <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                    {loading ? 'Completing…' : 'Done'}
                </button>
            ) : (
                <p className="text-gray-600">✅ You completed this task.</p>
            )}
            <button
                onClick={() => router.push('/tasks')}
                className="mt-4 px-4 py-2 bg-gray-200 rounded"
            >
                ← Back to Tasks
            </button>
        </div>
    )
}
