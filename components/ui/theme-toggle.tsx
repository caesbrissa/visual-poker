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
            className="fixed top-4 right-4 z-50 p-3 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all shadow-lg"
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
                <Moon className="h-5 w-5 text-blue-600" />
            )}
        </button>
    )
}