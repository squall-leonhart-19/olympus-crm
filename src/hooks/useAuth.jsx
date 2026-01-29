import { useState, useEffect, useContext, createContext } from 'react'
import { supabase, isSupabaseConfigured, signIn as supabaseSignIn, signOut as supabaseSignOut, onAuthStateChange } from '../lib/supabase'

const AuthContext = createContext(null)

// Demo users for when Supabase isn't configured
const DEMO_USERS = [
    { id: '1', email: 'admin@olympus.com', name: 'Zeus', role: 'admin' },
    { id: '2', email: 'marco@olympus.com', name: 'Marco', role: 'member' },
    { id: '3', email: 'giulia@olympus.com', name: 'Giulia', role: 'member' },
    { id: '4', email: 'alex@olympus.com', name: 'Alex', role: 'member' },
]

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!isSupabaseConfigured) {
            // Demo mode - auto-login as admin
            const savedUser = localStorage.getItem('olympus_demo_user')
            if (savedUser) {
                setUser(JSON.parse(savedUser))
            }
            setLoading(false)
            return
        }

        // Real Supabase auth
        const { data: { subscription } } = onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser({
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.user_metadata?.name || session.user.email,
                    role: session.user.user_metadata?.role || 'member'
                })
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => subscription?.unsubscribe()
    }, [])

    const login = async (email, password) => {
        setError(null)

        if (!isSupabaseConfigured) {
            // Demo mode
            const demoUser = DEMO_USERS.find(u => u.email === email)
            if (demoUser) {
                setUser(demoUser)
                localStorage.setItem('olympus_demo_user', JSON.stringify(demoUser))
                return { success: true }
            }
            // Allow any email in demo mode
            const newUser = { id: Date.now().toString(), email, name: email.split('@')[0], role: 'member' }
            setUser(newUser)
            localStorage.setItem('olympus_demo_user', JSON.stringify(newUser))
            return { success: true }
        }

        const { error } = await supabaseSignIn(email, password)
        if (error) {
            setError(error.message)
            return { success: false, error: error.message }
        }
        return { success: true }
    }

    const logout = async () => {
        if (!isSupabaseConfigured) {
            setUser(null)
            localStorage.removeItem('olympus_demo_user')
            return
        }

        await supabaseSignOut()
        setUser(null)
    }

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user,
        isDemoMode: !isSupabaseConfigured
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
