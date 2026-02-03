import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import './InstallPrompt.css'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        setIsIOS(iOS)

        // Listen for install prompt
        const handler = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Show prompt after 30 seconds if not dismissed before
            const dismissed = localStorage.getItem('olympus-install-dismissed')
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 30000)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if dismissed more than 7 days ago
        const dismissedAt = localStorage.getItem('olympus-install-dismissed')
        if (dismissedAt && Date.now() - parseInt(dismissedAt) > 7 * 24 * 60 * 60 * 1000) {
            localStorage.removeItem('olympus-install-dismissed')
        }

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setIsInstalled(true)
            }
            setDeferredPrompt(null)
        }
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('olympus-install-dismissed', Date.now().toString())
    }

    if (isInstalled || !showPrompt) return null

    return (
        <div className="install-prompt">
            <div className="install-prompt-content">
                <div className="install-icon">
                    <Smartphone size={24} />
                </div>
                <div className="install-text">
                    <h4>Install Olympus</h4>
                    {isIOS ? (
                        <p>Tap <strong>Share</strong> then <strong>"Add to Home Screen"</strong></p>
                    ) : (
                        <p>Add to your home screen for quick access</p>
                    )}
                </div>
                <div className="install-actions">
                    {!isIOS && (
                        <button className="install-btn" onClick={handleInstall}>
                            <Download size={16} />
                            Install
                        </button>
                    )}
                    <button className="dismiss-btn" onClick={handleDismiss}>
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}
