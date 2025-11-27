"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { Loader } from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useUser } from "@/context/UserContext"


interface CommandLog {
  id: number
  deviceId: number
  command: string
  status: string
  requestedAt: string
  completedAt: string | null
  Device?: { Name: string; PinNumber: number; labId: number }
}

export default function UserHistoryPage() {
  const { userData } = useUser()
  const userId = userData?.id

  const [logs, setLogs] = useState<CommandLog[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<CommandLog | null>(null)

  const limit = 10

  const fetchUserHistory = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError("")

    try {
      const response = await axios.get(
        `${Base_Url}/relay/history/user/${userId}`,
        {
          params: {
            page,
            limit,
            search,
          },
          withCredentials: true,
        }
      )

      if (response.data.success) {
        setLogs(response.data.data || [])
        setTotalPages(response.data.totalPages || 1)
      }
    } catch (err: any) {
      setError("Failed to load user command history")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, page, search])

  useEffect(() => {
    fetchUserHistory()
  }, [fetchUserHistory])

  const openDetails = (log: CommandLog) => {
    setSelectedLog(log)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-8 m-10">
      {loading && <Loader fullScreen />}

      <div>
        <h1 className="text-3xl font-bold">My Command History</h1>
        <p className="text-muted-foreground mt-2">View only your activity logs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Commands</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search command / status..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Commands</CardTitle>
          <CardDescription>Total: {logs.length}</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400 mb-4">
              {error}
            </div>
          )}

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No commands found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Command</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      {/* Time */}
                      <TableCell>
                        {new Date(log.requestedAt).toLocaleString()}
                      </TableCell>

                      {/* Device */}
                      <TableCell>{log.Device?.Name ?? "Unknown"}</TableCell>

                      {/* Command */}
                      <TableCell>{log.command}</TableCell>

                      {/* Status */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>

                      {/* Eye button */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
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

      {/* Details Dialog */}
      {selectedLog && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Command Details</DialogTitle>
              <DialogDescription>
                Information about your command.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Command Info */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Command Info</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">ID:</span> {selectedLog.id}</p>
                  <p><span className="font-medium">Command:</span> {selectedLog.command}</p>
                  <p><span className="font-medium">Status:</span> {selectedLog.status}</p>
                  <p><span className="font-medium">Requested At:</span> {new Date(selectedLog.requestedAt).toLocaleString()}</p>
                  <p><span className="font-medium">Completed At:</span> {selectedLog.completedAt ? new Date(selectedLog.completedAt).toLocaleString() : "Not completed"}</p>
                </div>
              </div>

              {/* Device Info */}
              <div>
                <h3 className="font-semibold text-sm mb-1">Device Info</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedLog.Device?.Name}</p>
                  <p><span className="font-medium">Pin:</span> {selectedLog.Device?.PinNumber}</p>
                  <p><span className="font-medium">Lab ID:</span> {selectedLog.Device?.labId}</p>
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
