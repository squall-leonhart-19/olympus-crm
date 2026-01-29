import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign, Calendar, User, Flag, FileText, Clock } from 'lucide-react'
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

export default function TaskModal({ task, teamMembers = [], onSave, onDelete, onClose }) {
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="task-modal-header">
                    <div className="header-content">
                        <h2>{task ? '✏️ Edit Task' : '✨ New Task'}</h2>
                        <p>{task ? 'Update task details' : 'What needs to be done?'}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
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
                            {teamMembers.map(member => (
                                <button
                                    key={member}
                                    type="button"
                                    className={`assignee-btn ${formData.assignee === member ? 'active' : ''}`}
                                    onClick={() => handleChange('assignee', member)}
                                >
                                    <span className="assignee-avatar">{member.charAt(0)}</span>
                                    <span>{member}</span>
                                </button>
                            ))}
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
                        {task && onDelete && (
                            <button type="button" className="delete-btn" onClick={onDelete}>
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}
                        <div className="action-group">
                            <button type="button" className="cancel-btn" onClick={onClose}>
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
