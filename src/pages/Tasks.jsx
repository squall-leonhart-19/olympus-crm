import { useState } from 'react'
import Header from '../components/layout/Header'
import TaskModal from '../components/tasks/TaskModal'
import { Plus, LayoutGrid, List, Filter, X, ChevronDown, Calendar, User, Flag, Clock } from 'lucide-react'
import './Tasks.css'

// Demo tasks data with more date context
const INITIAL_TASKS = [
    { id: '1', title: 'Review Q4 sales report', description: 'Analyze Q4 performance metrics', status: 'todo', priority: 'high', assignee: 'Marco', dueDate: '2026-02-01', createdAt: '2026-01-25' },
    { id: '2', title: 'Call with Jennifer (FM Cert)', description: 'Discovery call for FM certification', status: 'todo', priority: 'urgent', assignee: 'Giulia', dueDate: '2026-01-30', createdAt: '2026-01-27' },
    { id: '3', title: 'Prepare onboarding docs', description: 'Create onboarding materials for new clients', status: 'in_progress', priority: 'medium', assignee: 'Marco', dueDate: '2026-02-03', createdAt: '2026-01-20' },
    { id: '4', title: 'Follow up with leads', description: 'Send follow-up emails to warm leads', status: 'in_progress', priority: 'high', assignee: 'Alex', dueDate: '2026-01-31', createdAt: '2026-01-28' },
    { id: '5', title: 'Update pricing page', description: 'Refresh pricing with new offers', status: 'review', priority: 'medium', assignee: 'Giulia', dueDate: '2026-02-05', createdAt: '2026-01-22' },
    { id: '6', title: 'Client onboarding: Sarah', description: 'Complete onboarding checklist', status: 'done', priority: 'high', assignee: 'Marco', dueDate: '2026-01-28', createdAt: '2026-01-15', completedAt: '2026-01-28' },
    { id: '7', title: 'Create social media content', description: 'Design posts for next week', status: 'todo', priority: 'low', assignee: 'Alex', dueDate: '2026-02-07', createdAt: '2026-01-29' },
    { id: '8', title: 'Review client feedback', description: 'Analyze NPS scores', status: 'done', priority: 'medium', assignee: 'Giulia', dueDate: '2026-01-27', createdAt: '2026-01-20', completedAt: '2026-01-27' },
]

const COLUMNS = [
    { id: 'todo', label: 'To Do', color: 'var(--text-muted)' },
    { id: 'in_progress', label: 'In Progress', color: 'var(--info)' },
    { id: 'review', label: 'Review', color: 'var(--warning)' },
    { id: 'done', label: 'Done', color: 'var(--success)' },
]

const PRIORITY_COLORS = {
    low: 'var(--text-muted)',
    medium: 'var(--info)',
    high: 'var(--warning)',
    urgent: 'var(--danger)'
}

const PRIORITY_LABELS = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent'
}

const STATUS_LABELS = {
    todo: 'To Do',
    in_progress: 'In Progress',
    review: 'Review',
    done: 'Done'
}

const TEAM_MEMBERS = ['Marco', 'Giulia', 'Alex', 'Zeus']

