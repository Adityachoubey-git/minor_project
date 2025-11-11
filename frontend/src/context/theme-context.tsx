"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
   toggleTheme: () => void  
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("lab-autonomy-theme") as Theme | null
    const initialTheme = stored || "system"
    setThemeState(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement
    let isDarkMode = false

    if (newTheme === "system") {
      isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
    } else {
      isDarkMode = newTheme === "dark"
    }

    html.classList.add("transition-colors", "duration-300")

    if (isDarkMode) {
      html.classList.add("dark")
    } else {
      html.classList.remove("dark")
    }

    setIsDark(isDarkMode)
  }

  const handleSetTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("lab-autonomy-theme", newTheme)
    applyTheme(newTheme)
  }
const toggleTheme = () => handleSetTheme(isDark ? "light" : "dark") 
  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      applyTheme("system")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  if (!mounted) return <>{children}</>

  return <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, isDark ,toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
