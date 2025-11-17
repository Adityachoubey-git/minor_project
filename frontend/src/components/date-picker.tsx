"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DateTimePickerProps {
  date: string
  time: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

export default function DateTimePicker({ date, time, onDateChange, onTimeChange }: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Generate date options (today + next 30 days)
  const generateDateOptions = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d)
    }
    return dates
  }

  // Generate time options (every 15 minutes)
  const generateTimeOptions = () => {
    const times = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
      }
    }
    return times
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select date"
    const d = new Date(dateStr + "T00:00:00")
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={() => {
            setShowDatePicker(!showDatePicker)
            setShowTimePicker(false)
          }}
        >
          <Calendar className="h-4 w-4" />
          {formatDate(date)}
        </Button>

        {showDatePicker && (
          <Card className="absolute top-12 left-0 right-0 z-50 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {generateDateOptions().map((d) => {
                  const dateStr = d.toISOString().split("T")[0]
                  const isSelected = dateStr === date
                  const isToday = dateStr === new Date().toISOString().split("T")[0]

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        onDateChange(dateStr)
                        setShowDatePicker(false)
                      }}
                      className={`h-8 rounded text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : isToday
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                            : "hover:bg-muted"
                      }`}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Time Picker */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={() => {
            setShowTimePicker(!showTimePicker)
            setShowDatePicker(false)
          }}
        >
          <Clock className="h-4 w-4" />
          {time || "Select time"}
        </Button>

        {showTimePicker && (
          <Card className="absolute top-12 left-0 right-0 z-50 shadow-lg">
            <CardContent className="p-4">
              <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {generateTimeOptions().map((t) => {
                  const isSelected = t === time
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        onTimeChange(t)
                        setShowTimePicker(false)
                      }}
                      className={`h-10 rounded text-sm font-medium transition-all ${
                        isSelected ? "bg-blue-600 text-white" : "hover:bg-muted"
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Display */}
      {date && time && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm">
            <span className="font-semibold">Scheduled for:</span> {formatDate(date)} at {time}
          </p>
        </div>
      )}
    </div>
  )
}
