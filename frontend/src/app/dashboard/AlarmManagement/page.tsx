"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { useUser } from "@/context/UserContext"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  AlarmClock,
  CalendarDays,
  Clock,
  Power,
  User as UserIcon,
  RefreshCcw,
  AlertTriangle,
  Trash2,
  Repeat,
} from "lucide-react"
import toast from "react-hot-toast"
import SetAlarmModal from "@/components/dashboard/admin/components/set-alarm-modal"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@radix-ui/react-dialog"
import { DialogHeader } from "@/components/ui/dialog"

interface AlarmUser {
  id: number
  name: string
  email: string
  role: "ADMIN" | "FACULTY" | "STUDENT"
}

interface Alarm {
  id: number
  userId: number
  devices: number[]
  state: "on" | "off"
  scheduledAt: string
  executed: boolean
  enabled: boolean
  createdAt: string
  user?: AlarmUser
  recurrenceType?: "once" | "daily" | "weekly"
  daysOfWeek?: string[]
}

export default function AlarmManagementPage() {
  const { userData } = useUser()
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [loading, setLoading] = useState(false)
  const [includeExecuted, setIncludeExecuted] = useState(false)
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false)

  // NEW: filters
  const [stateFilter, setStateFilter] = useState<"all" | "on" | "off">("all")
  const [userIdFilter, setUserIdFilter] = useState<string>("")

  const isAdmin = userData?.role === "ADMIN"

  const fetchAlarms = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (includeExecuted) params.includeExecuted = "true"
      if (stateFilter !== "all") params.state = stateFilter
      if (isAdmin && userIdFilter.trim()) params.userId = userIdFilter.trim()

      const res = await axios.get(`${Base_Url}/alarms/list`, {
        params,
        withCredentials: true,
      })

      if (res.data.success) {
        setAlarms(res.data.alarms || [])
      } else {
        toast.error(res.data.message || "Failed to load alarms")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load alarms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlarms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeExecuted, stateFilter])

  const handleToggleEnabled = async (alarm: Alarm, newEnabled: boolean) => {
    setTogglingId(alarm.id)
    try {
      const res = await axios.patch(
        `${Base_Url}/alarms/${alarm.id}/enabled`,
        { enabled: newEnabled },
        { withCredentials: true },
      )

      if (!res.data.success) {
        toast.error(res.data.message || "Failed to update alarm")
        return
      }

      setAlarms((prev) =>
        prev.map((a) => (a.id === alarm.id ? { ...a, enabled: newEnabled } : a)),
      )

      if (selectedAlarm && selectedAlarm.id === alarm.id) {
        setSelectedAlarm({ ...selectedAlarm, enabled: newEnabled })
      }

      toast.success(`Alarm ${newEnabled ? "enabled" : "disabled"}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update alarm")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteAlarm = async (alarmId: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this alarm?")
    if (!confirmDelete) return

    setDeletingId(alarmId)
    try {
      const res = await axios.delete(`${Base_Url}/alarms/${alarmId}`, {
        withCredentials: true,
      })

      if (!res.data.success) {
        toast.error(res.data.message || "Failed to delete alarm")
        return
      }

      setAlarms((prev) => prev.filter((a) => a.id !== alarmId))

      if (selectedAlarm?.id === alarmId) {
        setSelectedAlarm(null)
        setIsDetailsOpen(false)
      }

      toast.success("Alarm deleted")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete alarm")
    } finally {
      setDeletingId(null)
    }
  }

  const openDetails = (alarm: Alarm) => {
    setSelectedAlarm(alarm)
    setIsDetailsOpen(true)
  }

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return iso
    }
  }

  const formatRecurrence = (alarm: Alarm) => {
    const type = alarm.recurrenceType || "once"
    if (type === "daily") return "Every day"
    if (type === "weekly") {
      const days = alarm.daysOfWeek || []
      if (!days.length) return "Weekly"
      const map: Record<string, string> = {
        sun: "Sun",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat",
      }
      return `On ${days.map((d) => map[d] || d).join(", ")}`
    }
    return "One-time"
  }

  return (
    <div className="m-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alarm Management</h1>
          <p className="text-sm text-muted-foreground">
            View, enable/disable, and manage scheduled alarms for your devices.
          </p>
        </div>

        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => setIsAlarmModalOpen(true)}>
            <Clock className="h-4 w-4" />
            Set Alarm
          </Button>

          <Button variant="outline" size="sm" onClick={fetchAlarms} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Control which alarms you see</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={includeExecuted}
              onCheckedChange={(val) => setIncludeExecuted(val)}
            />
            <span className="text-sm">Show executed / past alarms</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Alarm state:</span>
            <Select
              value={stateFilter}
              onValueChange={(val) => setStateFilter(val as "all" | "on" | "off")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="on">Only ON</SelectItem>
                <SelectItem value="off">Only OFF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">User ID:</span>
              <Input
                className="w-[140px]"
                placeholder="e.g. 3"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
              />
              {/* uses Refresh button to apply */}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alarm list */}
      <div>
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <AlarmClock className="h-5 w-5" />
          Scheduled Alarms
        </h2>

        {alarms.length === 0 && !loading ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No alarms found. Create a new alarm using the &quot;Set Alarm&quot; button.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alarms.map((alarm) => {
              const isOnAction = alarm.state === "on"
              const isPending = !alarm.executed
              const isEnabled = alarm.enabled
              const isToggling = togglingId === alarm.id
              const isDeleting = deletingId === alarm.id

              return (
                <Card key={alarm.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <AlarmClock className="h-4 w-4 text-primary" />
                          Alarm #{alarm.id}
                        </CardTitle>
                        <CardDescription className="mt-1 text-xs">
                          {isOnAction ? "Turn devices ON" : "Turn devices OFF"}
                        </CardDescription>

                        {/* NEW: recurrence info */}
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                          <Repeat className="h-3 w-3" />
                          <span>{formatRecurrence(alarm)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            {isEnabled ? "Enabled" : "Disabled"}
                          </span>
                          <Switch
                            checked={isEnabled}
                            disabled={isToggling || isDeleting}
                            onCheckedChange={(val) => handleToggleEnabled(alarm, val)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Time + Status */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{formatTime(alarm.scheduledAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-4 w-4" />
                          <span>{new Date(alarm.scheduledAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                            isPending
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          <Power className="h-3 w-3" />
                          {isPending ? "Pending" : "Executed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Devices: <span className="font-medium">{alarm.devices.length}</span>
                        </span>
                      </div>
                    </div>

                    {/* Who created (admin view) */}
                    {isAdmin && alarm.user && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                        <UserIcon className="h-3 w-3" />
                        <span>
                          {alarm.user.name} ({alarm.user.role.toLowerCase()})
                        </span>
                      </div>
                    )}

                    {/* Warning */}
                    {!alarm.enabled && !alarm.executed && (
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Disabled — this alarm will not run until enabled.</span>
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-2 border-t mt-2">
                      <Button variant="outline" size="sm" onClick={() => openDetails(alarm)}>
                        Show alarm
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={isDeleting}
                        onClick={() => handleDeleteAlarm(alarm.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete alarm
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alarm Details</DialogTitle>
            <DialogDescription>Full information about this alarm</DialogDescription>
          </DialogHeader>

          {selectedAlarm && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Alarm ID</p>
                <p className="font-medium">#{selectedAlarm.id}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Action</p>
                <p className="font-medium">
                  Turn devices {selectedAlarm.state === "on" ? "ON" : "OFF"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Repeat</p>
                <p className="font-medium">{formatRecurrence(selectedAlarm)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Scheduled At</p>
                  <p className="font-medium">
                    {formatDateTime(selectedAlarm.scheduledAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="font-medium">
                    {formatDateTime(selectedAlarm.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Enabled</p>
                  <p className="font-medium">
                    {selectedAlarm.enabled ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {selectedAlarm.executed ? "Executed" : "Pending"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Devices</p>
                <p className="font-medium">
                  {selectedAlarm.devices.length > 0
                    ? selectedAlarm.devices.join(", ")
                    : "No devices attached"}
                </p>
              </div>

              {selectedAlarm.user && (
                <div className="border-t pt-3 mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Created By</p>
                  <div className="flex flex-col gap-0.5 text-xs">
                    <span className="font-medium">{selectedAlarm.user.name}</span>
                    <span className="text-muted-foreground">
                      {selectedAlarm.user.email}
                    </span>
                    <span className="text-muted-foreground capitalize">
                      {selectedAlarm.user.role.toLowerCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Set Alarm Modal */}
      <SetAlarmModal
        open={isAlarmModalOpen}
        onOpenChange={setIsAlarmModalOpen}
        selectedLabId="all"
      />
    </div>
  )
}
