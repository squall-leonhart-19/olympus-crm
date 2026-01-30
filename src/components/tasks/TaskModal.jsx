import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign, Calendar, User, Flag, FileText, Clock, Edit2, Eye, Plus, Check, Tag, Copy, RefreshCw, Link2, Timer } from 'lucide-react'
import TaskComments from './TaskComments'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './TaskModal.css'

const PRIORITIES = [
    { value: 'low', label: 'Low', color: '#6b7280', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', emoji: '🔵' },
    { value: 'high', label: 'High', color: '#f59e0b', emoji: '🟠' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', emoji: '🔴' },
]

const LABELS = [
    { value: 'call', label: 'Call', color: '#8b5cf6' },
    { value: 'follow-up', label: 'Follow-up', color: '#06b6d4' },
    { value: 'admin', label: 'Admin', color: '#64748b' },
    { value: 'meeting', label: 'Meeting', color: '#f43f5e' },
    { value: 'review', label: 'Review', color: '#22c55e' },
]

const RECURRENCE_OPTIONS = [
    { value: null, label: 'No repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
]

const QUICK_DATES = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: 'This Week', days: 7 },
    { label: 'Next Week', days: 14 },
]

export default function TaskModal({
    task,
    teamMembers = [],
    allTasks = [],
    onSave,
    onDelete,
    onDuplicate,
    onClose,
    canEdit = true,
    canDelete = false,
    currentUserName = ''
}) {
    const [mode, setMode] = useState(task ? 'view' : 'edit')
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        assignees: [],
        dueDate: '',
        dueTime: '',
        dealId: '',
        projectId: '',
        sectionId: '',
        subtasks: [],
        labels: [],
        recurrence: null,
        blockedBy: [],
    })
    const [deals, setDeals] = useState([])
    const [projects, setProjects] = useState([])
    const [sections, setSections] = useState([])
    const [currentUser, setCurrentUser] = useState('User')
    const [newSubtask, setNewSubtask] = useState('')

    useEffect(() => {
        if (task) {
            // Support both old single assignee and new assignees array
            const assigneesFromTask = task.assignees?.length ? task.assignees : (task.assignee ? [task.assignee] : [])
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                assignee: task.assignee || '',
                assignees: assigneesFromTask,
                dueDate: task.dueDate || '',
                dueTime: task.dueTime || '',
                dealId: task.dealId || '',
                subtasks: task.subtasks || [],
                labels: task.labels || [],
                recurrence: task.recurrence || null,
                blockedBy: task.blockedBy || [],
            })
            setMode('view')
        } else {
            setMode('edit')
        }
        loadDeals()
        loadProjects()
        loadCurrentUser()
    }, [task])

    const loadDeals = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data } = await supabase
                .from('deals')
                .select('id, title, value, stage')
                .in('stage', ['lead', 'booked', 'taken', 'proposal'])
                .order('value', { ascending: false })
            if (data) setDeals(data)
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

    const loadSections = async (projectId) => {
        if (!isSupabaseConfigured || !projectId) {
            setSections([])
            return
        }
        try {
            const { data } = await supabase
                .from('project_sections')
                .select('id, name, color')
                .eq('project_id', projectId)
                .order('sort_order', { ascending: true })
            if (data) setSections(data)
        } catch (e) { }
    }

    const loadCurrentUser = async () => {
        if (!isSupabaseConfigured) return
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.user_metadata?.name) {
                setCurrentUser(user.user_metadata.name)
            } else if (user?.email) {
                setCurrentUser(user.email.split('@')[0])
            }
        } catch (e) { }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.title.trim()) return
        onSave(formData)
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Toggle assignee in multi-select
    const toggleAssignee = (memberName) => {
        setFormData(prev => {
            const current = prev.assignees || []
            const isSelected = current.includes(memberName)
            const updated = isSelected
                ? current.filter(n => n !== memberName)
                : [...current, memberName]
            return {
                ...prev,
                assignees: updated,
                assignee: updated[0] || '' // Keep backward compatibility
            }
        })
    }

    const setQuickDate = (days) => {
        const date = new Date()
        date.setDate(date.getDate() + days)
        const dateStr = date.toISOString().split('T')[0]
        handleChange('dueDate', dateStr)
    }

    // Subtasks handlers
    const addSubtask = () => {
        if (!newSubtask.trim()) return
        const subtask = { id: Date.now(), text: newSubtask.trim(), done: false }
        handleChange('subtasks', [...formData.subtasks, subtask])
        setNewSubtask('')
    }

    const toggleSubtask = (id) => {
        const updated = formData.subtasks.map(st =>
            st.id === id ? { ...st, done: !st.done } : st
        )
        handleChange('subtasks', updated)
    }

    const removeSubtask = (id) => {
        handleChange('subtasks', formData.subtasks.filter(st => st.id !== id))
    }

    // Labels handlers
    const toggleLabel = (labelValue) => {
        const current = formData.labels || []
        if (current.includes(labelValue)) {
            handleChange('labels', current.filter(l => l !== labelValue))
        } else {
            handleChange('labels', [...current, labelValue])
        }
    }

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return 'No date set'
        const date = new Date(dateStr)
        const today = new Date()
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)

        if (date.toDateString() === today.toDateString()) return '📅 Today'
        if (date.toDateString() === tomorrow.toDateString()) return '📅 Tomorrow'
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }

    const handleDuplicate = () => {
        if (onDuplicate) {
            onDuplicate({
                ...formData,
                title: `${formData.title} (Copy)`,
            })
        }
    }

    const selectedDeal = deals.find(d => d.id === formData.dealId)
    const selectedPriority = PRIORITIES.find(p => p.value === formData.priority)
    const subtaskProgress = formData.subtasks.length > 0
        ? Math.round((formData.subtasks.filter(s => s.done).length / formData.subtasks.length) * 100)
        : 0

    // Find assignee member data
    const assigneeMember = teamMembers.find(m =>
        (typeof m === 'string' ? m : m.name) === formData.assignee
    )
    const assigneeDisplayName = assigneeMember?.nickname || assigneeMember?.name || formData.assignee
    const assigneeAvatar = typeof assigneeMember === 'object' ? assigneeMember.avatar_url : null

    // VIEW MODE
    if (mode === 'view' && task) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="task-modal task-view-mode" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="task-modal-header">
                        <div className="header-content">
                            <h2>{formData.title}</h2>
                            <div className="task-view-badges">
                                <span
                                    className="priority-badge-view"
                                    style={{ background: selectedPriority?.color }}
                                >
                                    {selectedPriority?.emoji} {selectedPriority?.label}
                                </span>
                                {formData.labels?.map(label => {
                                    const l = LABELS.find(lb => lb.value === label)
                                    return l ? (
                                        <span key={label} className="label-badge" style={{ background: l.color }}>
                                            {l.label}
                                        </span>
                                    ) : null
                                })}
                                {formData.recurrence && (
                                    <span className="recurrence-badge">
                                        <RefreshCw size={12} /> {formData.recurrence}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="header-actions">
                            {onDuplicate && (
                                <button className="action-icon-btn" onClick={handleDuplicate} title="Duplicate">
                                    <Copy size={18} />
                                </button>
                            )}
                            {canEdit && (
                                <button className="edit-mode-btn" onClick={() => setMode('edit')} title="Edit Task">
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                            )}
                            <button className="close-btn" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Task Details */}
                    <div className="task-view-content">
                        {/* Description */}
                        {formData.description && (
                            <div className="task-detail-section">
                                <div className="detail-label"><FileText size={14} /> Description</div>
                                <p className="detail-value description-text">{formData.description}</p>
                            </div>
                        )}

                        {/* Subtasks */}
                        {formData.subtasks?.length > 0 && (
                            <div className="task-detail-section">
                                <div className="detail-label">
                                    <Check size={14} /> Subtasks
                                    <span className="subtask-progress">{subtaskProgress}%</span>
                                </div>
                                <div className="subtasks-view-list">
                                    {formData.subtasks.map(st => (
                                        <div
                                            key={st.id}
                                            className={`subtask-view-item ${st.done ? 'done' : ''}`}
                                            onClick={() => canEdit && toggleSubtask(st.id)}
                                        >
                                            <span className="subtask-check">{st.done ? '✓' : '○'}</span>
                                            <span>{st.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Meta Grid */}
                        <div className="task-meta-grid">
                            {/* Assignee */}
                            <div className="task-detail-card">
                                <div className="detail-label"><User size={14} /> Assigned to</div>
                                <div className="detail-value assignee-display">
                                    {formData.assignee ? (
                                        <>
                                            {assigneeAvatar ? (
                                                <img src={assigneeAvatar} alt="" className="view-avatar-img" />
                                            ) : (
                                                <span className="view-avatar">{formData.assignee.charAt(0)}</span>
                                            )}
                                            <span>{assigneeDisplayName}</span>
                                        </>
                                    ) : (
                                        <span className="unassigned">Unassigned</span>
                                    )}
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="task-detail-card">
                                <div className="detail-label"><Calendar size={14} /> Due Date</div>
                                <div className="detail-value">
                                    {formatDateDisplay(formData.dueDate)}
                                    {formData.dueTime && <span className="due-time"> at {formData.dueTime}</span>}
                                </div>
                            </div>

                            {/* Linked Deal */}
                            {selectedDeal && (
                                <div className="task-detail-card deal-card">
                                    <div className="detail-label"><DollarSign size={14} /> Linked Deal</div>
                                    <div className="detail-value">
                                        {selectedDeal.title}
                                        <span className="deal-value">${selectedDeal.value?.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="view-actions">
                            {canDelete && onDelete && (
                                <button className="delete-btn" onClick={onDelete}>
                                    <Trash2 size={16} />
                                    Delete Task
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Comments */}
                    {task && task.id && (
                        <div className="comments-section">
                            <TaskComments taskId={task.id} currentUser={currentUser} />
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // EDIT MODE
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-modal task-modal-large" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="task-modal-header">
                    <div className="header-content">
                        <h2>{task ? '✏️ Edit Task' : '✨ New Task'}</h2>
                        <p>{task ? 'Update task details' : 'What needs to be done?'}</p>
                    </div>
                    <div className="header-actions">
                        {task && (
                            <button className="view-mode-btn" onClick={() => setMode('view')} title="View Task">
                                <Eye size={18} />
                            </button>
                        )}
                        <button className="close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="task-form">
                    {/* Title */}
                    <div className="form-section">
                        <input
                            type="text"
                            className="title-input"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Task title..."
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="form-section">
                        <label><FileText size={14} /> Description</label>
                        <textarea
                            className="desc-input"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add more details..."
                            rows={3}
                        />
                    </div>

                    {/* Project & Section */}
                    {projects.length > 0 && (
                        <div className="form-section project-section">
                            <label><span className="project-icon">📁</span> Project</label>
                            <div className="project-selectors">
                                <select
                                    className="select-input"
                                    value={formData.projectId || ''}
                                    onChange={(e) => {
                                        handleChange('projectId', e.target.value)
                                        handleChange('sectionId', '')
                                        if (e.target.value) loadSections(e.target.value)
                                        else setSections([])
                                    }}
                                >
                                    <option value="">No project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                                {sections.length > 0 && (
                                    <select
                                        className="select-input"
                                        value={formData.sectionId || ''}
                                        onChange={(e) => handleChange('sectionId', e.target.value)}
                                    >
                                        <option value="">No section</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Two Column Layout */}
                    <div className="form-columns">
                        <div className="form-column">
                            {/* Priority Selector */}
                            <div className="form-section">
                                <label><Flag size={14} /> Priority</label>
                                <div className="priority-grid">
                                    {PRIORITIES.map(p => (
                                        <button
                                            key={p.value}
                                            type="button"
                                            className={`priority-btn ${formData.priority === p.value ? 'active' : ''}`}
                                            style={{ '--prio-color': p.color }}
                                            onClick={() => handleChange('priority', p.value)}
                                        >
                                            <span className="prio-emoji">{p.emoji}</span>
                                            <span className="prio-label">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Labels */}
                            <div className="form-section">
                                <label><Tag size={14} /> Labels</label>
                                <div className="labels-grid">
                                    {LABELS.map(l => (
                                        <button
                                            key={l.value}
                                            type="button"
                                            className={`label-btn ${formData.labels?.includes(l.value) ? 'active' : ''}`}
                                            style={{ '--label-color': l.color }}
                                            onClick={() => toggleLabel(l.value)}
                                        >
                                            {l.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="form-section">
                                <label><Calendar size={14} /> Due Date & Time</label>
                                <div className="date-section">
                                    <div className="quick-dates">
                                        {QUICK_DATES.map(d => (
                                            <button
                                                key={d.label}
                                                type="button"
                                                className="quick-date-btn"
                                                onClick={() => setQuickDate(d.days)}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="date-time-row">
                                        <input
                                            type="date"
                                            className="date-input"
                                            value={formData.dueDate}
                                            onChange={(e) => handleChange('dueDate', e.target.value)}
                                        />
                                        <input
                                            type="time"
                                            className="time-input"
                                            value={formData.dueTime}
                                            onChange={(e) => handleChange('dueTime', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div className="form-section">
                                <label><RefreshCw size={14} /> Repeat</label>
                                <div className="recurrence-grid">
                                    {RECURRENCE_OPTIONS.map(r => (
                                        <button
                                            key={r.value || 'none'}
                                            type="button"
                                            className={`recurrence-btn ${formData.recurrence === r.value ? 'active' : ''}`}
                                            onClick={() => handleChange('recurrence', r.value)}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="form-column">
                            {/* Assignee - Multi-select */}
                            <div className="form-section">
                                <label><User size={14} /> Assign to (click to select multiple)</label>
                                <div className="assignee-grid compact">
                                    {teamMembers.map(member => {
                                        const memberName = typeof member === 'string' ? member : member.name
                                        const displayName = typeof member === 'string' ? member : (member.nickname || member.name)
                                        const avatarUrl = typeof member === 'string' ? null : member.avatar_url
                                        const isSelected = formData.assignees?.includes(memberName)

                                        return (
                                            <button
                                                key={memberName}
                                                type="button"
                                                className={`assignee-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => toggleAssignee(memberName)}
                                            >
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className="assignee-avatar-img" />
                                                ) : (
                                                    <span className="assignee-avatar">{memberName.charAt(0)}</span>
                                                )}
                                                <span>{displayName}</span>
                                                {isSelected && <span className="assignee-check">✓</span>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Subtasks */}
                            <div className="form-section">
                                <label><Check size={14} /> Subtasks</label>
                                <div className="subtasks-section">
                                    {formData.subtasks.map(st => (
                                        <div key={st.id} className={`subtask-item ${st.done ? 'done' : ''}`}>
                                            <button
                                                type="button"
                                                className="subtask-toggle"
                                                onClick={() => toggleSubtask(st.id)}
                                            >
                                                {st.done ? '✓' : '○'}
                                            </button>
                                            <span className="subtask-text">{st.text}</span>
                                            <button
                                                type="button"
                                                className="subtask-remove"
                                                onClick={() => removeSubtask(st.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="add-subtask-row">
                                        <input
                                            type="text"
                                            className="subtask-input"
                                            placeholder="Add subtask..."
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                                        />
                                        <button type="button" className="add-subtask-btn" onClick={addSubtask}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Deal Link */}
                            {deals.length > 0 && (
                                <div className="form-section">
                                    <label><DollarSign size={14} /> Link to Deal</label>
                                    <select
                                        className="select-input"
                                        value={formData.dealId}
                                        onChange={(e) => handleChange('dealId', e.target.value)}
                                    >
                                        <option value="">No deal linked</option>
                                        {deals.map(deal => (
                                            <option key={deal.id} value={deal.id}>
                                                {deal.title} (${deal.value?.toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="modal-actions">
                        {task && canDelete && onDelete && (
                            <button type="button" className="delete-btn" onClick={onDelete}>
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}
                        <div className="action-group">
                            <button type="button" className="cancel-btn" onClick={task ? () => setMode('view') : onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="submit-btn gold"
                            >
                                {task ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Comments in edit mode too */}
                {task && task.id && (
                    <div className="comments-section">
                        <TaskComments taskId={task.id} currentUser={currentUser} />
                    </div>
                )}
            </div>
        </div>
    )
}
