import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    CheckSquare,
    TrendingUp,
    Users,
    BarChart3,
    UserCircle,
    Settings,
    Zap,
    Calendar,
    FolderOpen,
    StickyNote,
    Activity
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
    { path: '/ecc', icon: Activity, label: 'Command Center' },
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { path: '/projects', icon: FolderOpen, label: 'Projects' },
    { path: '/notes', icon: StickyNote, label: 'Notes' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/team', icon: UserCircle, label: 'Team' },
    { path: '/reports', icon: BarChart3, label: 'KPIs' },
]

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <Zap className="logo-icon" />
                    <span className="logo-text">OLYMPUS</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink to="/settings" className="nav-item">
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>
            </div>
        </aside>
    )
}
