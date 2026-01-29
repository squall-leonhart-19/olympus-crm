import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import { Trophy, Target, Clock, TrendingUp, UserPlus, X, Check, AlertCircle, Mail, Lock, User, Briefcase } from 'lucide-react'
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

        // First, try to sync any auth users that aren't in team_members yet
        await syncAuthUsers()

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
                    streak: 0
                }
            })
            setTeamMembers(membersWithStats)
        }
        setLoading(false)
    }

    // Sync auth users to team_members table
    const syncAuthUsers = async () => {
        try {
            // Get current user (admin viewing page)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if this user exists in team_members
                const { data: existing } = await supabase
                    .from('team_members')
                    .select('id')
                    .eq('email', user.email)
                    .single()

                if (!existing) {
                    // Add current user to team_members
                    await supabase.from('team_members').insert({
                        email: user.email,
                        name: user.user_metadata?.name || user.email.split('@')[0],
                        role: 'admin'
                    })
                }
            }
        } catch (error) {
            // Ignore sync errors
            console.log('Sync error (non-critical):', error)
        }
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

            {/* Premium Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
                    <div className="invite-modal" onClick={e => e.stopPropagation()}>
                        <div className="invite-modal-header">
                            <div className="invite-icon-wrapper">
                                <UserPlus size={24} />
                            </div>
                            <h2>Invite Team Member</h2>
                            <p>Add a new member to your Olympus team</p>
                            <button className="modal-close-btn" onClick={() => setShowInviteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="invite-form">
                            <div className="form-group">
                                <label>
                                    <User size={14} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Alessio Tortoli"
                                    value={inviteForm.name}
                                    onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Mail size={14} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="alessio@company.com"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Lock size={14} />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Strong password (min 8 chars)"
                                    value={inviteForm.password}
                                    onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                                    required
                                    minLength={8}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <Briefcase size={14} />
                                    Role
                                </label>
                                <div className="role-selector">
                                    {[
                                        { value: 'member', label: 'Team Member', desc: 'Can view and manage tasks' },
                                        { value: 'sales', label: 'Sales Rep', desc: 'Full sales pipeline access' },
                                        { value: 'closer', label: 'Closer', desc: 'Close deals and log KPIs' },
                                        { value: 'admin', label: 'Admin', desc: 'Full system access' },
                                    ].map(role => (
                                        <div
                                            key={role.value}
                                            className={`role-option ${inviteForm.role === role.value ? 'selected' : ''}`}
                                            onClick={() => setInviteForm(f => ({ ...f, role: role.value }))}
                                        >
                                            <div className="role-radio" />
                                            <div className="role-info">
                                                <span className="role-label">{role.label}</span>
                                                <span className="role-desc">{role.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                    User created successfully! They can now login.
                                </div>
                            )}

                            <div className="invite-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={inviteStatus.loading}>
                                    {inviteStatus.loading ? (
                                        <>Creating...</>
                                    ) : (
                                        <><UserPlus size={16} /> Create User</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
