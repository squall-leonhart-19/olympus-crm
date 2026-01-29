import { Bell, Search, LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import './Header.css'

export default function Header({ title }) {
    const { user, logout } = useAuth()

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
                        <User size={20} />
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
