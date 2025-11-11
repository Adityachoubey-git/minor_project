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
import { useRouter } from "nextjs-toploader/app"
import type React from "react"
import { usePathname } from "next/navigation"
import { DeleteCookie } from "@/lib/deletecokkies"

interface HeaderProps {
  showUserMenu?: boolean
  userName?: string
  userRole?: string
  onSidebarToggle?: () => void
  mobileSidebar?: React.ReactNode
}

export function Header({
  showUserMenu = false,
  userName = "User",
  userRole = "Admin",
  onSidebarToggle,
  mobileSidebar,
}: HeaderProps) {
  const { isDark, setTheme } = useTheme()
  const { userData } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)

  const getHeaderTitle = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    let title = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : "Dashboard"
    if (/^\d+$/.test(title)) return ""
    title = title.replace(/([a-z])([A-Z])/g, "$1 $2")
    const t = title.charAt(0).toUpperCase() + title.slice(1)
    if (title === "labincharges") {
      return "Lab Incharge"
    }
    return t
  }

  const handleLogout = async () => {
    await DeleteCookie("token")
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo Section */}
        <div className="flex items-center gap-4">
          {showUserMenu && (
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

        {/* Desktop Navigation - Hidden when showing user menu */}
        {!showUserMenu && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showUserMenu && (
            <Button variant="ghost" size="icon" className="rounded-lg relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <div className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 rounded-full">
                  {notificationCount}
                </div>
              )}
            </Button>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {showUserMenu ? (
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
                  <p className="text-sm font-medium">{userData?.name || userName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{userData?.role || userRole}</p>
                  <p className="text-xs text-muted-foreground">{userData?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="mr-2">🔑</span>
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="mr-2">⚙️</span>
                  Preferences
                </DropdownMenuItem>
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
              {/* Auth Links for Public Views */}
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

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
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

      {/* Mobile Menu */}
      {isMenuOpen && !showUserMenu && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur p-4 dark:bg-slate-900 dark:border-slate-800">
          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground dark:text-slate-50">
              Home
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground dark:text-slate-50">
              Features
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground dark:text-slate-50">
              About
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground dark:text-slate-50">
              Login
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
