import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign, Calendar, User, Flag, FileText, Clock, Edit2, Eye } from 'lucide-react'
import TaskComments from './TaskComments'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './TaskModal.css'

const PRIORITIES = [
    { value: 'low', label: 'Low', color: '#6b7280', emoji: '🟢' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', emoji: '🔵' },
    { value: 'high', label: 'High', color: '#f59e0b', emoji: '🟠' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', emoji: '🔴' },
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
    onSave,
    onDelete,
    onClose,
    canEdit = true,
    canDelete = false,
    currentUserName = ''
}) {
    const [mode, setMode] = useState(task ? 'view' : 'edit') // view or edit
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        dueDate: '',
        dealId: '',
    })
    const [deals, setDeals] = useState([])
    const [currentUser, setCurrentUser] = useState('User')

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'medium',
                assignee: task.assignee || '',
                dueDate: task.dueDate || '',
                dealId: task.dealId || '',
            })
            setMode('view')
        } else {
            setMode('edit')
        }
        loadDeals()
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

    const setQuickDate = (days) => {
        const date = new Date()
        date.setDate(date.getDate() + days)
        const dateStr = date.toISOString().split('T')[0]
        handleChange('dueDate', dateStr)
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

    const selectedDeal = deals.find(d => d.id === formData.dealId)
    const selectedPriority = PRIORITIES.find(p => p.value === formData.priority)

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
                            </div>
                        </div>
                        <div className="header-actions">
                            {canEdit && (
                                <button
                                    className="edit-mode-btn"
                                    onClick={() => setMode('edit')}
                                    title="Edit Task"
                                >
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
                                <div className="detail-value">{formatDateDisplay(formData.dueDate)}</div>
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
            <div className="task-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="task-modal-header">
                    <div className="header-content">
                        <h2>{task ? '✏️ Edit Task' : '✨ New Task'}</h2>
                        <p>{task ? 'Update task details' : 'What needs to be done?'}</p>
                    </div>
                    <div className="header-actions">
                        {task && (
                            <button
                                className="view-mode-btn"
                                onClick={() => setMode('view')}
                                title="View Task"
                            >
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

                    {/* Date Selector */}
                    <div className="form-section">
                        <label><Calendar size={14} /> Due Date</label>
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
                            <div className="date-picker-row">
                                <input
                                    type="date"
                                    className="date-input"
                                    value={formData.dueDate}
                                    onChange={(e) => handleChange('dueDate', e.target.value)}
                                />
                                <div className="date-display">
                                    <Clock size={16} />
                                    <span>{formatDateDisplay(formData.dueDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div className="form-section">
                        <label><User size={14} /> Assign to</label>
                        <div className="assignee-grid">
                            <button
                                type="button"
                                className={`assignee-btn ${formData.assignee === '' ? 'active' : ''}`}
                                onClick={() => handleChange('assignee', '')}
                            >
                                <span className="assignee-avatar">?</span>
                                <span>Unassigned</span>
                            </button>
                            {teamMembers.map(member => {
                                const memberName = typeof member === 'string' ? member : member.name
                                const displayName = typeof member === 'string' ? member : (member.nickname || member.name)
                                const avatarUrl = typeof member === 'string' ? null : member.avatar_url

                                return (
                                    <button
                                        key={memberName}
                                        type="button"
                                        className={`assignee-btn ${formData.assignee === memberName ? 'active' : ''}`}
                                        onClick={() => handleChange('assignee', memberName)}
                                    >
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={displayName} className="assignee-avatar-img" />
                                        ) : (
                                            <span className="assignee-avatar">{memberName.charAt(0)}</span>
                                        )}
                                        <span>{displayName}</span>
                                    </button>
                                )
                            })}
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
                            {selectedDeal && (
                                <div className="deal-badge">
                                    💰 This task is linked to ${selectedDeal.value?.toLocaleString()} deal
                                </div>
                            )}
                        </div>
                    )}

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
                                className="submit-btn"
                                style={{ background: selectedPriority?.color }}
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
