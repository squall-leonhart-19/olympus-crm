import { useState, useEffect, useRef } from 'react'
import Header from '../components/layout/Header'
import { Trophy, Target, Clock, TrendingUp, UserPlus, X, Check, AlertCircle, Mail, Lock, User, Briefcase, Edit2, Trash2, Save, Image, AtSign } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import './Team.css'

export default function Team() {
    const [teamMembers, setTeamMembers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'member', password: '' })
    const [inviteStatus, setInviteStatus] = useState({ loading: false, error: null, success: false })

    // Edit user state
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [editForm, setEditForm] = useState({ name: '', nickname: '', email: '', role: '', avatar_url: '' })
    const [editStatus, setEditStatus] = useState({ loading: false, error: null, success: false })
    const [avatarUploading, setAvatarUploading] = useState(false)
    const avatarInputRef = useRef(null)

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deletingMember, setDeletingMember] = useState(null)
    const [deleteStatus, setDeleteStatus] = useState({ loading: false, error: null })

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
                const onTimeRate = total > 0 ? Math.round(((total - overdue) / total) * 100) : null

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
            const redirectUrl = `${window.location.origin}/login`
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteForm.email,
                password: inviteForm.password,
                options: {
                    data: { name: inviteForm.name },
                    emailRedirectTo: redirectUrl
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

    // Open edit modal for a member
    const openEditModal = (member) => {
        setEditingMember(member)
        setEditForm({
            name: member.name || '',
            nickname: member.nickname || '',
            email: member.email || '',
            role: member.role || 'member',
            avatar_url: member.avatar_url || ''
        })
        setEditStatus({ loading: false, error: null, success: false })
        setShowEditModal(true)
    }

    // Handle updating user
    const handleEditUser = async (e) => {
        e.preventDefault()
        setEditStatus({ loading: true, error: null, success: false })

        try {
            // Update team_members table
            const { error: dbError } = await supabase
                .from('team_members')
                .update({
                    name: editForm.name,
                    nickname: editForm.nickname,
                    email: editForm.email,
                    role: editForm.role,
                    avatar_url: editForm.avatar_url
                })
                .eq('id', editingMember.id)

            if (dbError) throw dbError

            setEditStatus({ loading: false, error: null, success: true })

            setTimeout(() => {
                loadTeamMembers()
                setShowEditModal(false)
                setEditingMember(null)
                setEditStatus({ loading: false, error: null, success: false })
            }, 1000)

        } catch (error) {
            setEditStatus({ loading: false, error: error.message, success: false })
        }
    }

    // Handle avatar upload
    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarUploading(true)

        try {
            // Create unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${editingMember.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update form with new URL
            setEditForm(f => ({ ...f, avatar_url: publicUrl }))
            setAvatarUploading(false)

        } catch (error) {
            console.error('Avatar upload error:', error)
            setEditStatus({ loading: false, error: 'Failed to upload image. Make sure the avatars bucket exists in Supabase Storage.', success: false })
            setAvatarUploading(false)
        }
    }

    // Open delete confirmation
    const openDeleteConfirm = (member) => {
        setDeletingMember(member)
        setDeleteStatus({ loading: false, error: null })
        setShowDeleteConfirm(true)
    }

    // Handle deleting user
    const handleDeleteUser = async () => {
        setDeleteStatus({ loading: true, error: null })

        try {
            // Delete from team_members table
            const { error: dbError } = await supabase
                .from('team_members')
                .delete()
                .eq('id', deletingMember.id)

            if (dbError) throw dbError

            // Note: Deleting from Supabase Auth requires admin privileges
            // For now, we just remove from team_members table

            loadTeamMembers()
            setShowDeleteConfirm(false)
            setDeletingMember(null)

        } catch (error) {
            setDeleteStatus({ loading: false, error: error.message })
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
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} className="member-avatar-img" />
                                            ) : (
                                                <div className="member-avatar">{member.name.charAt(0)}</div>
                                            )}
                                            <div>
                                                <div className="member-name">
                                                    {member.nickname || member.name}
                                                    {member.nickname && <span className="member-fullname">({member.name})</span>}
                                                </div>
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
                                            {member.avatar_url ? (
                                                <img src={member.avatar_url} alt={member.name} className="member-avatar-img large" />
                                            ) : (
                                                <div className="member-avatar large">{member.name.charAt(0)}</div>
                                            )}
                                            <div>
                                                <div className="member-name">
                                                    {member.nickname || member.name}
                                                    {member.nickname && <span className="member-fullname">({member.name})</span>}
                                                </div>
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
                                                    <span className="perf-value">{member.onTimeRate !== null ? `${member.onTimeRate}%` : 'N/A'}</span>
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
                                        <div className="perf-actions">
                                            <button
                                                className="btn btn-icon btn-ghost"
                                                onClick={() => openEditModal(member)}
                                                title="Edit member"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn btn-icon btn-ghost btn-danger"
                                                onClick={() => openDeleteConfirm(member)}
                                                title="Remove member"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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

            {/* Edit Member Modal */}
            {showEditModal && editingMember && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="invite-modal" onClick={e => e.stopPropagation()}>
                        <div className="invite-modal-header">
                            <div className="invite-icon-wrapper">
                                <Edit2 size={24} />
                            </div>
                            <h2>Edit Team Member</h2>
                            <p>Update {editingMember.name}'s information</p>
                            <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditUser} className="invite-form">
                            <div className="form-group">
                                <label>
                                    <User size={14} />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Full Name"
                                    value={editForm.name}
                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                    required
                                />
                            </div>

                            {/* Avatar Upload */}
                            <div className="form-group">
                                <label>
                                    <Image size={14} />
                                    Profile Picture
                                </label>
                                <div className="avatar-upload-area">
                                    <div className="avatar-preview">
                                        {editForm.avatar_url ? (
                                            <img src={editForm.avatar_url} alt="Avatar" className="avatar-preview-img" />
                                        ) : (
                                            <div className="avatar-preview-placeholder">
                                                {editForm.name.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="avatar-upload-actions">
                                        <input
                                            type="file"
                                            ref={avatarInputRef}
                                            onChange={handleAvatarUpload}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => avatarInputRef.current?.click()}
                                            disabled={avatarUploading}
                                        >
                                            {avatarUploading ? 'Uploading...' : 'Upload Image'}
                                        </button>
                                        {editForm.avatar_url && (
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => setEditForm(f => ({ ...f, avatar_url: '' }))}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Nickname */}
                            <div className="form-group">
                                <label>
                                    <AtSign size={14} />
                                    Nickname (Display Name)
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Zeus, Ale, Max..."
                                    value={editForm.nickname}
                                    onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                                />
                                <span className="form-hint">What shows up instead of full name</span>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Mail size={14} />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="email@company.com"
                                    value={editForm.email}
                                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                                    required
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
                                            className={`role-option ${editForm.role === role.value ? 'selected' : ''}`}
                                            onClick={() => setEditForm(f => ({ ...f, role: role.value }))}
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

                            {editStatus.error && (
                                <div className="invite-error">
                                    <AlertCircle size={16} />
                                    {editStatus.error}
                                </div>
                            )}

                            {editStatus.success && (
                                <div className="invite-success">
                                    <Check size={16} />
                                    Member updated successfully!
                                </div>
                            )}

                            <div className="invite-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={editStatus.loading}>
                                    {editStatus.loading ? (
                                        <>Saving...</>
                                    ) : (
                                        <><Save size={16} /> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deletingMember && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="delete-modal-icon">
                            <Trash2 size={32} />
                        </div>
                        <h2>Remove Team Member?</h2>
                        <p>
                            Are you sure you want to remove <strong>{deletingMember.name}</strong> from the team?
                            This action cannot be undone.
                        </p>

                        {deleteStatus.error && (
                            <div className="invite-error">
                                <AlertCircle size={16} />
                                {deleteStatus.error}
                            </div>
                        )}

                        <div className="delete-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteUser}
                                disabled={deleteStatus.loading}
                            >
                                {deleteStatus.loading ? 'Removing...' : 'Remove Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
