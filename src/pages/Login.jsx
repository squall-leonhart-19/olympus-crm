import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import './Login.css'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login, error, isDemoMode } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        const result = await login(email, password)

        if (result.success) {
            navigate('/')
        }

        setIsLoading(false)
    }

    const handleDemoLogin = async () => {
        setIsLoading(true)
        await login('admin@olympus.com', 'demo')
        navigate('/')
    }

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <Zap className="login-logo-icon" />
                        <span className="login-logo-text">OLYMPUS</span>
                    </div>
                    <p className="login-subtitle">Where the gods operate</p>
                </div>

                {isDemoMode && (
                    <div className="demo-banner">
                        <AlertCircle size={16} />
                        <span>Demo Mode — Supabase not configured</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required={!isDemoMode}
                            />
                        </div>
                        <a
                            href="#"
                            className="forgot-password-link"
                            onClick={(e) => {
                                e.preventDefault()
                                alert('Password reset email sent! Check your inbox.')
                            }}
                        >
                            Forgot password?
                        </a>
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="loading-spinner" />
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {isDemoMode && (
                    <button
                        onClick={handleDemoLogin}
                        className="demo-btn"
                    >
                        <Zap size={16} />
                        Enter as Zeus (Admin Demo)
                    </button>
                )}
            </div>
        </div>
    )
}
