import Header from '../components/layout/Header'
import { Users, UserCheck, AlertTriangle, Star } from 'lucide-react'
import './Clients.css'

const DEMO_CLIENTS = [
    { id: '1', name: 'Sarah Mitchell', email: 'sarah@example.com', status: 'active', healthScore: 85, ltv: 4997 },
    { id: '2', name: 'Michael Johnson', email: 'michael@example.com', status: 'onboarding', healthScore: 70, ltv: 997 },
    { id: '3', name: 'Emma Williams', email: 'emma@example.com', status: 'active', healthScore: 92, ltv: 2997 },
    { id: '4', name: 'David Brown', email: 'david@example.com', status: 'at_risk', healthScore: 35, ltv: 2997 },
    { id: '5', name: 'Jennifer Davis', email: 'jennifer@example.com', status: 'active', healthScore: 78, ltv: 1497 },
]

const getStatusBadge = (status) => {
    const styles = {
        active: { bg: 'var(--success-bg)', color: 'var(--success)' },
        onboarding: { bg: 'var(--info-bg)', color: 'var(--info)' },
        at_risk: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
        churned: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
    }
    return styles[status] || styles.active
}

const getHealthColor = (score) => {
    if (score >= 70) return 'var(--success)'
    if (score >= 40) return 'var(--warning)'
    return 'var(--danger)'
}

export default function Clients() {
    const totalClients = DEMO_CLIENTS.length
    const activeClients = DEMO_CLIENTS.filter(c => c.status === 'active').length
    const atRiskClients = DEMO_CLIENTS.filter(c => c.status === 'at_risk').length
    const totalLTV = DEMO_CLIENTS.reduce((sum, c) => sum + c.ltv, 0)

    return (
        <>
            <Header title="Clients" />
            <div className="page-content">
                <div className="clients-metrics">
                    <div className="metric-card">
                        <Users size={24} className="metric-icon-inline" />
                        <div>
                            <div className="metric-value">{totalClients}</div>
                            <div className="metric-label">Total Clients</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <UserCheck size={24} className="metric-icon-inline" />
                        <div>
                            <div className="metric-value">{activeClients}</div>
                            <div className="metric-label">Active</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <AlertTriangle size={24} className="metric-icon-inline" />
                        <div>
                            <div className="metric-value">{atRiskClients}</div>
                            <div className="metric-label">At Risk</div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <Star size={24} className="metric-icon-inline" />
                        <div>
                            <div className="metric-value">${(totalLTV / 1000).toFixed(1)}K</div>
                            <div className="metric-label">Total LTV</div>
                        </div>
                    </div>
                </div>

                <div className="clients-table-wrapper">
                    <table className="clients-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Status</th>
                                <th>Health Score</th>
                                <th>LTV</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_CLIENTS.map(client => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="client-info">
                                            <div className="client-avatar">{client.name.charAt(0)}</div>
                                            <div>
                                                <div className="client-name">{client.name}</div>
                                                <div className="client-email">{client.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: getStatusBadge(client.status).bg,
                                                color: getStatusBadge(client.status).color
                                            }}
                                        >
                                            {client.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="health-score">
                                            <div className="health-bar">
                                                <div
                                                    className="health-fill"
                                                    style={{
                                                        width: `${client.healthScore}%`,
                                                        background: getHealthColor(client.healthScore)
                                                    }}
                                                />
                                            </div>
                                            <span style={{ color: getHealthColor(client.healthScore) }}>
                                                {client.healthScore}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="ltv-value">${client.ltv.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
