import type React from "react"

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-blue-600">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

