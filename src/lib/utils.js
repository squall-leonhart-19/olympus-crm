// Date formatting
export const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })
}

export const formatDateShort = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    })
}

export const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    })
}

export const formatRelativeTime = (date) => {
    if (!date) return ''
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDateShort(date)
}

// Number formatting
export const formatCurrency = (amount, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(amount || 0)
}

export const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0)
}

export const formatPercent = (value, decimals = 0) => {
    return `${(value || 0).toFixed(decimals)}%`
}

// Task helpers
export const getStatusLabel = (status) => {
    const labels = {
        todo: 'To Do',
        in_progress: 'In Progress',
        review: 'Review',
        done: 'Done'
    }
    return labels[status] || status
}

export const getPriorityLabel = (priority) => {
    const labels = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
    }
    return labels[priority] || priority
}

// Pipeline helpers
export const getStageLabel = (stage) => {
    const labels = {
        lead: 'Lead',
        booked: 'Call Booked',
        taken: 'Call Taken',
        proposal: 'Proposal Sent',
        closed_won: 'Closed Won',
        closed_lost: 'Closed Lost'
    }
    return labels[stage] || stage
}

// Utility
export const cn = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

export const generateId = () => {
    return Math.random().toString(36).substr(2, 9)
}

export const debounce = (fn, delay) => {
    let timeoutId
    return (...args) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
    }
}

// Due date status
export const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((due - today) / 86400000)

    if (diffDays < 0) return 'overdue'
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'tomorrow'
    if (diffDays <= 7) return 'soon'
    return 'later'
}
