"use client"

import { useState, useEffect, useCallback } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { Loader } from "@/components/loader"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit2, Search, Power, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Device {
  id: number
  Name: string
  PinNumber: number
  allowedDevices: boolean
  labId: number
  Lab: { id: number; name: string } | null
  createdAt: string
}

interface Lab {
  id: number
  name: string
}

export default function DevicesManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [deviceStates, setDeviceStates] = useState<{ [key: number]: boolean }>({})
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    Name: "",
    PinNumber: "",
    labId: "",
    allowedDevices: true,
  })

  const limit = 10

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await axios.get(`${Base_Url}/lab/get`, {
          params: { limit: 100 },withCredentials:true
        })
        if (response.data.success) {
          setLabs(response.data.labs)
        }
      } catch (err) {
        console.error("[v0] Error fetching labs:", err)
      }
    }
    fetchLabs()
  }, [])

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await axios.get(`${Base_Url}/devices/get`, {
        params: {
          page,
          limit,
          search,
        },
        withCredentials:true,
      })

      if (response.data.success) {
        setDevices(response.data.devices)
        setTotalPages(response.data.totalPages)

        await fetchDeviceStates(response.data.devices)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch devices")
      console.error("[v0] Error fetching devices:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  const fetchDeviceStates = async (devicesToCheck: Device[]) => {
    try {
      const pins = devicesToCheck.map((d) => d.PinNumber)
      const response = await axios.post(`${Base_Url}/relay/live-state`, {
        pins,
      },{ withCredentials:true })

      if (response.data.success) {
        const statesMap: { [key: number]: boolean } = {}
        response.data.states.forEach((state: { pin: number; state?: string; error?: string }) => {
          const device = devicesToCheck.find((d) => d.PinNumber === state.pin)
          if (device) {
            statesMap[device.id] = state.state === "on"
          }
        })
        setDeviceStates(statesMap)
      }
    } catch (err) {
      console.error("[v0] Error fetching device states:", err)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleCreateDevice = async () => {
    if (!formData.Name.trim() || !formData.PinNumber || !formData.labId) {
      setError("Name, Pin Number, and Lab are required")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${Base_Url}/devices/create`, {
        Name: formData.Name,
        PinNumber: Number.parseInt(formData.PinNumber),
        labId: Number.parseInt(formData.labId),
        allowedDevices: formData.allowedDevices,
       
      },{ withCredentials:true })

      if (response.data.success) {
        setFormData({ Name: "", PinNumber: "", labId: "", allowedDevices: true })
        setIsCreateOpen(false)
        setPage(1)
        await fetchDevices()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create device")
      console.error("[v0] Error creating device:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDevice = async () => {
    if (!formData.Name.trim() || !formData.PinNumber || !formData.labId || !selectedDevice) {
      setError("Name, Pin Number, and Lab are required")
      return
    }

    setLoading(true)
    try {
      const response = await axios.put(`${Base_Url}/devices/deviceEdit/${selectedDevice.id}`, {
        Name: formData.Name,
        PinNumber: Number.parseInt(formData.PinNumber),
        labId: Number.parseInt(formData.labId),
        allowedDevices: formData.allowedDevices,
        withCredentials:true,
      })

      if (response.data.success) {
        setFormData({ Name: "", PinNumber: "", labId: "", allowedDevices: true })
        setSelectedDevice(null)
        setIsEditOpen(false)
        await fetchDevices()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit device")
      console.error("[v0] Error editing device:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return

    setLoading(true)
    try {
      const response = await axios.delete(`${Base_Url}/devices/deviceDelete/${selectedDevice.id}`,{ withCredentials:true})

      if (response.data.success) {
        setSelectedDevice(null)
        setIsDeleteOpen(false)
        setPage(1)
        await fetchDevices()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete device")
      console.error("[v0] Error deleting device:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDevice = async (device: Device) => {
    setTogglingDevice(device.id)
    try {
      const newState = deviceStates[device.id] ? "off" : "on"
      const response = await axios.post(`${Base_Url}/relay/control`, {
        deviceIds: [device.id],
        state: newState,
    
      },   { withCredentials:true})

      if (response.data.success) {
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: newState === "on",
        }))
      } else {
        setError("Failed to control device")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to control device")
      console.error("[v0] Error toggling device:", err)
    } finally {
      setTogglingDevice(null)
    }
  }

  const openEditDialog = (device: Device) => {
    setSelectedDevice(device)
    setFormData({
      Name: device.Name,
      PinNumber: device.PinNumber.toString(),
      labId: device.labId.toString(),
      allowedDevices: device.allowedDevices,
    })
    setIsEditOpen(true)
    setError("")
  }

  const openDeleteDialog = (device: Device) => {
    setSelectedDevice(device)
    setIsDeleteOpen(true)
    setError("")
  }

  return (
    <div className="space-y-8 m-10">
      {loading && <Loader fullScreen />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Devices Management</h1>
          <p className="text-muted-foreground mt-2">Create, edit, and control IoT devices</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setFormData({ Name: "", PinNumber: "", labId: "", allowedDevices: true })
                setError("")
              }}
            >
              <Plus className="h-4 w-4" />
              Create Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Device</DialogTitle>
              <DialogDescription>Add a new IoT device to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
              <Input
                placeholder="Device Name (e.g., Relay Module 1)"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              />
              <Input
                placeholder="Pin Number (e.g., 16)"
                type="number"
                value={formData.PinNumber}
                onChange={(e) => setFormData({ ...formData, PinNumber: e.target.value })}
              />
              <Select value={formData.labId} onValueChange={(value) => setFormData({ ...formData, labId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Lab" />
                </SelectTrigger>
                <SelectContent>
                  {labs.map((lab) => (
                    <SelectItem key={lab.id} value={lab.id.toString()}>
                      {lab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allowedDevices"
                  checked={formData.allowedDevices}
                  onChange={(e) => setFormData({ ...formData, allowedDevices: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="allowedDevices" className="text-sm">
                  Allow device control by faculty
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDevice} disabled={loading}>
                  {loading ? "Creating..." : "Create Device"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices by name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Devices</CardTitle>
          <CardDescription>Total devices: {devices.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No devices found. Create one to get started!</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device Name</TableHead>
                    <TableHead>Pin Number</TableHead>
                    <TableHead>Lab</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.Name}</TableCell>
                      <TableCell>{device.PinNumber}</TableCell>
                      <TableCell>{device.Lab?.name || "Unassigned"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleDevice(device)}
                          disabled={togglingDevice === device.id}
                          className={`gap-2 ${
                            deviceStates[device.id]
                              ? "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {togglingDevice === device.id ? (
                            <>
                              <Zap className="h-4 w-4 animate-spin" />
                              {deviceStates[device.id] ? "Turning OFF" : "Turning ON"}
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4" />
                              {deviceStates[device.id] ? "ON" : "OFF"}
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(device)} className="gap-2">
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(device)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
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

      {/* Edit Device Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              placeholder="Device Name"
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
            />
            <Input
              placeholder="Pin Number"
              type="number"
              value={formData.PinNumber}
              onChange={(e) => setFormData({ ...formData, PinNumber: e.target.value })}
            />
            <Select value={formData.labId} onValueChange={(value) => setFormData({ ...formData, labId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lab" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id.toString()}>
                    {lab.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowedDevicesEdit"
                checked={formData.allowedDevices}
                onChange={(e) => setFormData({ ...formData, allowedDevices: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="allowedDevicesEdit" className="text-sm">
                Allow device control by faculty
              </label>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditDevice} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedDevice?.Name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDevice}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
