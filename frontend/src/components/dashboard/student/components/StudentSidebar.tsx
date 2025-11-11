"use client"

import { LayoutDashboard, BookOpen, Zap, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Studentsidebar() {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: BookOpen, label: "Experiments", href: "/dashboard/student/experiments" },
    { icon: Zap, label: "Devices", href: "/dashboard/student/devices" },
    { icon: Clock, label: "Submissions", href: "/dashboard/student/submissions" },
  ]

  return (
    <aside className="w-64 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Student Portal</h2>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
