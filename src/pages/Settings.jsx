import Header from '../components/layout/Header'
import { useAuth } from '../hooks/useAuth'
import './Settings.css'

export default function Settings() {
    const { user, isDemoMode } = useAuth()

    return (
        <>
            <Header title="Settings" />
            <div className="page-content">
                <div className="settings-section">
                    <h3>Account</h3>
                    <div className="settings-card">
                        <div className="setting-row">
                            <span className="setting-label">Name</span>
                            <span className="setting-value">{user?.name || 'Not set'}</span>
                        </div>
                        <div className="setting-row">
                            <span className="setting-label">Email</span>
                            <span className="setting-value">{user?.email || 'Not set'}</span>
                        </div>
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
            </div>
        </>
    )
}
