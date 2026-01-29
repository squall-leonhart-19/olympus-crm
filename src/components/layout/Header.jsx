import { useState, useEffect, useRef } from 'react'
import { Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import './Header.css'

export default function Header({ title }) {
    const { user, logout } = useAuth()
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [notificationCount, setNotificationCount] = useState(0)
    const menuRef = useRef(null)

    useEffect(() => {
        loadAvatar()
        checkNotifications()
    }, [user])

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const loadAvatar = async () => {
        if (!isSupabaseConfigured || !user?.email) return

        try {
            const { data } = await supabase
                .from('team_members')
                .select('avatar_url')
                .eq('email', user.email)
                .single()

            if (data?.avatar_url) {
                setAvatarUrl(data.avatar_url)
            }
        } catch (e) { }
    }

    const checkNotifications = async () => {
        if (!isSupabaseConfigured) return

        try {
            // Check for overdue tasks
            const today = new Date().toISOString().split('T')[0]
            const { count } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .lt('due_date', today)
                .neq('status', 'done')

            setNotificationCount(count || 0)
        } catch (e) { }
    }

    return (
        <header className="header">
            <div className="header-left">
                <h1 className="page-title">{title}</h1>
            </div>

            <div className="header-right">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                    />
                </div>

                <button className="header-btn notification-btn">
                    <Bell size={20} />
                    {notificationCount > 0 && (
                        <span className="notification-badge">{notificationCount}</span>
                    )}
                </button>

                <div className="user-menu-container" ref={menuRef}>
                    <button
                        className="user-menu-trigger"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="user-avatar">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="avatar-img" />
                            ) : (
                                <span className="avatar-letter">{user?.name?.charAt(0) || 'U'}</span>
                            )}
                        </div>
                        <span className="user-name">{user?.name || 'User'}</span>
                        <ChevronDown size={16} className={`chevron ${showUserMenu ? 'open' : ''}`} />
                    </button>

                    {showUserMenu && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <div className="dropdown-avatar">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Profile" />
                                    ) : (
                                        <span>{user?.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <div className="dropdown-user-info">
                                    <span className="dropdown-name">{user?.name || 'User'}</span>
                                    <span className="dropdown-email">{user?.email}</span>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                                <Settings size={16} />
                                Settings
                            </Link>
                            <button className="dropdown-item logout" onClick={logout}>
                                <LogOut size={16} />
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
