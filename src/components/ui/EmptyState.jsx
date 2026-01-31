import { Plus } from 'lucide-react'
import './EmptyState.css'

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryLabel,
    onSecondary
}) {
    return (
        <div className="empty-state-container">
            <div className="empty-state-icon">
                {icon}
            </div>
            <h3 className="empty-state-title">{title}</h3>
            <p className="empty-state-description">{description}</p>
            <div className="empty-state-actions">
                {actionLabel && onAction && (
                    <button className="btn btn-primary" onClick={onAction}>
                        <Plus size={18} />
                        {actionLabel}
                    </button>
                )}
                {secondaryLabel && onSecondary && (
                    <button className="btn btn-secondary" onClick={onSecondary}>
                        {secondaryLabel}
                    </button>
                )}
            </div>
        </div>
    )
}
