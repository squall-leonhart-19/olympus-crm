import { useState, useEffect } from 'react'
import { Bell, Search, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import './Header.css'

export default function Header({ title }) {
    const { user, logout } = useAuth()
    const [avatarUrl, setAvatarUrl] = useState(null)

    useEffect(() => {
        loadAvatar()
    }, [user])

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

                <button className="header-btn">
                    <Bell size={20} />
                </button>

                <div className="user-menu">
                    <div className="user-avatar">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Profile" className="avatar-img" />
                        ) : (
                            <User size={20} />
                        )}
                    </div>
                    <span className="user-name">{user?.name || 'User'}</span>
                    <button className="header-btn" onClick={logout} title="Sign out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    )
}