// Helper function to format dates nicely
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date('2026-01-29')
    const tomorrow = new Date('2026-01-30')
    const yesterday = new Date('2026-01-28')

    // Check if same day
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

    // Check if within this week
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))
    if (diffDays > 0 && diffDays <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' })
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDueDateClass = (dateStr, status) => {
    if (status === 'done') return 'completed'
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date('2026-01-29')
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    return ''
}

export default function Tasks() {
    const [tasks, setTasks] = useState(INITIAL_TASKS)
    const [viewMode, setViewMode] = useState('kanban')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [draggedTask, setDraggedTask] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        assignee: '',
        priority: '',
        status: ''
    })

    // Get current date info
    const today = new Date('2026-01-29')
    const dateHeader = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    const handleDragStart = (e, task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, newStatus) => {
        e.preventDefault()
        if (draggedTask && draggedTask.status !== newStatus) {
            setTasks(prev => prev.map(t =>
                t.id === draggedTask.id
                    ? { ...t, status: newStatus, completedAt: newStatus === 'done' ? new Date().toISOString() : null }
                    : t
            ))
        }
        setDraggedTask(null)
    }

    const handleAddTask = () => {
        setEditingTask(null)
        setIsModalOpen(true)
    }

    const handleEditTask = (task) => {
        setEditingTask(task)
        setIsModalOpen(true)
    }

    const handleSaveTask = (taskData) => {
        if (editingTask) {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t))
        } else {
            const newTask = { ...taskData, id: Date.now().toString(), status: 'todo', createdAt: today.toISOString().split('T')[0] }
            setTasks(prev => [...prev, newTask])
        }
        setIsModalOpen(false)
        setEditingTask(null)
    }

    const handleDeleteTask = (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        setIsModalOpen(false)
        setEditingTask(null)
    }

    const clearFilters = () => {
        setFilters({ assignee: '', priority: '', status: '' })
    }

    const hasActiveFilters = filters.assignee || filters.priority || filters.status

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (filters.assignee && task.assignee !== filters.assignee) return false
        if (filters.priority && task.priority !== filters.priority) return false
        if (filters.status && task.status !== filters.status) return false
        return true
    })

    const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status)

    // Count overdue tasks
    const overdueTasks = tasks.filter(t => {
        if (t.status === 'done') return false
        const dueDate = new Date(t.dueDate)
        return dueDate < today
    })

    const todayTasks = tasks.filter(t => {
        const dueDate = new Date(t.dueDate)
        return dueDate.toDateString() === today.toDateString() && t.status !== 'done'
    })

    return (
        <>
            <Header title="Tasks" />
            <div className="page-content">
                {/* Date Banner */}
                <div className="tasks-date-banner">
                    <div className="date-info">
                        <Calendar size={20} />
                        <span className="current-date">{dateHeader}</span>
                    </div>
                    <div className="date-stats">
                        {overdueTasks.length > 0 && (
                            <span className="stat-badge overdue">
                                <Clock size={14} />
                                {overdueTasks.length} overdue
                            </span>
                        )}
                        {todayTasks.length > 0 && (
                            <span className="stat-badge today">
                                {todayTasks.length} due today
                            </span>
                        )}
                    </div>
                </div>

                <div className="tasks-toolbar">
                    <div className="toolbar-left">
                        <button className="btn btn-primary" onClick={handleAddTask}>
                            <Plus size={18} />
                            New Task
                        </button>
                    </div>
                    <div className="toolbar-right">
                        <button
                            className={`btn btn-ghost ${showFilters || hasActiveFilters ? 'active' : ''}`}
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                            Filter
                            {hasActiveFilters && <span className="filter-badge">!</span>}
                        </button>
                        <div className="view-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="filter-panel">
                        <div className="filter-group">
                            <label><User size={14} /> Assignee</label>
                            <select
                                value={filters.assignee}
                                onChange={(e) => setFilters(f => ({ ...f, assignee: e.target.value }))}
                                className="input"
                            >
                                <option value="">All</option>
                                {TEAM_MEMBERS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label><Flag size={14} /> Priority</label>
                            <select
                                value={filters.priority}
                                onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
                                className="input"
                            >
                                <option value="">All</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label><ChevronDown size={14} /> Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                                className="input"
                            >
                                <option value="">All</option>
                                {COLUMNS.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        {hasActiveFilters && (
                            <button className="btn btn-ghost" onClick={clearFilters}>
                                <X size={16} />
                                Clear
                            </button>
                        )}
                    </div>
                )}

                {/* Kanban View */}
                {viewMode === 'kanban' && (
                    <div className="kanban-board">
                        {COLUMNS.map(column => (
                            <div
                                key={column.id}
                                className="kanban-column"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <div className="column-header">
                                    <div className="column-indicator" style={{ background: column.color }} />
                                    <span className="column-title">{column.label}</span>
                                    <span className="column-count">{getTasksByStatus(column.id).length}</span>
                                </div>
                                <div className="column-tasks">
                                    {getTasksByStatus(column.id).map(task => (
                                        <div
                                            key={task.id}
                                            className={`task-card ${getDueDateClass(task.dueDate, task.status)}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task)}
                                            onClick={() => handleEditTask(task)}
                                        >
                                            <div className="task-priority" style={{ background: PRIORITY_COLORS[task.priority] }} />
                                            <div className="task-content">
                                                <h4 className="task-title">{task.title}</h4>
                                                {task.description && (
                                                    <p className="task-description">{task.description}</p>
                                                )}
                                                <div className="task-meta">
                                                    {task.dueDate && (
                                                        <span className={`task-due ${getDueDateClass(task.dueDate, task.status)}`}>
                                                            <Clock size={12} />
                                                            {formatDate(task.dueDate)}
                                                        </span>
                                                    )}
                                                    {task.assignee && (
                                                        <span className="task-assignee">{task.assignee}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                    <div className="tasks-list-wrapper">
                        <table className="tasks-list">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Assignee</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(task => (
                                    <tr key={task.id} onClick={() => handleEditTask(task)} className={getDueDateClass(task.dueDate, task.status)}>
                                        <td>
                                            <div className="list-task-info">
                                                <div className="list-task-priority" style={{ background: PRIORITY_COLORS[task.priority] }} />
                                                <div>
                                                    <div className="list-task-title">{task.title}</div>
                                                    {task.description && (
                                                        <div className="list-task-desc">{task.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${task.status}`}>
                                                {STATUS_LABELS[task.status]}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${task.priority}`}>
                                                {PRIORITY_LABELS[task.priority]}
                                            </span>
                                        </td>
                                        <td>
                                            {task.assignee && (
                                                <span className="task-assignee">{task.assignee}</span>
                                            )}
                                        </td>
                                        <td className="task-due-cell">
                                            {task.dueDate && (
                                                <span className={`task-due ${getDueDateClass(task.dueDate, task.status)}`}>
                                                    <Calendar size={14} />
                                                    {formatDate(task.dueDate)}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TaskModal
                    task={editingTask}
                    onSave={handleSaveTask}
                    onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : null}
                    onClose={() => { setIsModalOpen(false); setEditingTask(null) }}
                />
            )}
        </>
    )
}
