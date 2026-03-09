import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { apiGet, apiPatch } from '../services/apiService'
import './FollowUpTasks.css'

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

function FollowUpTasks({ onLogout, onBack, userName, onNavigate }: FollowUpTasksProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
    <div className="followup-tasks-page">
      <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} onNavigateHome={onBack} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} userName={userName} onNavigate={onNavigate} onLogout={onLogout} currentPage="follow-up-tasks" />

      <main className="followup-tasks-content">
        <div className="tasks-filter-bar">
          {(['all', 'pending', 'completed', 'overdue'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="tasks-loading">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="tasks-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>No {filter !== 'all' ? filter : ''} tasks found</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map(task => (
              <div key={task.id} className={`task-card ${task.status} ${isOverdue(task) ? 'overdue' : ''}`}>
                <div className="task-checkbox" onClick={() => handleToggleStatus(task)}>
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
                <div className="task-details">
                  <div className={`task-text ${task.status === 'completed' ? 'completed-text' : ''}`}>
                    {task.task}
                  </div>
                  <div className="task-meta">
                    <span className="task-doctor">{task.doctor_name}</span>
                    <span className={`task-due ${isOverdue(task) ? 'due-overdue' : ''}`}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default FollowUpTasks
