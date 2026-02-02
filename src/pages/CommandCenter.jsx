import { useState, useEffect, useRef } from 'react'
import Header from '../components/layout/Header'
import LoadingSkeleton from '../styles/LoadingSkeleton'
import {
    Activity,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Clock,
    Zap,
    Target,
    Plus,
    ArrowRight,
    Sparkles,
    BarChart3,
    Calendar,
    FileText,
    UserPlus
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './CommandCenter.css'

// Animated counter hook
function useAnimatedCounter(end, duration = 1500) {
    const [count, setCount] = useState(0)
    const countRef = useRef(null)

    useEffect(() => {
        if (end === 0) {
            setCount(0)
            return
        }

        let startTime = null
        const startValue = 0

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(startValue + (end - startValue) * easeOut))

            if (progress < 1) {
                countRef.current = requestAnimationFrame(animate)
            }
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
        totalRevenue: 0,
        monthlyTarget: 150000,
        activeDeals: 0,
        tasksCompleted: 0,
        tasksPending: 0,
        teamOnline: 0,
        newLeads: 0
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [teamStatus, setTeamStatus] = useState([])
    const [pipeline, setPipeline] = useState([])
    const [todayTasks, setTodayTasks] = useState([])

    // Animated values
    const animatedRevenue = useAnimatedCounter(stats.totalRevenue)
    const animatedDeals = useAnimatedCounter(stats.activeDeals)
    const animatedCompleted = useAnimatedCounter(stats.tasksCompleted)
    const animatedTeam = useAnimatedCounter(stats.teamOnline)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        if (!isSupabaseConfigured) {
            // Enhanced mock data
            setStats({
                totalRevenue: 127500,
                monthlyTarget: 150000,
                activeDeals: 18,
                tasksCompleted: 47,
                tasksPending: 12,
                teamOnline: 4,
                newLeads: 8
            })
            setPipeline([
                { stage: 'Lead', count: 24, value: 48000, color: '#6366f1' },
                { stage: 'Qualified', count: 12, value: 36000, color: '#8b5cf6' },
                { stage: 'Proposal', count: 8, value: 64000, color: '#d4af37' },
                { stage: 'Negotiation', count: 4, value: 52000, color: '#22c55e' },
            ])
            setTodayTasks([
                { id: 1, title: 'Follow up with TechCorp', priority: 'high', time: '10:00 AM' },
                { id: 2, title: 'Prepare proposal deck', priority: 'urgent', time: '2:00 PM' },
                { id: 3, title: 'Team sync call', priority: 'medium', time: '4:00 PM' },
            ])
            setRecentActivity([
                { id: 1, user: 'Sarah', avatar: null, action: 'closed deal', target: 'TechCorp ($12,500)', time: '5 mins ago', type: 'deal' },
                { id: 2, user: 'Marco', avatar: null, action: 'completed', target: 'Client Onboarding', time: '15 mins ago', type: 'task' },
                { id: 3, user: 'System', avatar: null, action: 'new lead', target: 'Enterprise Solutions', time: '32 mins ago', type: 'lead' },
                { id: 4, user: 'Alex', avatar: null, action: 'sent proposal', target: 'DataFlow Inc', time: '1 hour ago', type: 'deal' },
            ])
            setTeamStatus([
                { name: 'Sarah', status: 'Online', action: 'Closing deals', avatar: null, color: '#22c55e' },
                { name: 'Marco', status: 'Online', action: 'On a call', avatar: null, color: '#3b82f6' },
                { name: 'Alex', status: 'Away', action: 'In meeting', avatar: null, color: '#f59e0b' },
                { name: 'Zeus', status: 'Online', action: 'Command Center', avatar: null, color: '#d4af37' },
            ])
            setLoading(false)
            return
        }

        try {
            const { data: deals } = await supabase.from('deals').select('*')
            const { data: tasks } = await supabase.from('tasks').select('*')
            const { data: team } = await supabase.from('team_members').select('*')

            const revenue = deals?.filter(d => d.stage === 'closed_won').reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0) || 0
            const activeDeals = deals?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length || 0
            const completed = tasks?.filter(t => t.status === 'done').length || 0
            const pending = tasks?.filter(t => t.status !== 'done').length || 0

            setStats({
                totalRevenue: revenue,
                monthlyTarget: 150000,
                activeDeals: activeDeals,
                tasksCompleted: completed,
                tasksPending: pending,
                teamOnline: team?.length || 0,
                newLeads: deals?.filter(d => d.stage === 'lead').length || 0
            })

            // Build pipeline
            const stages = ['lead', 'qualified', 'proposal', 'negotiation']
            const stageColors = { lead: '#6366f1', qualified: '#8b5cf6', proposal: '#d4af37', negotiation: '#22c55e' }
            const pipelineData = stages.map(s => ({
                stage: s.charAt(0).toUpperCase() + s.slice(1),
                count: deals?.filter(d => d.stage === s).length || 0,
                value: deals?.filter(d => d.stage === s).reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0) || 0,
                color: stageColors[s]
            }))
            setPipeline(pipelineData)

            // Today's tasks
            const today = new Date().toISOString().split('T')[0]
            const todayItems = tasks?.filter(t => t.due_date === today && t.status !== 'done').slice(0, 3) || []
            setTodayTasks(todayItems.map(t => ({
                id: t.id,
                title: t.title,
                priority: t.priority,
                time: t.due_time || 'Today'
            })))

            // Activity
            const activities = []
            if (tasks?.length) {
                const recent = tasks.slice(0, 2)
                recent.forEach((t, i) => {
                    activities.push({
                        id: `t${i}`,
                        user: t.assignee_name || 'Team',
                        action: t.status === 'done' ? 'completed' : 'updated',
                        target: t.title,
                        time: 'Recently',
                        type: 'task'
                    })
                })
            }
            setRecentActivity(activities)
            setTeamStatus(team?.map(m => ({
                name: m.nickname || m.name,
                status: 'Active',
                action: 'Online',
                avatar: m.avatar_url,
                color: '#22c55e'
            })) || [])

        } catch (error) {
            console.error('Error loading ECC:', error)
        }
        setLoading(false)
    }

    const quickActions = [
        { label: 'New Task', icon: Plus, path: '/tasks', color: '#3b82f6' },
        { label: 'Add Deal', icon: DollarSign, path: '/pipeline', color: '#22c55e' },
        { label: 'New Note', icon: FileText, path: '/notes', color: '#f59e0b' },
        { label: 'Add Lead', icon: UserPlus, path: '/clients', color: '#8b5cf6' },
    ]

    const getActivityIcon = (type) => {
        switch (type) {
            case 'deal': return <DollarSign size={14} />
            case 'task': return <CheckCircle size={14} />
            case 'lead': return <Target size={14} />
            default: return <Activity size={14} />
        }
    }

    const getActivityColor = (type) => {
        switch (type) {
            case 'deal': return '#22c55e'
            case 'task': return '#3b82f6'
            case 'lead': return '#8b5cf6'
            default: return '#6b7280'
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return '#ef4444'
            case 'high': return '#f59e0b'
            case 'medium': return '#3b82f6'
            default: return '#6b7280'
        }
    }

    const revenueProgress = Math.min((stats.totalRevenue / stats.monthlyTarget) * 100, 100)

    if (loading) return <LoadingSkeleton type="dashboard" count={1} />

    return (
        <>
            <Header title="Executive Command Center" />
            <div className="ecc-container">
                {/* Hero Header */}
                <div className="ecc-hero">
                    <div className="hero-content">
                        <div className="hero-greeting">
                            <Sparkles size={24} className="sparkle-icon" />
                            <h1>Mission Control</h1>
                        </div>
                        <p>Real-time operational intelligence at your fingertips</p>
                    </div>
                    <div className="hero-actions">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                className="quick-action-btn"
                                onClick={() => navigate(action.path)}
                                style={{ '--action-color': action.color }}
                            >
                                <action.icon size={16} />
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="bento-grid">
                    {/* Revenue Card - Large */}
                    <div className="bento-card revenue-card">
                        <div className="card-glow"></div>
                        <div className="card-header">
                            <div className="card-icon revenue">
                                <DollarSign size={20} />
                            </div>
                            <span className="card-label">Total Revenue</span>
                        </div>
                        <div className="card-value">${animatedRevenue.toLocaleString()}</div>
                        <div className="revenue-progress">
                            <div className="progress-label">
                                <span>Monthly Target</span>
                                <span>${stats.monthlyTarget.toLocaleString()}</span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${revenueProgress}%` }}
                                ></div>
                            </div>
                            <div className="progress-percent">{Math.round(revenueProgress)}% achieved</div>
                        </div>
                        <div className="card-trend up">
                            <TrendingUp size={14} />
                            <span>+12.5% vs last month</span>
                        </div>
                    </div>

                    {/* Deals Card */}
                    <div className="bento-card">
                        <div className="card-header">
                            <div className="card-icon deals">
                                <Zap size={20} />
                            </div>
                            <span className="card-label">Active Deals</span>
                        </div>
                        <div className="card-value">{animatedDeals}</div>
                        <div className="card-trend neutral">
                            <BarChart3 size={14} />
                            <span>Pipeline healthy</span>
                        </div>
                    </div>

                    {/* Tasks Card */}
                    <div className="bento-card">
                        <div className="card-header">
                            <div className="card-icon tasks">
                                <CheckCircle size={20} />
                            </div>
                            <span className="card-label">Tasks Done</span>
                        </div>
                        <div className="card-value">{animatedCompleted}</div>
                        <div className="card-substat">
                            <Clock size={12} />
                            <span>{stats.tasksPending} pending</span>
                        </div>
                        <div className="card-trend up">
                            <TrendingUp size={14} />
                            <span>+8% this week</span>
                        </div>
                    </div>

                    {/* Team Card */}
                    <div className="bento-card">
                        <div className="card-header">
                            <div className="card-icon team">
                                <Users size={20} />
                            </div>
                            <span className="card-label">Team Online</span>
                        </div>
                        <div className="card-value">{animatedTeam}</div>
                        <div className="team-dots">
                            {teamStatus.slice(0, 4).map((m, i) => (
                                <div
                                    key={i}
                                    className="team-dot"
                                    style={{ '--dot-color': m.color }}
                                    title={m.name}
                                >
                                    {m.name.charAt(0)}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pipeline Mini - Wide */}
                    <div className="bento-card pipeline-card">
                        <div className="card-header">
                            <div className="card-icon pipeline">
                                <BarChart3 size={20} />
                            </div>
                            <span className="card-label">Deal Pipeline</span>
                            <button className="card-action" onClick={() => navigate('/pipeline')}>
                                View All <ArrowRight size={14} />
                            </button>
                        </div>
                        <div className="pipeline-funnel">
                            {pipeline.map((stage, i) => (
                                <div key={i} className="funnel-stage" style={{ '--stage-color': stage.color }}>
                                    <div className="stage-bar">
                                        <div className="stage-fill" style={{ height: `${Math.max(20, (stage.count / 30) * 100)}%` }}></div>
                                    </div>
                                    <div className="stage-info">
                                        <span className="stage-name">{stage.stage}</span>
                                        <span className="stage-count">{stage.count}</span>
                                        <span className="stage-value">${(stage.value / 1000).toFixed(0)}k</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Today's Focus */}
                    <div className="bento-card focus-card">
                        <div className="card-header">
                            <div className="card-icon focus">
                                <Target size={20} />
                            </div>
                            <span className="card-label">Today's Focus</span>
                        </div>
                        <div className="focus-list">
                            {todayTasks.length === 0 ? (
                                <div className="focus-empty">
                                    <CheckCircle size={24} />
                                    <span>All caught up!</span>
                                </div>
                            ) : (
                                todayTasks.map((task, i) => (
                                    <div key={task.id} className="focus-item">
                                        <div
                                            className="focus-priority"
                                            style={{ background: getPriorityColor(task.priority) }}
                                        ></div>
                                        <span className="focus-title">{task.title}</span>
                                        <span className="focus-time">{task.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bento-card activity-card">
                        <div className="card-header">
                            <div className="live-dot"></div>
                            <span className="card-label">Live Activity</span>
                        </div>
                        <div className="activity-list">
                            {recentActivity.map(item => (
                                <div key={item.id} className="activity-row">
                                    <div
                                        className="activity-avatar"
                                        style={{ '--avatar-color': getActivityColor(item.type) }}
                                    >
                                        {getActivityIcon(item.type)}
                                    </div>
                                    <div className="activity-info">
                                        <span className="activity-text">
                                            <strong>{item.user}</strong> {item.action} <span className="highlight">{item.target}</span>
                                        </span>
                                        <span className="activity-time">{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team Pulse */}
                    <div className="bento-card pulse-card">
                        <div className="card-header">
                            <div className="card-icon pulse">
                                <Activity size={20} />
                            </div>
                            <span className="card-label">Team Pulse</span>
                        </div>
                        <div className="pulse-list">
                            {teamStatus.map((member, i) => (
                                <div key={i} className="pulse-row">
                                    <div className="pulse-avatar" style={{ '--pulse-color': member.color }}>
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} />
                                        ) : (
                                            member.name.charAt(0)
                                        )}
                                    </div>
                                    <div className="pulse-info">
                                        <span className="pulse-name">{member.name}</span>
                                        <span className="pulse-action">{member.action}</span>
                                    </div>
                                    <div className="pulse-status" style={{ '--status-color': member.color }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
