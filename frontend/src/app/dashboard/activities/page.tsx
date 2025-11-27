"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { Loader } from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useUser } from "@/context/UserContext"
// <- adjust path if different

interface CommandLog {
  id: number
  deviceId: number
  userId: number
  command: string
  status: string
  requestedAt: string
  completedAt: string | null
  Device?: { id?: number; Name: string; PinNumber: number; labId?: number }
  user?: {
    id: number
    name: string
    email: string
    role: string
    IDnumber?: string
    createdAt?: string
    last_login?: string
  }
}

interface Device {
  id: number
  Name: string
  PinNumber: number
}

export default function ActivitiesPage() {
  const [logs, setLogs] = useState<CommandLog[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterType, setFilterType] = useState<"all" | "device">("all")
  const [selectedDeviceId, setSelectedDeviceId] = useState("")
  const [error, setError] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<CommandLog | null>(null)

  const { userData} = useUser()
  const isAdmin = userData?.role === "ADMIN"

  const limit = 15

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${Base_Url}/devices/get`, {
          params: { limit: 100 },
          withCredentials: true,
        })
        if (response.data.success) {
          setDevices(response.data.devices)
        }
      } catch (err) {
        console.error("[v0] Error fetching devices:", err)
      }
    }
    fetchDevices()
  }, [])

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      let url = `${Base_Url}/relay/history/all`
      let params: any = { page, limit, search }

      if (filterType === "device" && selectedDeviceId) {
        url = `${Base_Url}/relay/history/device/${selectedDeviceId}`
        params = { page, limit }
      }

      const response = await axios.get(url, { params, withCredentials: true })

      if (response.data.success) {
        setLogs(response.data.data || [])
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch activities")
      console.error("[v0] Error fetching activities:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search, filterType, selectedDeviceId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleExport = async () => {
    try {
      const response = await axios.get(`${Base_Url}/relay/history/all`, {
        params: { limit: 10000 },
        withCredentials: true,
      })

      if (response.data.success) {
        const csvContent = [
          ["Timestamp", "Device", "User", "Email", "Role", "Command", "Status"],
          ...(response.data.data || []).map((log: CommandLog) => [
            new Date(log.requestedAt).toLocaleString(),
            log.Device?.Name || "Unknown",
            log.user?.name || "Unknown",
            log.user?.email || "N/A",
            log.user?.role || "N/A",
            log.command,
            log.status,
          ]),
        ]
          .map((row) => row.map((cell: any) => `"${cell}"`).join(","))
          .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `activities-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      setError("Failed to export data")
      console.error("[v0] Error exporting data:", err)
    }
  }

  const openDetails = (log: CommandLog) => {
    if (!isAdmin) return
    setSelectedLog(log)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-8 m-10">
      {loading && <Loader fullScreen />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities History</h1>
          <p className="text-muted-foreground mt-2">
            View all device control activities and user actions
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search and Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by device name, user name, or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={filterType}
              onValueChange={(value) => {
                setFilterType(value as "all" | "device")
                setSelectedDeviceId("")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="device">Device History</SelectItem>
              </SelectContent>
            </Select>

            {filterType === "device" && (
              <Select
                value={selectedDeviceId}
                onValueChange={(value) => {
                  setSelectedDeviceId(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select a device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.Name} (Pin: {device.PinNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Total activities: {logs.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No activities found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      {/* Timestamp */}
                      <TableCell className="text-sm">
                        {new Date(log.requestedAt).toLocaleString()}
                      </TableCell>

                      {/* Device */}
                      <TableCell className="font-medium">
                        {log.Device?.Name || "Unknown"}
                      </TableCell>

                      {/* User */}
                      <TableCell>{log.user?.name || "Unknown"}</TableCell>

                      {/* Email */}
                      <TableCell className="text-sm">
                        {log.user?.email || "N/A"}
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {log.user?.role || "N/A"}
                        </span>
                      </TableCell>

                      {/* Command */}
                      <TableCell className="font-medium text-sm">
                        {log.command}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>

                      {/* Action */}
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetails(log)}
                            aria-label="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog (Admin only) */}
      {isAdmin && selectedLog && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Command Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected command and user.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <h3 className="font-semibold text-sm mb-1">Command Info</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">ID:</span> {selectedLog.id}
                  </p>
                  <p>
                    <span className="font-medium">Command:</span>{" "}
                    {selectedLog.command}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{" "}
                    {selectedLog.status}
                  </p>
                  <p>
                    <span className="font-medium">Requested At:</span>{" "}
                    {new Date(selectedLog.requestedAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Completed At:</span>{" "}
                    {selectedLog.completedAt
                      ? new Date(selectedLog.completedAt).toLocaleString()
                      : "Not completed"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">Device Info</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedLog.Device?.Name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Pin:</span>{" "}
                    {selectedLog.Device?.PinNumber ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Lab ID:</span>{" "}
                    {selectedLog.Device?.labId ?? "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-1">User Info</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {selectedLog.user?.name || "Unknown"}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedLog.user?.email || "N/A"}
                  </p>
                  <p>
                    <span className="font-medium">Role:</span>{" "}
                    {selectedLog.user?.role || "N/A"}
                  </p>
                  {selectedLog.user?.IDnumber && (
                    <p>
                      <span className="font-medium">ID Number:</span>{" "}
                      {selectedLog.user.IDnumber}
                    </p>
                  )}
                  {selectedLog.user?.createdAt && (
                    <p>
                      <span className="font-medium">User Created:</span>{" "}
                      {new Date(selectedLog.user.createdAt).toLocaleString()}
                    </p>
                  )}
                  {selectedLog.user?.last_login && (
                    <p>
                      <span className="font-medium">Last Login:</span>{" "}
                      {new Date(selectedLog.user.last_login).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
