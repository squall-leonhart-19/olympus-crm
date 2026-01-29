import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import { Trophy, Target, Clock, TrendingUp, UserPlus, X, Check, AlertCircle } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Team.css'

export default function Team() {
    const [teamMembers, setTeamMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'member', password: '' })
    const [inviteStatus, setInviteStatus] = useState({ loading: false, error: null, success: false })

    useEffect(() => {
        loadTeamMembers()
    }, [])

    const loadTeamMembers = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false)
            return
        }

        // Load team members
        const { data: members } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: true })

        // Load tasks for stats
        const { data: tasks } = await supabase.from('tasks').select('*')

        if (members) {
            const membersWithStats = members.map(member => {
                const memberTasks = tasks?.filter(t => t.assignee_name === member.name) || []
                const completed = memberTasks.filter(t => t.status === 'done').length
                const overdue = memberTasks.filter(t => {
                    if (t.status === 'done') return false
                    if (!t.due_date) return false
                    return new Date(t.due_date) < new Date()
                }).length
                const total = memberTasks.length
                const onTimeRate = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100

                return {
                    ...member,
                    tasksCompleted: completed,
                    onTimeRate,
                    overdue,
                    streak: 0 // Would need daily tracking for real streak
                }
            })
            setTeamMembers(membersWithStats)
        }
        setLoading(false)
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        setInviteStatus({ loading: true, error: null, success: false })

        try {
            // Create user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteForm.email,
                password: inviteForm.password,
                options: {
                    data: { name: inviteForm.name }
                }
            })

            if (authError) throw authError

            // Add to team_members table
            const { error: dbError } = await supabase
                .from('team_members')
                .insert({
                    email: inviteForm.email,
                    name: inviteForm.name,
                    role: inviteForm.role,
                })

            if (dbError) throw dbError

            setInviteStatus({ loading: false, error: null, success: true })

            setTimeout(() => {
                loadTeamMembers()
                setShowInviteModal(false)
                setInviteForm({ name: '', email: '', role: 'member', password: '' })
                setInviteStatus({ loading: false, error: null, success: false })
            }, 1500)

        } catch (error) {
            setInviteStatus({ loading: false, error: error.message, success: false })
        }
    }

    const sortedByTasks = [...teamMembers].sort((a, b) => b.tasksCompleted - a.tasksCompleted)

    if (loading) {
        return (
            <>
                <Header title="Team" />
                <div className="page-content">
                    <div className="loading-state">Loading team...</div>
                </div>
            </>
        )
    }

    return (
        <>
            <Header title="Team" />
            <div className="page-content">
                {/* Invite Button */}
                <div className="team-toolbar">
                    <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={18} />
                        Invite Team Member
                    </button>
                </div>

                {teamMembers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No team members yet</h3>
                        <p>Click "Invite Team Member" to add your first teammate</p>
                    </div>
                ) : (
                    <>
                        {/* Leaderboard */}
                        <div className="team-section">
                            <h3>
                                <Trophy size={20} className="section-icon" />
                                Leaderboard
                            </h3>
                            <div className="leaderboard">
                                {sortedByTasks.map((member, index) => (
                                    <div key={member.id} className={`leaderboard-item ${index === 0 ? 'first' : ''}`}>
                                        <div className="rank">#{index + 1}</div>
                                        <div className="member-info">
                                            <div className="member-avatar">{member.name.charAt(0)}</div>
                                            <div>
                                                <div className="member-name">{member.name}</div>
                                                <div className="member-role">{member.role}</div>
                                            </div>
                                        </div>
                                        <div className="member-stat">
                                            <span className="stat-num">{member.tasksCompleted}</span>
                                            <span className="stat-label">tasks</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Cards */}
                        <div className="team-section">
                            <h3>Performance Cards</h3>
                            <div className="performance-grid">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="performance-card">
                                        <div className="perf-header">
                                            <div className="member-avatar large">{member.name.charAt(0)}</div>
                                            <div>
                                                <div className="member-name">{member.name}</div>
                                                <div className="member-role">{member.role}</div>
                                                {member.email && <div className="member-email">{member.email}</div>}
                                            </div>
                                        </div>
                                        <div className="perf-stats">
                                            <div className="perf-stat">
                                                <Target size={16} />
                                                <div>
                                                    <span className="perf-value">{member.tasksCompleted}</span>
                                                    <span className="perf-label">Completed</span>
                                                </div>
                                            </div>
                                            <div className="perf-stat">
                                                <Clock size={16} />
                                                <div>
                                                    <span className="perf-value">{member.onTimeRate}%</span>
                                                    <span className="perf-label">On-Time</span>
                                                </div>
                                            </div>
                                            <div className="perf-stat">
                                                <TrendingUp size={16} />
                                                <div>
                                                    <span className="perf-value">{member.streak}d</span>
                                                    <span className="perf-label">Streak</span>
                                                </div>
                                            </div>
                                        </div>
                                        {member.overdue > 0 && (
                                            <div className="perf-warning">
                                                ⚠️ {member.overdue} overdue task{member.overdue > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2><UserPlus size={20} /> Invite Team Member</h2>
                            <button className="btn btn-ghost" onClick={() => setShowInviteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="John Doe"
                                    value={inviteForm.name}
                                    onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="john@example.com"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Strong password"
                                    value={inviteForm.password}
                                    onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="input"
                                    value={inviteForm.role}
                                    onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                                >
                                    <option value="member">Team Member</option>
                                    <option value="sales">Sales Rep</option>
                                    <option value="closer">Closer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {inviteStatus.error && (
                                <div className="invite-error">
                                    <AlertCircle size={16} />
                                    {inviteStatus.error}
                                </div>
                            )}

                            {inviteStatus.success && (
                                <div className="invite-success">
                                    <Check size={16} />
                                    User created successfully!
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={inviteStatus.loading}>
                                    {inviteStatus.loading ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
