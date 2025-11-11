"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Sun, Moon, Bell, User, LogOut } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useUser } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter, usePathname } from "next/navigation"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"

interface HeaderProps {
  onSidebarToggle?: () => void
  mobileSidebar?: React.ReactNode
}

export function Header({ onSidebarToggle, mobileSidebar }: HeaderProps) {
  const { isDark, setTheme } = useTheme()
  const { userData, setUserData } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)

  // 🧭 Extract title from current path (optional enhancement)
  const getHeaderTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length === 0) return "Dashboard"
    const last = pathSegments[pathSegments.length - 1]
    if (/^\d+$/.test(last)) return ""
    if (last === "labincharges") return "Lab Incharge"
    return last.charAt(0).toUpperCase() + last.slice(1)
  }

  // 🚪 Proper logout (clears cookie via backend)
  const handleLogout = async () => {
    try {
      await axios.post(`${Base_Url}/auth/logout`, {}, { withCredentials: true })
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
      // clear frontend state
      setUserData(null)
      localStorage.removeItem("userRole")
      localStorage.removeItem("userName")
      localStorage.removeItem("isAuthenticated")
      router.push("/")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          {onSidebarToggle && (
            <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="md:hidden rounded-lg">
              <Menu className="h-4 w-4" />
            </Button>
          )}

          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
              ⚛️
            </div>
            <span className="hidden sm:inline">Lab Autonomy</span>
          </Link>
        </div>

  

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* 🔔 Notifications for logged-in users */}
   

          {/* 🌙 Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* 👤 User Dropdown (if logged in) */}
          {userData ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                    <User className="h-4 w-4" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userData?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userData?.role}</p>
                  <p className="text-xs text-muted-foreground">{userData?.email}</p>
                  <p className="text-xs text-muted-foreground">{userData?.IDnumber}</p>
                </div>
                <DropdownMenuSeparator />
            
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* 🚪 Not logged in → Show Login/Get Started */}
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="rounded-lg">
                  Get Started
                </Button>
              </Link>

              {/* 📱 Mobile Nav Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  {mobileSidebar}
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
