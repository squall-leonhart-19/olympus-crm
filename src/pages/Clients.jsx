import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import { Users, UserCheck, AlertTriangle, Star, Plus, UserPlus, Trash2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Clients.css'

const getStatusBadge = (status) => {
    const styles = {
        active: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Active' },
        onboarding: { bg: 'var(--info-bg)', color: 'var(--info)', label: 'Onboarding' },
        at_risk: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'At Risk' },
        churned: { bg: 'var(--bg-elevated)', color: 'var(--text-muted)', label: 'Churned' },
    }
    return styles[status] || styles.active
}

const getHealthColor = (score) => {
    if (score >= 70) return 'var(--success)'
    if (score >= 40) return 'var(--warning)'
    return 'var(--danger)'
}

export default function Clients() {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadClients()
    }, [])

    const loadClients = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        try {
            const { data } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) {
                setClients(data)
            }
        } catch (e) {
            console.error('Error loading clients:', e)
        }
        setLoading(false)
    }

    const deleteClient = async (clientId, clientName) => {
        if (!confirm(`Delete client "${clientName}"? This cannot be undone.`)) return

        if (isSupabaseConfigured) {
            try {
                await supabase.from('clients').delete().eq('id', clientId)
            } catch (e) {
                console.error('Error deleting client:', e)
            }
        }
        setClients(prev => prev.filter(c => c.id !== clientId))
    }

    const totalClients = clients.length
    const activeClients = clients.filter(c => c.status === 'active').length
    const atRiskClients = clients.filter(c => c.status === 'at_risk').length
    const totalLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0)

    if (loading) {
        return (
            <>
                <Header title="Clients" />
                <div className="page-content">
                    <div className="loading-state">Loading clients...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Clients" />
            <div className="page-content">
                {/* Metrics */}
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
                            <div className="metric-value">${totalLTV > 0 ? (totalLTV / 1000).toFixed(1) + 'K' : '0'}</div>
                            <div className="metric-label">Total LTV</div>
                        </div>
                    </div>
                </div>

                {clients.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No clients yet</h3>
                        <p>Add your first client to start tracking customer relationships</p>
                        <button className="btn btn-primary">
                            <UserPlus size={18} />
                            Add Client
                        </button>
                    </div>
                ) : (
                    <div className="clients-table-wrapper">
                        <table className="clients-table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Status</th>
                                    <th>Health Score</th>
                                    <th>LTV</th>
                                    <th style={{ width: '60px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map(client => (
                                    <tr key={client.id}>
                                        <td>
                                            <div className="client-info">
                                                <div className="client-avatar">{client.name?.charAt(0) || '?'}</div>
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
                                                {getStatusBadge(client.status).label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="health-score">
                                                <div className="health-bar">
                                                    <div
                                                        className="health-fill"
                                                        style={{
                                                            width: `${client.health_score || 0}%`,
                                                            background: getHealthColor(client.health_score || 0)
                                                        }}
                                                    />
                                                </div>
                                                <span style={{ color: getHealthColor(client.health_score || 0) }}>
                                                    {client.health_score || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="ltv-value">${(client.ltv || 0).toLocaleString()}</td>
                                        <td>
                                            <button
                                                className="client-delete-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    deleteClient(client.id, client.name)
                                                }}
                                                title="Delete client"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}
