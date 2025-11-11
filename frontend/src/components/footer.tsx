"use client"

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
        <p>Lab Autonomy © {new Date().getFullYear()}. All rights reserved.</p>
      </div>
    </footer>
  )
}
