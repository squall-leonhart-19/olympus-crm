import { useState, useEffect, useCallback } from 'react'
import Header from '../components/layout/Header'
import TaskModal from '../components/tasks/TaskModal'
import LoadingSkeleton from '../styles/LoadingSkeleton'
import { Plus, LayoutGrid, List, Filter, X, ChevronDown, Calendar, User, Flag, Clock, Search, Check, MoreHorizontal, FolderOpen } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Tasks.css'

const COLUMNS = [
    { id: 'todo', label: 'To Do', color: '#6b7280', emoji: '📋' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6', emoji: '🔄' },
    { id: 'review', label: 'Review', color: '#f59e0b', emoji: '👀' },
    { id: 'done', label: 'Done', color: '#22c55e', emoji: '✅' },
]

const PRIORITY_COLORS = {
    low: '#6b7280',
    medium: '#3b82f6',
    high: '#f59e0b',
    urgent: '#ef4444'
}

const PRIORITY_EMOJIS = {
    low: '🟢',
    medium: '🔵',
    high: '🟠',
    urgent: '🔴'
}

const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const taskDate = new Date(date)
    taskDate.setHours(0, 0, 0, 0)

    if (taskDate.getTime() === today.getTime()) return 'Today'
    if (taskDate.getTime() === tomorrow.getTime()) return 'Tomorrow'

    const diffDays = Math.ceil((taskDate - today) / (1000 * 60 * 60 * 24))
    if (diffDays > 0 && diffDays <= 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' })
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getDueDateClass = (dateStr, status) => {
    if (status === 'done') return 'completed'
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    return ''
}

export default function Tasks() {
    const [tasks, setTasks] = useState([])
    const [teamMembers, setTeamMembers] = useState([])
    const [viewMode, setViewMode] = useState('kanban')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [draggedTask, setDraggedTask] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [hoveredTask, setHoveredTask] = useState(null)
    const [currentUserName, setCurrentUserName] = useState('')
    const [currentUserRole, setCurrentUserRole] = useState('member')
    const [selectedTasks, setSelectedTasks] = useState([])
    const [filters, setFilters] = useState({
        assignee: '',
        priority: '',
        status: '',
        project: ''
    })
    const [projects, setProjects] = useState([])

    const today = new Date()
    const dateHeader = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

            if (e.key === 'n' || e.key === 'N') {
                e.preventDefault()
                handleAddTask()
            }
            if (e.key === 'Escape') {
                setIsModalOpen(false)
                setShowFilters(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    useEffect(() => {
        loadTasks()
        loadTeamMembers()
        loadCurrentUser()
        loadProjects()
    }, [])

    const loadTasks = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        try {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                const mappedTasks = data.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    priority: t.priority,
                    assignee: t.assignee_name,
                    dueDate: t.due_date,
                    dueTime: t.due_time,
                    subtasks: t.subtasks || [],
                    labels: t.labels || [],
                    recurrence: t.recurrence,
                    blockedBy: t.blocked_by || [],
                    timeSpent: t.time_spent || 0,
                    createdAt: t.created_at,
                    completedAt: t.completed_at
                }))
                setTasks(mappedTasks)
            }
        } catch (e) { }
        setLoading(false)
    }

    const loadTeamMembers = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data } = await supabase.from('team_members').select('id, name, nickname, avatar_url, role')
            if (data) {
                setTeamMembers(data)
            }
        } catch (e) { }
    }

    const loadCurrentUser = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
                setCurrentUserName(userName)

                // Get user's role from team_members
                const { data: member } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('email', user.email)
                    .single()

                if (member?.role) {
                    setCurrentUserRole(member.role.toLowerCase())
                }
            }
        } catch (e) { }
    }

    const loadProjects = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data } = await supabase
                .from('projects')
                .select('id, name, icon, color')
                .order('created_at', { ascending: true })
            if (data) setProjects(data)
        } catch (e) { }
    }

    const handleDragStart = (e, task) => {
        setDraggedTask(task)
        e.dataTransfer.effectAllowed = 'move'
        e.target.classList.add('dragging')
    }

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging')
        setDraggedTask(null)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = async (e, newStatus) => {
        e.preventDefault()
        if (draggedTask && draggedTask.status !== newStatus) {
            const completedAt = newStatus === 'done' ? new Date().toISOString() : null

            setTasks(prev => prev.map(t =>
                t.id === draggedTask.id ? { ...t, status: newStatus, completedAt } : t
            ))

            if (isSupabaseConfigured) {
                await supabase
                    .from('tasks')
                    .update({ status: newStatus, completed_at: completedAt })
                    .eq('id', draggedTask.id)
            }
        }
        setDraggedTask(null)
    }

    const handleAddTask = () => {
        setEditingTask(null)
        setIsModalOpen(true)
    }

    const handleAddTaskToColumn = (status) => {
        setEditingTask({ status })
        setIsModalOpen(true)
    }

    const handleEditTask = (task) => {
        setEditingTask(task)
        setIsModalOpen(true)
    }

    // Quick action: Mark as done
    const handleQuickComplete = async (e, task) => {
        e.stopPropagation()
        const newStatus = task.status === 'done' ? 'todo' : 'done'
        const completedAt = newStatus === 'done' ? new Date().toISOString() : null

        setTasks(prev => prev.map(t =>
            t.id === task.id ? { ...t, status: newStatus, completedAt } : t
        ))

        if (isSupabaseConfigured) {
            await supabase
                .from('tasks')
                .update({ status: newStatus, completed_at: completedAt })
                .eq('id', task.id)
        }
    }

    const handleSaveTask = async (taskData) => {
        if (editingTask?.id) {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t))

            if (isSupabaseConfigured) {
                const { error } = await supabase
                    .from('tasks')
                    .update({
                        title: taskData.title,
                        description: taskData.description,
                        priority: taskData.priority,
                        assignee_name: taskData.assignee,
                        assignees: taskData.assignees || [],
                        project_id: taskData.projectId || null,
                        section_id: taskData.sectionId || null,
                        due_date: taskData.dueDate || null,
                        due_time: taskData.dueTime || null,
                        subtasks: taskData.subtasks || [],
                        labels: taskData.labels || [],
                        recurrence: taskData.recurrence || null,
                        blocked_by: taskData.blockedBy || [],
                    })
                    .eq('id', editingTask.id)
                if (error) console.error('Task update error:', error)
            }
        } else {
            const newTask = {
                ...taskData,
                id: Date.now().toString(),
                status: editingTask?.status || 'todo',
                createdAt: new Date().toISOString()
            }

            if (isSupabaseConfigured) {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert({
                        title: taskData.title,
                        description: taskData.description,
                        status: newTask.status,
                        priority: taskData.priority,
                        assignee_name: taskData.assignee,
                        assignees: taskData.assignees || [],
                        project_id: taskData.projectId || null,
                        section_id: taskData.sectionId || null,
                        due_date: taskData.dueDate || null,
                        due_time: taskData.dueTime || null,
                        subtasks: taskData.subtasks || [],
                        labels: taskData.labels || [],
                        recurrence: taskData.recurrence || null,
                        blocked_by: taskData.blockedBy || [],
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Task insert error:', error)
                } else if (data) {
                    newTask.id = data.id
                }
            }

            setTasks(prev => [newTask, ...prev])
        }
        setIsModalOpen(false)
        setEditingTask(null)
    }

    const handleDeleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId))

        if (isSupabaseConfigured) {
            await supabase.from('tasks').delete().eq('id', taskId)
        }

        setIsModalOpen(false)
        setEditingTask(null)
    }

    const handleDuplicateTask = (taskData) => {
        // Create a new task with the duplicated data
        const duplicatedTask = {
            ...taskData,
            status: 'todo', // Reset status
        }
        setEditingTask(duplicatedTask)
        // Stay in modal, user can edit before saving
    }

    const clearFilters = () => {
        setFilters({ assignee: '', priority: '', status: '' })
        setSearchQuery('')
    }

    // Bulk action handlers
    const toggleTaskSelection = (taskId) => {
        setSelectedTasks(prev =>
            prev.includes(taskId)
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        )
    }

    const selectAllTasks = () => {
        if (selectedTasks.length === filteredTasks.length) {
            setSelectedTasks([])
        } else {
            setSelectedTasks(filteredTasks.map(t => t.id))
        }
    }

    const clearSelection = () => {
        setSelectedTasks([])
    }

    const bulkUpdateStatus = async (newStatus) => {
        setTasks(prev => prev.map(t =>
            selectedTasks.includes(t.id) ? { ...t, status: newStatus } : t
        ))

        if (isSupabaseConfigured) {
            await supabase
                .from('tasks')
                .update({ status: newStatus })
                .in('id', selectedTasks)
        }

        setSelectedTasks([])
    }

    const bulkDelete = async () => {
        if (!confirm(`Delete ${selectedTasks.length} tasks?`)) return

        setTasks(prev => prev.filter(t => !selectedTasks.includes(t.id)))

        if (isSupabaseConfigured) {
            await supabase
                .from('tasks')
                .delete()
                .in('id', selectedTasks)
        }

        setSelectedTasks([])
    }

    const hasActiveFilters = filters.assignee || filters.priority || filters.status || filters.project || searchQuery

    // Filter tasks including search
    const filteredTasks = tasks.filter(task => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            if (!task.title.toLowerCase().includes(query) &&
                !(task.description || '').toLowerCase().includes(query) &&
                !(task.assignee || '').toLowerCase().includes(query)) {
                return false
            }
        }
        if (filters.assignee && task.assignee !== filters.assignee) return false
        if (filters.priority && task.priority !== filters.priority) return false
        if (filters.status && task.status !== filters.status) return false
        if (filters.project && task.project_id !== filters.project) return false
        return true
    })

    const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status)

    const overdueTasks = tasks.filter(t => {
        if (t.status === 'done') return false
        if (!t.dueDate) return false
        return new Date(t.dueDate) < today
    })

    const todayTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false
        const dueDate = new Date(t.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)
        return dueDate.getTime() === todayStart.getTime()
    })

    // Helper to get member data by name
    const getMemberByName = (name) => {
        if (!name) return null
        return teamMembers.find(m => m.name === name) || null
    }

    if (loading) {
        return (
            <>
                <Header title="Tasks" />
                <div className="page-content">
                    <LoadingSkeleton type="tasks" count={6} />
                </div>
            </>
        )
    }

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
                        <span className="keyboard-hint">Press N</span>
                    </div>
                    <div className="toolbar-center">
                        <div className="search-box-tasks">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input-tasks"
                            />
                            {searchQuery && (
                                <button className="search-clear" onClick={() => setSearchQuery('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
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
                                {teamMembers.map(m => (
                                    <option key={m.name} value={m.name}>{m.nickname || m.name}</option>
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
                                <option value="low">🟢 Low</option>
                                <option value="medium">🔵 Medium</option>
                                <option value="high">🟠 High</option>
                                <option value="urgent">🔴 Urgent</option>
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
                                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        {projects.length > 0 && (
                            <div className="filter-group">
                                <label><FolderOpen size={14} /> Project</label>
                                <select
                                    value={filters.project}
                                    onChange={(e) => setFilters(f => ({ ...f, project: e.target.value }))}
                                    className="input"
                                >
                                    <option value="">All Projects</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {hasActiveFilters && (
                            <button className="btn btn-ghost" onClick={clearFilters}>
                                <X size={16} />
                                Clear all
                            </button>
                        )}
                    </div>
                )}

                {/* Empty State */}
                {tasks.length === 0 ? (
                    <div className="empty-state-large">
                        <div className="empty-illustration">📋</div>
                        <h2>No tasks yet</h2>
                        <p>Create your first task to get started with your project management</p>
                        <button className="btn btn-primary btn-large" onClick={handleAddTask}>
                            <Plus size={20} />
                            Create First Task
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Kanban View */}
                        {viewMode === 'kanban' && (
                            <div className="kanban-board">
                                {COLUMNS.map(column => {
                                    const columnTasks = getTasksByStatus(column.id)
                                    return (
                                        <div
                                            key={column.id}
                                            className={`kanban-column ${draggedTask ? 'drop-target' : ''}`}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, column.id)}
                                        >
                                            <div className="column-header">
                                                <div className="column-title-row">
                                                    <span className="column-emoji">{column.emoji}</span>
                                                    <span className="column-title">{column.label}</span>
                                                    <span className="column-count">{columnTasks.length}</span>
                                                </div>
                                                <button
                                                    className="column-add-btn"
                                                    onClick={() => handleAddTaskToColumn(column.id)}
                                                    title="Add task to this column"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <div className="column-tasks">
                                                {columnTasks.length === 0 ? (
                                                    <div className="column-empty">
                                                        <span>Drop tasks here</span>
                                                    </div>
                                                ) : (
                                                    columnTasks.map(task => (
                                                        <div
                                                            key={task.id}
                                                            className={`task-card ${getDueDateClass(task.dueDate, task.status)} ${hoveredTask === task.id ? 'hovered' : ''} ${selectedTasks.includes(task.id) ? 'selected' : ''}`}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, task)}
                                                            onDragEnd={handleDragEnd}
                                                            onClick={() => handleEditTask(task)}
                                                            onMouseEnter={() => setHoveredTask(task.id)}
                                                            onMouseLeave={() => setHoveredTask(null)}
                                                        >
                                                            <div
                                                                className="task-priority-bar"
                                                                style={{ background: PRIORITY_COLORS[task.priority] }}
                                                            />

                                                            {/* Selection Checkbox */}
                                                            <div
                                                                className={`task-select-box ${selectedTasks.includes(task.id) ? 'selected' : ''}`}
                                                                onClick={(e) => { e.stopPropagation(); toggleTaskSelection(task.id); }}
                                                            >
                                                                {selectedTasks.includes(task.id) ? '✓' : ''}
                                                            </div>

                                                            {/* Quick Actions */}
                                                            <div className="task-quick-actions">
                                                                <button
                                                                    className={`quick-action-btn ${task.status === 'done' ? 'completed' : ''}`}
                                                                    onClick={(e) => handleQuickComplete(e, task)}
                                                                    title={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
                                                                >
                                                                    <Check size={14} />
                                                                </button>
                                                            </div>

                                                            <div className="task-content">
                                                                <div className="task-header-row">
                                                                    <span className="task-priority-emoji">{PRIORITY_EMOJIS[task.priority]}</span>
                                                                    <h4 className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>
                                                                        {task.title}
                                                                    </h4>
                                                                </div>
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
                                                                    {task.assignee && (() => {
                                                                        const member = getMemberByName(task.assignee)
                                                                        const displayName = member?.nickname || task.assignee
                                                                        return (
                                                                            <span className="task-assignee-chip">
                                                                                {member?.avatar_url ? (
                                                                                    <img src={member.avatar_url} alt={displayName} className="assignee-avatar-img-mini" />
                                                                                ) : (
                                                                                    <span className="assignee-avatar-mini">{task.assignee.charAt(0)}</span>
                                                                                )}
                                                                                {displayName}
                                                                            </span>
                                                                        )
                                                                    })()}
                                                                    {/* Label badges */}
                                                                    {task.labels?.length > 0 && (
                                                                        <div className="task-labels">
                                                                            {task.labels.slice(0, 2).map(label => (
                                                                                <span key={label} className={`task-label-mini ${label}`}>{label}</span>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {/* Subtask progress */}
                                                                    {task.subtasks?.length > 0 && (
                                                                        <span className="task-subtask-indicator">
                                                                            ✓ {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <div className="tasks-list-wrapper">
                                <table className="tasks-list">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '40px' }}></th>
                                            <th>Task</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Assignee</th>
                                            <th>Due Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map(task => (
                                            <tr
                                                key={task.id}
                                                onClick={() => handleEditTask(task)}
                                                className={`${getDueDateClass(task.dueDate, task.status)} ${task.status === 'done' ? 'row-completed' : ''}`}
                                            >
                                                <td>
                                                    <button
                                                        className={`list-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                                                        onClick={(e) => handleQuickComplete(e, task)}
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </td>
                                                <td>
                                                    <div className="list-task-info">
                                                        <div>
                                                            <div className={`list-task-title ${task.status === 'done' ? 'completed' : ''}`}>
                                                                {task.title}
                                                            </div>
                                                            {task.description && (
                                                                <div className="list-task-desc">{task.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge status-${task.status}`}>
                                                        {COLUMNS.find(c => c.id === task.status)?.emoji} {COLUMNS.find(c => c.id === task.status)?.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`priority-badge priority-${task.priority}`}>
                                                        {PRIORITY_EMOJIS[task.priority]} {task.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    {task.assignee && (() => {
                                                        const member = getMemberByName(task.assignee)
                                                        const displayName = member?.nickname || task.assignee
                                                        return (
                                                            <span className="task-assignee-chip">
                                                                {member?.avatar_url ? (
                                                                    <img src={member.avatar_url} alt={displayName} className="assignee-avatar-img-mini" />
                                                                ) : (
                                                                    <span className="assignee-avatar-mini">{task.assignee.charAt(0)}</span>
                                                                )}
                                                                {displayName}
                                                            </span>
                                                        )
                                                    })()}
                                                </td>
                                                <td>
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
                    </>
                )}
            </div>

            {isModalOpen && (() => {
                const isAdmin = currentUserRole === 'admin'
                const isTaskOwner = editingTask?.assignee === currentUserName
                const canEdit = !editingTask || isAdmin || isTaskOwner
                const canDelete = isAdmin

                return (
                    <TaskModal
                        task={editingTask}
                        teamMembers={teamMembers}
                        allTasks={tasks}
                        onSave={handleSaveTask}
                        onDelete={editingTask?.id ? () => handleDeleteTask(editingTask.id) : null}
                        onDuplicate={editingTask?.id ? handleDuplicateTask : null}
                        onClose={() => { setIsModalOpen(false); setEditingTask(null) }}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        currentUserName={currentUserName}
                    />
                )
            })()}

            {/* Floating Bulk Actions Bar */}
            {selectedTasks.length > 0 && (
                <div className="bulk-actions-bar">
                    <span className="bulk-count">{selectedTasks.length} selected</span>
                    <div className="bulk-divider" />
                    <button className="bulk-btn" onClick={() => bulkUpdateStatus('todo')}>To Do</button>
                    <button className="bulk-btn" onClick={() => bulkUpdateStatus('in_progress')}>In Progress</button>
                    <button className="bulk-btn" onClick={() => bulkUpdateStatus('done')}>Done</button>
                    <div className="bulk-divider" />
                    <button className="bulk-btn danger" onClick={bulkDelete}>
                        <Trash2 size={14} /> Delete
                    </button>
                    <button className="bulk-close" onClick={clearSelection}>
                        <X size={16} />
                    </button>
                </div>
            )}
        </>
    )
}
