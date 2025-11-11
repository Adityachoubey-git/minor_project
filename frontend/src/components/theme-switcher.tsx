"use client"

import { useContext } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeContext } from "@/context/theme-context"

export const ThemeSwitcher = () => {
  const context = useContext(ThemeContext)

  if (!context) return null

  const { theme, toggleTheme } = context

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-lg w-10 h-10"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-slate-600" />}
    </Button>
  )
}
