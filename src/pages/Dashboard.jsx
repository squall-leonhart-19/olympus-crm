import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import {
    TrendingUp,
    CheckCircle,
    Clock,
    AlertTriangle,
    DollarSign,
    Phone,
    Users,
    Target,
    Plus
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const MetricCard = ({ icon: Icon, label, value, trend, trendDirection, format = 'number' }) => {
    const formattedValue = format === 'currency'
        ? value >= 1000 ? `$${(value / 1000).toFixed(1)}K` : `$${value}`
        : format === 'percent'
            ? `${value}%`
            : value

    return (
        <div className="metric-card">
            <div className="metric-icon">
                <Icon size={24} />
            </div>
            <div className="metric-content">
                <div className="metric-value">{formattedValue}</div>
                <div className="metric-label">{label}</div>
                {trend !== undefined && trend !== 0 && (
                    <div className={`metric-trend ${trendDirection || (trend >= 0 ? 'up' : 'down')}`}>
                        <TrendingUp size={14} style={{ transform: trend < 0 ? 'rotate(180deg)' : 'none' }} />
                        {Math.abs(trend)}% vs last week
                    </div>
                )}
            </div>
        </div>
    )
}

export default function Dashboard() {
    const navigate = useNavigate()
    const [metrics, setMetrics] = useState({
        tasksCompleted: 0,
        onTimeRate: 0,
        overdueTasks: 0,
        revenue: 0,
        newLeads: 0,
        callsTaken: 0,
        showRate: 0,
        pipelineValue: 0
    })
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        try {
            // Load tasks metrics
            const { data: tasks } = await supabase.from('tasks').select('*')
            const completedTasks = tasks?.filter(t => t.status === 'done').length || 0
            const overdueTasks = tasks?.filter(t => {
                if (t.status === 'done') return false
                if (!t.due_date) return false
                return new Date(t.due_date) < new Date()
            }).length || 0
            const totalTasks = tasks?.length || 0
            const onTimeRate = totalTasks > 0 ? Math.round(((totalTasks - overdueTasks) / totalTasks) * 100) : 100

            // Load deals/pipeline metrics
            const { data: deals } = await supabase.from('deals').select('*')
            const wonDeals = deals?.filter(d => d.stage === 'closed_won') || []
            const revenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
            const pipelineDeals = deals?.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)) || []
            const pipelineValue = pipelineDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0)
            const newLeads = deals?.filter(d => d.stage === 'lead').length || 0

            // Load KPI data for show rate
            const { data: kpiLogs } = await supabase.from('kpi_daily_logs').select('*').order('log_date', { ascending: false }).limit(7)
            const totalSets = kpiLogs?.reduce((sum, log) => sum + (log.sets || 0), 0) || 0
            const totalShows = kpiLogs?.reduce((sum, log) => sum + (log.shows || 0), 0) || 0
            const showRate = totalSets > 0 ? Math.round((totalShows / totalSets) * 100) : 0

            setMetrics({
                tasksCompleted: completedTasks,
                onTimeRate,
                overdueTasks,
                revenue,
                newLeads,
                callsTaken: totalShows,
                showRate,
                pipelineValue
            })

            // Generate alerts
            const newAlerts = []
            if (overdueTasks > 0) {
                newAlerts.push({ type: 'warning', icon: Clock, text: `${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''} need attention` })
            }
            if (pipelineDeals.filter(d => d.stage === 'proposal').length > 0) {
                const proposalCount = pipelineDeals.filter(d => d.stage === 'proposal').length
                newAlerts.push({ type: 'warning', icon: AlertTriangle, text: `${proposalCount} proposal${proposalCount > 1 ? 's' : ''} waiting for response` })
            }
            if (showRate < 70 && totalSets > 0) {
                newAlerts.push({ type: 'warning', icon: Phone, text: `Show rate is ${showRate}% — below 70% target` })
            }
            setAlerts(newAlerts)

        } catch (error) {
            console.error('Error loading dashboard:', error)
        }

        setLoading(false)
    }

    const isEmpty = metrics.tasksCompleted === 0 && metrics.revenue === 0 && metrics.pipelineValue === 0

    return (
        <>
            <Header title="Dashboard" />
            <div className="page-content">
                <div className="dashboard-header">
                    <h2>This Week at a Glance</h2>
                    <span className="date-range">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {loading ? (
                    <div className="loading-state">Loading dashboard...</div>
                ) : isEmpty ? (
                    <div className="empty-dashboard">
                        <div className="empty-icon">🏛️</div>
                        <h3>Welcome to Olympus!</h3>
                        <p>Your dashboard will come alive once you start adding data.</p>
                        <div className="quick-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
                                <Plus size={18} /> Create First Task
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/pipeline')}>
                                <Plus size={18} /> Add First Deal
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="metrics-grid">
                            <MetricCard
                                icon={CheckCircle}
                                label="Tasks Completed"
                                value={metrics.tasksCompleted}
                            />
                            <MetricCard
                                icon={Target}
                                label="On-Time Rate"
                                value={metrics.onTimeRate}
                                format="percent"
                            />
                            <MetricCard
                                icon={AlertTriangle}
                                label="Overdue Tasks"
                                value={metrics.overdueTasks}
                            />
                            <MetricCard
                                icon={DollarSign}
                                label="Revenue"
                                value={metrics.revenue}
                                format="currency"
                            />
                        </div>

                        <div className="dashboard-section">
                            <h3>Sales Pipeline</h3>
                            <div className="pipeline-metrics">
                                <div className="pipeline-stat">
                                    <Users size={20} />
                                    <div>
                                        <span className="stat-value">{metrics.newLeads}</span>
                                        <span className="stat-label">New Leads</span>
                                    </div>
                                </div>
                                <div className="pipeline-stat">
                                    <Phone size={20} />
                                    <div>
                                        <span className="stat-value">{metrics.callsTaken}</span>
                                        <span className="stat-label">Calls Taken</span>
                                    </div>
                                </div>
                                <div className="pipeline-stat">
                                    <Target size={20} />
                                    <div>
                                        <span className="stat-value">{metrics.showRate}%</span>
                                        <span className="stat-label">Show Rate</span>
                                    </div>
                                </div>
                                <div className="pipeline-stat">
                                    <DollarSign size={20} />
                                    <div>
                                        <span className="stat-value">{metrics.pipelineValue >= 1000 ? `$${(metrics.pipelineValue / 1000).toFixed(0)}K` : `$${metrics.pipelineValue}`}</span>
                                        <span className="stat-label">Pipeline Value</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {alerts.length > 0 && (
                            <div className="dashboard-section">
                                <h3>⚠️ Attention Needed</h3>
                                <div className="alerts-list">
                                    {alerts.map((alert, i) => (
                                        <div key={i} className={`alert-item ${alert.type}`}>
                                            <alert.icon size={16} />
                                            <span>{alert.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    )
}
