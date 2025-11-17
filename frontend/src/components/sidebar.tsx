"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, LayoutDashboard, Settings, LogOut, Home, Radio, BarChart3, Zap, Shield, X } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"


interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  role?: "admin" | "faculty" | "student"
}

export function Sidebar({ isOpen = true, onClose, role = "student" }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(["dashboard"])

  const toggleExpand = (item: string) => {
    setExpandedItems((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]))
  }

  // Role-specific menu items
  const menuItems = [
    { id: "home", label: "Home", href: "/", icon: Home },
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: role === "admin" ? "3" : undefined,
      submenu:
        role === "admin"
          ? [
              { label: "Admin Console", href: "/dashboard/admin" },
              { label: "System Health", href: "/dashboard/health" },
              { label: "User Management", href: "/dashboard/users" },
            ]
          : role === "faculty"
            ? [
                { label: "Faculty Panel", href: "/dashboard/faculty" },
                { label: "Class Devices", href: "/dashboard/devices" },
              ]
            : [
                { label: "My Devices", href: "/dashboard/student" },
                { label: "Device Status", href: "/dashboard/status" },
              ],
    },
    {
      id: "devices",
      label: "IoT Devices",
      icon: Zap,
      submenu: [
        { label: "Device List", href: "/devices/list" },
        { label: "Monitoring", href: "/devices/monitor" },
        { label: "Controls", href: "/devices/controls" },
      ],
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Radio,
      submenu: [
        { label: "Real-time Data", href: "/monitoring/realtime" },
        { label: "Analytics", href: "/monitoring/analytics" },
        { label: "Alerts", href: "/monitoring/alerts", badge: "1" },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      href: "/reports",
    },
    ...(role === "admin"
      ? [
          {
            id: "security",
            label: "Security",
            icon: Shield,
            submenu: [
              { label: "Access Control", href: "/security/access" },
              { label: "Audit Logs", href: "/security/logs" },
            ],
          },
        ]
      : []),
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="fixed inset-0 top-16 z-40 bg-black/50 md:hidden" onClick={onClose} />}

      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 border-r border-border bg-sidebar transition-transform duration-300 z-40 md:z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="md:hidden p-4 border-b border-sidebar-border">
            <Button variant="ghost" size="icon" onClick={onClose} className="ml-auto">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <div key={item.id}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expandedItems.includes(item.id) ? "rotate-180" : ""}`}
                      />
                    </button>
                    {expandedItems.includes(item.id) && (
                      <div className="ml-6 border-l border-sidebar-border pl-0 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.href}
                            href={subitem.href}
                            className="block px-3 py-2 text-sm text-sidebar-foreground hover:text-sidebar-accent transition-colors rounded-lg hover:bg-sidebar-accent/10 mb-1 flex items-center justify-between"
                          >
                            <span>{subitem.label}</span>
                            {/* {subitem.badge && (
                              <Badge
                                variant="secondary"
                                className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                              >
                                {subitem.badge}
                              </Badge>
                            )} */}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href || "#"}>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors mb-2">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {/* {item.badge} */} hello 
                        </Badge>
                      )}
                    </button>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>
      </aside>
    </>
  )
}
