"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Sun, Moon, User, LogOut } from "lucide-react"
import { useTheme } from "@/context/theme-context"
import { useUser } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter, usePathname } from "next/navigation"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface HeaderProps {
  onSidebarToggle?: () => void
  mobileSidebar?: React.ReactNode
}

export function Header({ onSidebarToggle, mobileSidebar }: HeaderProps) {
  const { isDark, setTheme } = useTheme()
  const { userData, setUserData } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await axios.post(`${Base_Url}/auth/logout`, {}, { withCredentials: true })
    } catch (err) {
      console.error("Logout failed:", err)
    } finally {
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

          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
               <div className="w-10 h-10 rounded-[75px] border-2 border-white flex items-center justify-center shadow-lg overflow-hidden">
  <img
    src="/labautonomylogo.jpeg"
    alt="Lab Autonomy"
    className="w-full h-full object-cover rounded-[75px] border-2 border-white"
  />
</div>
  
            <span className="hidden sm:inline">Lab Autonomy</span>
          </Link>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-lg"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* 👤 Profile Dialog instead of dropdown */}
          {userData ? (
            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg"
                onClick={() => setIsProfileOpen(true)}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary overflow-hidden">
                  <User className="h-4 w-4" />
                </div>
              </Button>

              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Profile</DialogTitle>
                  <DialogDescription>Your account details</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-medium">{userData?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium capitalize">{userData?.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium break-all">{userData?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ID Number</p>
                    <p className="font-medium">{userData?.IDnumber}</p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              {/* Not logged in → Login / Get Started */}
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

              {/* Mobile Nav Menu */}
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
