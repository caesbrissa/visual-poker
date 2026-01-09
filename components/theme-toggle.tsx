"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
    const [theme, setTheme] = React.useState('dark')

    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark'
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                top: '16px',
                right: '16px',
                left: 'auto',
                zIndex: 9999,
                padding: '12px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#4b5563' : '#d1d5db'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#374151' : '#e5e7eb'
            }}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            {theme === 'dark' ? (
                <Sun style={{ width: '20px', height: '20px', color: '#eab308' }} />
            ) : (
                <Moon style={{ width: '20px', height: '20px', color: '#2563eb' }} />
            )}
        </button>
    )
}