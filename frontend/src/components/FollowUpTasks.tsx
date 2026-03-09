import { useState, useEffect } from 'react'
import { apiGet, apiPatch } from '../services/apiService'
import {
  PAGE_CONTENT,
  PAGE_TITLE,
  CARD,
  CARD_SM_PADDING,
  FILTER_PILL_ACTIVE,
  FILTER_PILL_INACTIVE,
  EMPTY_STATE,
  EMPTY_TITLE,
} from '../styles/designSystem'

interface FollowUpTasksProps {
  onLogout: () => void
  onBack: () => void
  userName: string
  onNavigate: (page: string) => void
}

interface Task {
  id: number
  dcr_id: number | null
  user_id: string
  doctor_name: string
  task: string
  due_date: string | null
  status: 'pending' | 'completed' | 'overdue'
  created_at: string
}

function FollowUpTasks({ onLogout: _onLogout, onBack: _onBack, userName: _userName, onNavigate: _onNavigate }: FollowUpTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('pending')

  const userId = localStorage.getItem('userId') || 'mr_robert_003'

  useEffect(() => {
    fetchTasks()
  }, [filter])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const statusParam = filter !== 'all' ? `&status=${filter}` : ''
      const data = await apiGet(`/tasks?user_id=${userId}${statusParam}`)
      setTasks(data.data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await apiPatch(`/tasks/${task.id}`, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date()
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className={PAGE_CONTENT}>
      <h2 className={`${PAGE_TITLE} mb-6`}>Follow-Up Tasks</h2>

      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'completed', 'overdue'] as const).map(f => (
          <button
            key={f}
            className={filter === f ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className={EMPTY_STATE}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className={EMPTY_TITLE}>No {filter !== 'all' ? filter : ''} tasks found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className={`${CARD} ${CARD_SM_PADDING} flex items-start gap-3`}>
              <div
                className="w-5 h-5 mt-0.5 shrink-0 cursor-pointer"
                onClick={() => handleToggleStatus(task)}
              >
                {task.status === 'completed' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="4" fill="#10b981" />
                    <path d="M8 12L11 15L17 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="#cbd5e1" strokeWidth="2" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm text-slate-700 ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                  {task.task}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500">{task.doctor_name}</span>
                  <span className={`text-xs ${isOverdue(task) ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                    {formatDate(task.due_date)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FollowUpTasks
