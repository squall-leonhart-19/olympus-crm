import Header from '../components/layout/Header'
import {
    TrendingUp,
    CheckCircle,
    Clock,
    AlertTriangle,
    DollarSign,
    Phone,
    Users,
    Target
} from 'lucide-react'
import './Dashboard.css'

// Demo data for initial display
const DEMO_METRICS = {
    tasksCompleted: 28,
    tasksCompletedTrend: 12,
    onTimeRate: 92,
    onTimeRateTrend: 5,
    overdueTasks: 3,
    overdueTrend: -2,
    revenue: 18000,
    revenueTrend: 15,
    callsTaken: 24,
    showRate: 80,
    pipelineValue: 54000,
    newLeads: 47
}

const MetricCard = ({ icon: Icon, label, value, trend, trendDirection, format = 'number' }) => {
    const formattedValue = format === 'currency'
        ? `$${(value / 1000).toFixed(0)}K`
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
                {trend !== undefined && (
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
    return (
        <>
            <Header title="Dashboard" />
            <div className="page-content">
                <div className="dashboard-header">
                    <h2>This Week at a Glance</h2>
                    <span className="date-range">Jan 27 - Feb 2</span>
                </div>

                <div className="metrics-grid">
                    <MetricCard
                        icon={CheckCircle}
                        label="Tasks Completed"
                        value={DEMO_METRICS.tasksCompleted}
                        trend={DEMO_METRICS.tasksCompletedTrend}
                    />
                    <MetricCard
                        icon={Target}
                        label="On-Time Rate"
                        value={DEMO_METRICS.onTimeRate}
                        format="percent"
                        trend={DEMO_METRICS.onTimeRateTrend}
                    />
                    <MetricCard
                        icon={AlertTriangle}
                        label="Overdue Tasks"
                        value={DEMO_METRICS.overdueTasks}
                        trend={DEMO_METRICS.overdueTrend}
                        trendDirection="down"
                    />
                    <MetricCard
                        icon={DollarSign}
                        label="Revenue"
                        value={DEMO_METRICS.revenue}
                        format="currency"
                        trend={DEMO_METRICS.revenueTrend}
                    />
                </div>

                <div className="dashboard-section">
                    <h3>Sales Pipeline</h3>
                    <div className="pipeline-metrics">
                        <div className="pipeline-stat">
                            <Users size={20} />
                            <div>
                                <span className="stat-value">{DEMO_METRICS.newLeads}</span>
                                <span className="stat-label">New Leads</span>
                            </div>
                        </div>
                        <div className="pipeline-stat">
                            <Phone size={20} />
                            <div>
                                <span className="stat-value">{DEMO_METRICS.callsTaken}</span>
                                <span className="stat-label">Calls Taken</span>
                            </div>
                        </div>
                        <div className="pipeline-stat">
                            <Target size={20} />
                            <div>
                                <span className="stat-value">{DEMO_METRICS.showRate}%</span>
                                <span className="stat-label">Show Rate</span>
                            </div>
                        </div>
                        <div className="pipeline-stat">
                            <DollarSign size={20} />
                            <div>
                                <span className="stat-value">${(DEMO_METRICS.pipelineValue / 1000).toFixed(0)}K</span>
                                <span className="stat-label">Pipeline Value</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h3>⚠️ Attention Needed</h3>
                    <div className="alerts-list">
                        <div className="alert-item warning">
                            <Clock size={16} />
                            <span>3 overdue follow-ups need attention</span>
                        </div>
                        <div className="alert-item warning">
                            <AlertTriangle size={16} />
                            <span>2 proposals pending {'>'} 5 days</span>
                        </div>
                        <div className="alert-item info">
                            <Users size={16} />
                            <span>Marco's close rate dropped 10% this week</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
