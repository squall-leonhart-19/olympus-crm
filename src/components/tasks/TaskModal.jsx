import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign, Calendar, User, Flag, FileText, ListTodo } from 'lucide-react'
import TaskComments from './TaskComments'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './TaskModal.css'

const PRIORITIES = [
    { value: 'low', label: 'Low', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { value: 'high', label: 'High', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
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
        } catch (e) {
            // Table might not exist yet
        }
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

    const selectedDeal = deals.find(d => d.id === formData.dealId)
    const selectedPriority = PRIORITIES.find(p => p.value === formData.priority)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content task-modal-premium" onClick={e => e.stopPropagation()}>
                {/* Premium Header */}
                <div className="task-modal-header">
                    <div className="task-modal-icon">
                        <ListTodo size={24} />
                    </div>
                    <div className="task-modal-title-area">
                        <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
                        <p>{task ? 'Update the task details below' : 'Add a new task to your board'}</p>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="task-form">
                    {/* Title */}
                    <div className="form-group">
                        <label>
                            <FileText size={14} />
                            Task Title
                        </label>
                        <input
                            type="text"
                            className="input input-large"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="What needs to be done?"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="input textarea"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add more details..."
                            rows={3}
                        />
                    </div>

                    {/* Priority Selector - Cards */}
                    <div className="form-group">
                        <label>
                            <Flag size={14} />
                            Priority
                        </label>
                        <div className="priority-selector">
                            {PRIORITIES.map(p => (
                                <div
                                    key={p.value}
                                    className={`priority-option ${formData.priority === p.value ? 'selected' : ''}`}
                                    style={{
                                        '--priority-color': p.color,
                                        '--priority-bg': p.bg
                                    }}
                                    onClick={() => handleChange('priority', p.value)}
                                >
                                    <div className="priority-dot" style={{ background: p.color }} />
                                    <span>{p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-row">
                        {/* Assignee */}
                        <div className="form-group">
                            <label>
                                <User size={14} />
                                Assignee
                            </label>
                            <select
                                className="input"
                                value={formData.assignee}
                                onChange={(e) => handleChange('assignee', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map(member => (
                                    <option key={member} value={member}>{member}</option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div className="form-group">
                            <label>
                                <Calendar size={14} />
                                Due Date
                            </label>
                            <input
                                type="date"
                                className="input"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Deal Linking */}
                    {deals.length > 0 && (
                        <div className="form-group">
                            <label>
                                <DollarSign size={14} />
                                Link to Deal
                            </label>
                            <select
                                className="input"
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

                    {selectedDeal && (
                        <div className="deal-linked-banner">
                            <DollarSign size={16} />
                            <span>Linked to deal worth <strong>${selectedDeal.value?.toLocaleString()}</strong></span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="task-modal-actions">
                        {task && onDelete && (
                            <button type="button" className="btn btn-ghost delete-btn" onClick={onDelete}>
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}
                        <div className="action-buttons">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{
                                    background: selectedPriority?.color || 'var(--gold-primary)'
                                }}
                            >
                                {task ? 'Save Changes' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Comments Section - only show for existing tasks */}
                {task && task.id && (
                    <TaskComments taskId={task.id} currentUser={currentUser} />
                )}
            </div>
        </div>
    )
}
