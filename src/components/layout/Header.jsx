import { useState, useEffect, useRef } from 'react'
import { Bell, Search, LogOut, User, Settings, ChevronDown, AlertTriangle, CheckCircle, X, Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

export default function Header({ title }) {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [notificationCount, setNotificationCount] = useState(0)
    const menuRef = useRef(null)
    const notifRef = useRef(null)

    useEffect(() => {
        loadAvatar()
        loadNotifications()
    }, [user])

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false)
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false)
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

    const loadNotifications = async () => {
        if (!isSupabaseConfigured) {
            // Demo notifications
            setNotifications([
                { id: 1, type: 'overdue', title: 'Task overdue', message: 'Follow up with TechCorp', time: '2 hours ago' },
                { id: 2, type: 'reminder', title: 'Due today', message: 'Prepare proposal deck', time: '1 hour ago' },
                { id: 3, type: 'completed', title: 'Task completed', message: 'Sarah finished onboarding', time: '30 min ago' },
            ])
            setNotificationCount(3)
            return
        }

        try {
            const today = new Date().toISOString().split('T')[0]

            // Get overdue tasks
            const { data: overdue } = await supabase
                .from('tasks')
                .select('id, title, due_date')
                .lt('due_date', today)
                .neq('status', 'done')
                .limit(5)

            // Get tasks due today
            const { data: dueToday } = await supabase
                .from('tasks')
                .select('id, title, due_date')
                .eq('due_date', today)
                .neq('status', 'done')
                .limit(5)

            const notifs = []

            overdue?.forEach(t => {
                notifs.push({
                    id: `overdue-${t.id}`,
                    type: 'overdue',
                    title: 'Overdue Task',
                    message: t.title,
                    time: t.due_date,
                    taskId: t.id
                })
            })

            dueToday?.forEach(t => {
                notifs.push({
                    id: `today-${t.id}`,
                    type: 'reminder',
                    title: 'Due Today',
                    message: t.title,
                    time: 'Today',
                    taskId: t.id
                })
            })

            setNotifications(notifs)
            setNotificationCount(notifs.length)
        } catch (e) {
            console.error('Error loading notifications:', e)
        }
    }

    const handleNotificationClick = (notif) => {
        setShowNotifications(false)
        navigate('/tasks')
    }

    const dismissNotification = (e, id) => {
        e.stopPropagation()
        setNotifications(prev => prev.filter(n => n.id !== id))
        setNotificationCount(prev => Math.max(0, prev - 1))
    }

    const clearAllNotifications = () => {
        setNotifications([])
        setNotificationCount(0)
    }

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'overdue': return <AlertTriangle size={16} />
            case 'completed': return <CheckCircle size={16} />
            case 'reminder': return <Clock size={16} />
            default: return <Bell size={16} />
        }
    }

    const getNotificationColor = (type) => {
        switch (type) {
            case 'overdue': return '#ef4444'
            case 'completed': return '#22c55e'
            case 'reminder': return '#f59e0b'
            default: return '#3b82f6'
        }
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

                {/* Notifications */}
                <div className="notification-container" ref={notifRef}>
                    <button
                        className="header-btn notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="notification-badge">{notificationCount}</span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h4>Notifications</h4>
                                {notifications.length > 0 && (
                                    <button className="clear-all" onClick={clearAllNotifications}>
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className="notification-list">
                                {notifications.length === 0 ? (
                                    <div className="notification-empty">
                                        <Bell size={32} />
                                        <span>No notifications</span>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className="notification-item"
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div
                                                className="notification-icon"
                                                style={{ background: getNotificationColor(notif.type) }}
                                            >
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                            <div className="notification-content">
                                                <span className="notification-title">{notif.title}</span>
                                                <span className="notification-message">{notif.message}</span>
                                                <span className="notification-time">{notif.time}</span>
                                            </div>
                                            <button
                                                className="notification-dismiss"
                                                onClick={(e) => dismissNotification(e, notif.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="notification-footer">
                                <button onClick={() => { setShowNotifications(false); navigate('/tasks'); }}>
                                    View All Tasks
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
