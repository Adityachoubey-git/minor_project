"use client"

import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Sun, Moon, Monitor, Palette } from "lucide-react"

export function ThemeSelector() {
  const { theme, setTheme, isDark } = useTheme()

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-lg bg-transparent">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm font-medium">Theme</div>
        <DropdownMenuSeparator />
        {themes.map((t) => {
          const ThemeIcon = t.icon
          return (
            <DropdownMenuCheckboxItem
              key={t.value}
              checked={theme === t.value}
              onCheckedChange={() => setTheme(t.value as typeof theme)}
            >
              <ThemeIcon className="mr-2 h-4 w-4" />
              {t.label}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
