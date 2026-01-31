import { useState } from 'react'
import './Tooltip.css'

export default function Tooltip({ children, text, position = 'top' }) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div
            className="tooltip-wrapper"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`tooltip tooltip-${position}`}>
                    {text}
                </div>
            )}
        </div>
    )
}
