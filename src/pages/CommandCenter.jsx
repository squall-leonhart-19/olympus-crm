import { useState, useEffect, useRef } from 'react'
import Header from '../components/layout/Header'
import LoadingSkeleton from '../styles/LoadingSkeleton'
import {
    Activity,
    CheckCircle,
    Clock,
    AlertTriangle,
    Target,
    Plus,
    ArrowRight,
    Calendar,
    TrendingUp,
    Users,
    ListTodo
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './CommandCenter.css'

// Animated counter hook
function useAnimatedCounter(end, duration = 1000) {
    const [count, setCount] = useState(0)
    const countRef = useRef(null)

    useEffect(() => {
        if (end === 0) { setCount(0); return }
        let startTime = null
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            setCount(Math.floor(end * progress))
            if (progress < 1) countRef.current = requestAnimationFrame(animate)
        }
        countRef.current = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(countRef.current)
    }, [end, duration])

    return count
}

export default function CommandCenter() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        completed: 0,
        pending: 0,
        overdue: 0,
        dueToday: 0
    })
    const [todayTasks, setTodayTasks] = useState([])
    const [recentActivity, setRecentActivity] = useState([])
    const [teamTasks, setTeamTasks] = useState([])

    const animatedCompleted = useAnimatedCounter(stats.completed)
    const animatedPending = useAnimatedCounter(stats.pending)
    const animatedOverdue = useAnimatedCounter(stats.overdue)
    const animatedToday = useAnimatedCounter(stats.dueToday)

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        if (!isSupabaseConfigured) {
            // Demo data
            setStats({ completed: 47, pending: 12, overdue: 3, dueToday: 5 })
            setTodayTasks([
                { id: 1, title: 'Follow up with TechCorp lead', priority: 'high', assignee: 'Marco', time: '10:00 AM' },
                { id: 2, title: 'Prepare proposal deck', priority: 'urgent', assignee: 'Sarah', time: '2:00 PM' },
                { id: 3, title: 'Team sync call', priority: 'medium', assignee: 'All', time: '4:00 PM' },
                { id: 4, title: 'Review campaign metrics', priority: 'low', assignee: 'Alex', time: '5:00 PM' },
            ])
            setRecentActivity([
                { id: 1, user: 'Sarah', action: 'completed', task: 'Client Onboarding', time: '5 mins ago' },
                { id: 2, user: 'Marco', action: 'created', task: 'New Support Ticket', time: '12 mins ago' },
                { id: 3, user: 'Alex', action: 'updated', task: 'Campaign Report', time: '25 mins ago' },
            ])
            setTeamTasks([
                { name: 'Sarah', pending: 3, completed: 12 },
                { name: 'Marco', pending: 5, completed: 8 },
                { name: 'Alex', pending: 2, completed: 15 },
                { name: 'Zeus', pending: 4, completed: 10 },
            ])
            setLoading(false)
            return
        }

        try {
            const { data: tasks } = await supabase.from('tasks').select('*')
            const { data: team } = await supabase.from('team_members').select('*')

            const today = new Date().toISOString().split('T')[0]
            const now = new Date()

            const completed = tasks?.filter(t => t.status === 'done').length || 0
            const pending = tasks?.filter(t => t.status !== 'done').length || 0
            const overdue = tasks?.filter(t => {
                if (t.status === 'done' || !t.due_date) return false
                return new Date(t.due_date) < now
            }).length || 0
            const dueToday = tasks?.filter(t => t.due_date === today && t.status !== 'done').length || 0

            setStats({ completed, pending, overdue, dueToday })

            // Today's priority tasks
            const todayItems = tasks?.filter(t => t.status !== 'done')
                .sort((a, b) => {
                    const priority = { urgent: 0, high: 1, medium: 2, low: 3 }
                    return (priority[a.priority] || 3) - (priority[b.priority] || 3)
                })
                .slice(0, 5) || []

            setTodayTasks(todayItems.map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                assignee: t.assignee_name || 'Unassigned',
                time: t.due_time || (t.due_date === today ? 'Today' : t.due_date || 'No date')
            })))

            // Recent activity
            const recentTasks = tasks?.slice(0, 3) || []
            setRecentActivity(recentTasks.map((t, i) => ({
                id: t.id,
                user: t.assignee_name || 'Team',
                action: t.status === 'done' ? 'completed' : 'updated',
                task: t.title,
                time: 'Recently'
            })))

            // Team task counts
            const teamStats = {}
            tasks?.forEach(t => {
                const name = t.assignee_name || 'Unassigned'
                if (!teamStats[name]) teamStats[name] = { pending: 0, completed: 0 }
                if (t.status === 'done') teamStats[name].completed++
                else teamStats[name].pending++
            })
            setTeamTasks(Object.entries(teamStats).slice(0, 4).map(([name, data]) => ({
                name, ...data
            })))

        } catch (e) { console.error('ECC Error:', e) }
        setLoading(false)
    }

    const getPriorityColor = (p) => {
        switch (p) {
            case 'urgent': return '#ef4444'
            case 'high': return '#f59e0b'
            case 'medium': return '#3b82f6'
            default: return '#6b7280'
        }
    }

    if (loading) return <LoadingSkeleton type="dashboard" count={1} />

    return (
        <>
            <Header title="Executive Command Center" />
            <div className="ecc-container">
                {/* Header */}
                <div className="ecc-header">
                    <div>
                        <h1><Target size={24} /> Mission Control</h1>
                        <p>Task overview and team performance</p>
                    </div>
                    <button className="add-task-btn" onClick={() => navigate('/tasks')}>
                        <Plus size={18} /> New Task
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card completed">
                        <div className="stat-icon"><CheckCircle size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{animatedCompleted}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-trend up"><TrendingUp size={14} /> +8%</div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon"><ListTodo size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{animatedPending}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>
                    <div className="stat-card overdue">
                        <div className="stat-icon"><AlertTriangle size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{animatedOverdue}</span>
                            <span className="stat-label">Overdue</span>
                        </div>
                    </div>
                    <div className="stat-card today">
                        <div className="stat-icon"><Calendar size={24} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{animatedToday}</span>
                            <span className="stat-label">Due Today</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="ecc-main">
                    {/* Priority Tasks */}
                    <div className="ecc-panel priority-panel">
                        <div className="panel-header">
                            <h3><Target size={18} /> Priority Tasks</h3>
                            <button className="view-all" onClick={() => navigate('/tasks')}>
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="task-list">
                            {todayTasks.length === 0 ? (
                                <div className="empty-state">
                                    <CheckCircle size={32} />
                                    <span>All caught up! 🎉</span>
                                </div>
                            ) : (
                                todayTasks.map(task => (
                                    <div key={task.id} className="task-item" onClick={() => navigate('/tasks')}>
                                        <div className="task-priority" style={{ background: getPriorityColor(task.priority) }}></div>
                                        <div className="task-content">
                                            <span className="task-title">{task.title}</span>
                                            <span className="task-meta">{task.assignee} • {task.time}</span>
                                        </div>
                                        <span className="task-badge" style={{ color: getPriorityColor(task.priority) }}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="ecc-sidebar">
                        {/* Team Performance */}
                        <div className="ecc-panel team-panel">
                            <div className="panel-header">
                                <h3><Users size={18} /> Team Tasks</h3>
                            </div>
                            <div className="team-list">
                                {teamTasks.map((member, i) => (
                                    <div key={i} className="team-row">
                                        <div className="team-avatar">{member.name.charAt(0)}</div>
                                        <div className="team-info">
                                            <span className="team-name">{member.name}</span>
                                            <div className="team-stats">
                                                <span className="done">{member.completed} done</span>
                                                <span className="pending">{member.pending} pending</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity */}
                        <div className="ecc-panel activity-panel">
                            <div className="panel-header">
                                <h3><span className="live-dot"></span> Recent Activity</h3>
                            </div>
                            <div className="activity-list">
                                {recentActivity.map(item => (
                                    <div key={item.id} className="activity-row">
                                        <div className="activity-icon">
                                            <Activity size={14} />
                                        </div>
                                        <div className="activity-content">
                                            <span><strong>{item.user}</strong> {item.action} <em>{item.task}</em></span>
                                            <span className="activity-time">{item.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
