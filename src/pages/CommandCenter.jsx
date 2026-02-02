import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import LoadingSkeleton from '../styles/LoadingSkeleton'
import {
    Activity,
    DollarSign,
    Users,
    TrendingUp,
    CheckCircle,
    Clock,
    Zap,
    Target
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './CommandCenter.css'

export default function CommandCenter() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRevenue: 0,
        activeDeals: 0,
        tasksCompleted: 0,
        teamOnline: 0
    })
    const [recentActivity, setRecentActivity] = useState([])
    const [teamStatus, setTeamStatus] = useState([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        if (!isSupabaseConfigured) {
            // Mock data for demo
            setStats({
                totalRevenue: 125000,
                activeDeals: 14,
                tasksCompleted: 45,
                teamOnline: 3
            })
            setRecentActivity([
                { id: 1, user: 'Sarah', action: 'closed a deal', target: 'TechCorp ($5k)', time: '10 mins ago', type: 'deal' },
                { id: 2, user: 'Mike', action: 'completed task', target: 'Client Onboarding', time: '25 mins ago', type: 'task' },
                { id: 3, user: 'System', action: 'new lead', target: 'Global Services', time: '1 hour ago', type: 'lead' },
            ])
            setTeamStatus([
                { name: 'Sarah', status: 'Online', action: 'In a meeting', avatar: null },
                { name: 'Mike', status: 'Online', action: 'Working on tasks', avatar: null },
                { name: 'Zeus', status: 'Online', action: 'Command Center', avatar: null },
            ])
            setLoading(false)
            return
        }

        try {
            // Fetch real data
            const { data: deals } = await supabase.from('deals').select('*')
            const { data: tasks } = await supabase.from('tasks').select('*')
            const { data: team } = await supabase.from('team_members').select('*')

            const revenue = deals?.filter(d => d.stage === 'closed_won').reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0) || 0
            const activeDeals = deals?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length || 0
            const completed = tasks?.filter(t => t.status === 'done').length || 0

            setStats({
                totalRevenue: revenue,
                activeDeals: activeDeals,
                tasksCompleted: completed,
                teamOnline: team?.length || 0 // Just count all for now
            })

            // Mock activity feed based on recent items
            // In a real app we'd have an activity_log table
            const activities = []
            if (tasks?.length) {
                const recentTask = tasks[0]
                activities.push({
                    id: 't1',
                    user: recentTask.assignee_name || 'Someone',
                    action: 'updated task',
                    target: recentTask.title,
                    time: 'Just now',
                    type: 'task'
                })
            }
            if (deals?.length) {
                const recentDeal = deals[0]
                activities.push({
                    id: 'd1',
                    user: 'Sales Team',
                    action: 'updated deal',
                    target: recentDeal.title,
                    time: 'Recently',
                    type: 'deal'
                })
            }
            setRecentActivity(activities)
            setTeamStatus(team?.map(m => ({ name: m.nickname || m.name, status: 'Active', action: 'Online', avatar: m.avatar_url })) || [])

        } catch (error) {
            console.error('Error loading ECC:', error)
        }
        setLoading(false)
    }

    if (loading) return <LoadingSkeleton type="dashboard" count={1} />

    return (
        <>
            <Header title="Executive Command Center" />
            <div className="ecc-container">
                <div className="ecc-header">
                    <h1>Mission Control</h1>
                    <p>Live operational status and high-level metrics.</p>
                </div>

                <div className="ecc-grid">
                    <div className="ecc-card">
                        <div className="ecc-card-label">
                            <DollarSign size={16} /> Total Revenue
                        </div>
                        <div className="ecc-card-value">${stats.totalRevenue.toLocaleString()}</div>
                        <div className="ecc-card-trend up">
                            <TrendingUp size={14} /> +12% this month
                        </div>
                    </div>
                    <div className="ecc-card">
                        <div className="ecc-card-label">
                            <Zap size={16} /> Active Deals
                        </div>
                        <div className="ecc-card-value">{stats.activeDeals}</div>
                        <div className="ecc-card-trend neutral">
                            <Activity size={14} /> Pipeline healthy
                        </div>
                    </div>
                    <div className="ecc-card">
                        <div className="ecc-card-label">
                            <CheckCircle size={16} /> Tasks Done
                        </div>
                        <div className="ecc-card-value">{stats.tasksCompleted}</div>
                        <div className="ecc-card-trend up">
                            <TrendingUp size={14} /> +5% vs last week
                        </div>
                    </div>
                    <div className="ecc-card">
                        <div className="ecc-card-label">
                            <Users size={16} /> Team Online
                        </div>
                        <div className="ecc-card-value">{stats.teamOnline}</div>
                        <div className="ecc-card-trend up">
                            <Activity size={14} /> All systems go
                        </div>
                    </div>
                </div>

                <div className="ecc-pulse-section">
                    <div className="ecc-panel">
                        <h3><span className="live-indicator"></span> Live Activity Feed</h3>
                        <div className="activity-feed">
                            {recentActivity.map(item => (
                                <div key={item.id} className="activity-item">
                                    <div className="activity-icon">
                                        {item.type === 'deal' ? <DollarSign size={16} /> :
                                            item.type === 'task' ? <CheckCircle size={16} /> : <Target size={16} />}
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">
                                            <strong>{item.user}</strong> {item.action} <span className="activity-highlight">{item.target}</span>
                                        </div>
                                        <div className="activity-time">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="ecc-panel">
                        <h3>Team Pulse</h3>
                        <div className="team-pulse-grid">
                            {teamStatus.map((member, i) => (
                                <div key={i} className="pulse-member">
                                    <div className="member-avatar">
                                        {member.avatar ? <img src={member.avatar} alt={member.name} /> : member.name.charAt(0)}
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{member.name}</span>
                                        <span className="member-status">{member.action}</span>
                                    </div>
                                    <Activity size={14} className="text-success" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
