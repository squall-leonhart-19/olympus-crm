import './skeleton.css'

// Reusable skeleton components for loading states

export function SkeletonText({ width = 'full' }) {
    return <div className={`skeleton skeleton-text ${width}`} />
}

export function SkeletonTitle() {
    return <div className="skeleton skeleton-title" />
}

export function SkeletonAvatar({ size = 'medium' }) {
    const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : ''
    return <div className={`skeleton skeleton-avatar ${sizeClass}`} />
}

export function SkeletonButton() {
    return <div className="skeleton skeleton-button" />
}

// Task Card Skeleton
export function SkeletonTaskCard() {
    return (
        <div className="skeleton-task-card">
            <div className="skeleton-task-header">
                <div className="skeleton skeleton-avatar" style={{ width: 24, height: 24 }} />
                <SkeletonText width="medium" />
            </div>
            <SkeletonText width="full" />
            <SkeletonText width="short" />
        </div>
    )
}

// Task List Skeleton
export function SkeletonTaskList({ count = 4 }) {
    return (
        <div className="skeleton-task-list">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonTaskCard key={i} />
            ))}
        </div>
    )
}

// Metrics Grid Skeleton (for Dashboard)
export function SkeletonMetricsGrid({ count = 4 }) {
    return (
        <div className="skeleton-metrics-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton skeleton-metric-card" />
            ))}
        </div>
    )
}

// Team Grid Skeleton
export function SkeletonTeamGrid({ count = 3 }) {
    return (
        <div className="skeleton-team-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-team-card">
                    <div className="skeleton-team-header">
                        <div className="skeleton skeleton-avatar" style={{ width: 48, height: 48 }} />
                        <div style={{ flex: 1 }}>
                            <SkeletonText width="medium" />
                            <SkeletonText width="short" />
                        </div>
                    </div>
                    <div className="skeleton-team-stats">
                        <div className="skeleton skeleton-stat" />
                        <div className="skeleton skeleton-stat" />
                        <div className="skeleton skeleton-stat" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Pipeline Skeleton
export function SkeletonPipeline({ columns = 4 }) {
    return (
        <div className="skeleton-pipeline">
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="skeleton-column">
                    <div className="skeleton-column-header">
                        <SkeletonText width="medium" />
                    </div>
                    <div className="skeleton skeleton-deal-card" />
                    <div className="skeleton skeleton-deal-card" />
                </div>
            ))}
        </div>
    )
}

// Generic Loading Skeleton wrapper
export default function LoadingSkeleton({ type = 'tasks', count }) {
    switch (type) {
        case 'tasks':
            return <SkeletonTaskList count={count || 4} />
        case 'metrics':
            return <SkeletonMetricsGrid count={count || 4} />
        case 'team':
            return <SkeletonTeamGrid count={count || 3} />
        case 'pipeline':
            return <SkeletonPipeline columns={count || 4} />
        default:
            return <SkeletonTaskList count={count || 4} />
    }
}
