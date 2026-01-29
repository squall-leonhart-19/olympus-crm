import { useState, useEffect } from 'react'
import { X, Trash2, DollarSign } from 'lucide-react'
import '../tasks/TaskModal.css'

const STAGES = [
    { value: 'lead', label: 'Lead' },
    { value: 'booked', label: 'Call Booked' },
    { value: 'taken', label: 'Call Taken' },
    { value: 'proposal', label: 'Proposal Sent' },
    { value: 'closed_won', label: 'Closed Won' },
    { value: 'closed_lost', label: 'Closed Lost' },
]

const SOURCES = [
    'Facebook Ads',
    'Google Ads',
    'YouTube',
    'Instagram',
    'Referral',
    'Organic',
    'Cold Outreach',
    'Other'
]

const TEAM_MEMBERS = ['Marco', 'Giulia', 'Alex', 'Zeus']

export default function DealModal({ deal, onSave, onDelete, onClose }) {
    const [formData, setFormData] = useState({
        title: '',
        value: '',
        stage: 'lead',
        clientName: '',
        clientEmail: '',
        source: '',
        assignedTo: '',
        notes: '',
    })

    useEffect(() => {
        if (deal) {
            setFormData({
                title: deal.title || '',
                value: deal.value || '',
                stage: deal.stage || 'lead',
                clientName: deal.clientName || '',
                clientEmail: deal.clientEmail || '',
                source: deal.source || '',
                assignedTo: deal.assignedTo || '',
                notes: deal.notes || '',
            })
        }
    }, [deal])

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.title.trim()) return
        onSave({
            ...formData,
            value: parseFloat(formData.value) || 0
        })
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{deal ? 'Edit Deal' : 'New Deal'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>Deal Title</label>
                        <input
                            type="text"
                            className="input"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g. FM Certification - John Smith"
                            autoFocus
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Deal Value ($)</label>
                            <div className="input-with-icon">
                                <DollarSign size={16} />
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.value}
                                    onChange={(e) => handleChange('value', e.target.value)}
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Stage</label>
                            <select
                                className="input"
                                value={formData.stage}
                                onChange={(e) => handleChange('stage', e.target.value)}
                            >
                                {STAGES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Client Name</label>
                            <input
                                type="text"
                                className="input"
                                value={formData.clientName}
                                onChange={(e) => handleChange('clientName', e.target.value)}
                                placeholder="John Smith"
                            />
                        </div>

                        <div className="form-group">
                            <label>Client Email</label>
                            <input
                                type="email"
                                className="input"
                                value={formData.clientEmail}
                                onChange={(e) => handleChange('clientEmail', e.target.value)}
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Lead Source</label>
                            <select
                                className="input"
                                value={formData.source}
                                onChange={(e) => handleChange('source', e.target.value)}
                            >
                                <option value="">Select source...</option>
                                {SOURCES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assigned To</label>
                            <select
                                className="input"
                                value={formData.assignedTo}
                                onChange={(e) => handleChange('assignedTo', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {TEAM_MEMBERS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            className="input textarea"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Add notes about this deal..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        {deal && onDelete && (
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
                                {deal ? 'Save Changes' : 'Create Deal'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
