import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign } from 'lucide-react'
import TaskComments from './TaskComments'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './TaskModal.css'

const PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
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
        const { data } = await supabase
            .from('deals')
            .select('id, title, value, stage')
            .in('stage', ['lead', 'booked', 'taken', 'proposal'])
            .order('value', { ascending: false })
        if (data) setDeals(data)
    }

    const loadCurrentUser = async () => {
        if (!isSupabaseConfigured) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.name) {
            setCurrentUser(user.user_metadata.name)
        } else if (user?.email) {
            setCurrentUser(user.email.split('@')[0])
        }
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

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content task-modal-large" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{task ? 'Edit Task' : 'New Task'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Title</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Task title..."
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="input textarea"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Assignee</label>
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

                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                className="input"
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Due Date</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <DollarSign size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
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
                    </div>

                    {selectedDeal && (
                        <div className="deal-linked-banner">
                            <DollarSign size={16} />
                            <span>Linked to deal worth <strong>${selectedDeal.value?.toLocaleString()}</strong></span>
                        </div>
                    )}

                    <div className="modal-actions">
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
                            <button type="submit" className="btn btn-primary">
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
