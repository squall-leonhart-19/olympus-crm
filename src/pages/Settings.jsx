import { useState, useRef, useEffect } from 'react'
import Header from '../components/layout/Header'
import { useAuth } from '../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Camera, User, Check, X, Upload } from 'lucide-react'
import './Settings.css'

export default function Settings() {
    const { user, isDemoMode } = useAuth()
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [newName, setNewName] = useState(user?.name || '')
    const fileInputRef = useRef(null)

    useEffect(() => {
        loadProfile()
    }, [user])

    const loadProfile = async () => {
        if (!isSupabaseConfigured || !user?.email) return

        try {
            const { data } = await supabase
                .from('team_members')
                .select('avatar_url, name')
                .eq('email', user.email)
                .single()

            if (data?.avatar_url) {
                setAvatarUrl(data.avatar_url)
            }
            if (data?.name) {
                setNewName(data.name)
            }
        } catch (e) { }
    }

    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB')
            return
        }

        setUploading(true)

        try {
            // Create a unique filename
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.email.replace('@', '_at_')}_${Date.now()}.${fileExt}`

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update team_members table
            await supabase
                .from('team_members')
                .update({ avatar_url: publicUrl })
                .eq('email', user.email)

            setAvatarUrl(publicUrl)

            // Also update localStorage for immediate header update
            const stored = localStorage.getItem('olympus_user')
            if (stored) {
                const userData = JSON.parse(stored)
                userData.avatar_url = publicUrl
                localStorage.setItem('olympus_user', JSON.stringify(userData))
            }

            window.location.reload() // Refresh to update header
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload image. Make sure the avatars bucket exists in Supabase Storage.')
        }

        setUploading(false)
    }

    const handleSaveName = async () => {
        if (!newName.trim()) return

        try {
            await supabase
                .from('team_members')
                .update({ name: newName })
                .eq('email', user.email)

            // Update localStorage
            const stored = localStorage.getItem('olympus_user')
            if (stored) {
                const userData = JSON.parse(stored)
                userData.name = newName
                localStorage.setItem('olympus_user', JSON.stringify(userData))
            }

            setEditingName(false)
            window.location.reload()
        } catch (error) {
            console.error('Update error:', error)
        }
    }

    return (
        <>
            <Header title="Settings" />
            <div className="page-content">
                <div className="settings-section">
                    <h3>Profile</h3>
                    <div className="settings-card profile-card">
                        {/* Avatar Upload */}
                        <div className="avatar-section">
                            <div
                                className="avatar-upload"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="avatar-image" />
                                ) : (
                                    <div className="avatar-placeholder">
                                        <User size={40} />
                                    </div>
                                )}
                                <div className="avatar-overlay">
                                    {uploading ? (
                                        <span className="uploading">...</span>
                                    ) : (
                                        <Camera size={20} />
                                    )}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <div className="avatar-hint">Click to upload photo</div>
                        </div>

                        {/* Name */}
                        <div className="setting-row">
                            <span className="setting-label">Name</span>
                            {editingName ? (
                                <div className="setting-edit">
                                    <input
                                        type="text"
                                        className="input input-compact"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                    <button className="btn btn-icon" onClick={handleSaveName}>
                                        <Check size={16} />
                                    </button>
                                    <button className="btn btn-icon" onClick={() => setEditingName(false)}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <span
                                    className="setting-value editable"
                                    onClick={() => setEditingName(true)}
                                >
                                    {user?.name || newName || 'Click to set'}
                                </span>
                            )}
                        </div>

                        {/* Email */}
                        <div className="setting-row">
                            <span className="setting-label">Email</span>
                            <span className="setting-value">{user?.email || 'Not set'}</span>
                        </div>

                        {/* Role */}
                        <div className="setting-row">
                            <span className="setting-label">Role</span>
                            <span className="setting-value badge-gold">{user?.role || 'member'}</span>
                        </div>
                    </div>
                </div>

                {isDemoMode && (
                    <div className="demo-notice">
                        <h4>🚧 Demo Mode Active</h4>
                        <p>Connect Supabase to enable full functionality:</p>
                        <ol>
                            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                            <li>Add your credentials to <code>.env</code></li>
                            <li>Run the database migrations</li>
                        </ol>
                    </div>
                )}

                {/* Storage Setup Notice */}
                <div className="settings-section">
                    <h3>📸 Avatar Storage Setup</h3>
                    <div className="setup-notice">
                        <p>To enable avatar uploads, create a storage bucket in Supabase:</p>
                        <ol>
                            <li>Go to Storage in your Supabase dashboard</li>
                            <li>Create a new bucket called <code>avatars</code></li>
                            <li>Make it <strong>public</strong></li>
                        </ol>
                    </div>
                </div>
            </div>
        </>
    )
}
