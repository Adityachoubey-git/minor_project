"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"
import { Loader } from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, Zap, Cpu, Building2, GraduationCap, Clock, Power, Sunrise, Moon } from "lucide-react"
import SetAlarmModal from "../admin/components/set-alarm-modal"



interface Stats {
  totalUsers: number
  totalDevices: number
  totalLabs: number
  totalStudents: number
  totalFaculty: number
}

interface Lab {
  id: number
  name: string
}

interface Device {
  id: number
  Name: string
  PinNumber: number
  labId: number
  Lab: { id: number; name: string } | null
}

interface DeviceState {
  [key: number]: boolean
}

export default function facultyDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [labs, setLabs] = useState<Lab[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedLabId, setSelectedLabId] = useState<string>("")
  const [deviceStates, setDeviceStates] = useState<DeviceState>({})
  const [loading, setLoading] = useState(true)
  const [togglingDevice, setTogglingDevice] = useState<number | null>(null)
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false)
  const [togglingAllDevices, setTogglingAllDevices] = useState(false)

  useEffect(() => {
    const fetchStatsAndLabs = async () => {
      setLoading(true)
      try {
        const [ labsRes] = await Promise.all([
          // axios.get(`${Base_Url}/auth/admin/stats`, { withCredentials: true }),
          axios.get(`${Base_Url}/lab/get`, { params: { limit: 100 }, withCredentials: true }),
        ])

        // if (statsRes.data.success) {
        //   setStats(statsRes.data.stats)
        // }
        if (labsRes.data.success) {
          setLabs(labsRes.data.labs)
        }
      } catch (error) {
        console.error("[v0] Error fetching stats or labs:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchStatsAndLabs()
  }, [])

  useEffect(() => {
    const fetchDevicesAndStates = async () => {
      if (!selectedLabId) return

      setLoading(true)
      try {
        const devicesRes = await axios.get(`${Base_Url}/devices/get`, {
          params: { labId: selectedLabId, limit: 100 },
          withCredentials: true,
        })

        if (devicesRes.data.success) {
          setDevices(devicesRes.data.devices)
          await fetchDeviceStates(devicesRes.data.devices)
        }
      } catch (error) {
        console.error("[v0] Error fetching devices:", error)
        toast.error("Failed to load devices")
      } finally {
        setLoading(false)
      }
    }

    fetchDevicesAndStates()
  }, [selectedLabId])

  const fetchDeviceStates = async (devicesToCheck: Device[]) => {
    try {
      const pins = devicesToCheck.map((d) => d.PinNumber)
      const response = await axios.post(`${Base_Url}/relay/live-state`, { pins }, { withCredentials: true })

      if (response.data.success) {
        const statesMap: DeviceState = {}
        response.data.states.forEach((state: { pin: number; state?: string }) => {
          const device = devicesToCheck.find((d) => d.PinNumber === state.pin)
          if (device) {
            statesMap[device.id] = state.state === "on"
          }
        })
        setDeviceStates(statesMap)
      }
    } catch (error) {
      console.error("[v0] Error fetching device states:", error)
    }
  }

  const handleToggleDevice = async (device: Device) => {
    setTogglingDevice(device.id)
    try {
      const newState = deviceStates[device.id] ? "off" : "on"
      const response = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds: [device.id],
          state: newState,
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        setDeviceStates((prev) => ({
          ...prev,
          [device.id]: newState === "on",
        }))
        toast.success(`Device ${newState === "on" ? "turned ON" : "turned OFF"}`)
      }
    } catch (error: any) {
      console.error("[v0] Error toggling device:", error)
      toast.error(error.response?.data?.message || "Failed to control device")
    } finally {
      setTogglingDevice(null)
    }
  }

  const handleGoodMorning = async () => {
    if (!selectedLabId) {
      toast.error("Please select a lab first")
      return
    }

    setTogglingAllDevices(true)
    try {
      const deviceIds = devices.map((d) => d.id)
      const response = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds,
          state: "on",
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        setDeviceStates((prev) => {
          const newStates = { ...prev }
          deviceIds.forEach((id) => {
            newStates[id] = true
          })
          return newStates
        })
        toast.success("All devices turned ON - Good morning!")
      }
    } catch (error: any) {
      console.error("[v0] Error turning on all devices:", error)
      toast.error(error.response?.data?.message || "Failed to turn on all devices")
    } finally {
      setTogglingAllDevices(false)
    }
  }

  const handleGoodNight = async () => {
    if (!selectedLabId) {
      toast.error("Please select a lab first")
      return
    }

    setTogglingAllDevices(true)
    try {
      const deviceIds = devices.map((d) => d.id)
      const response = await axios.post(
        `${Base_Url}/relay/control`,
        {
          deviceIds,
          state: "off",
        },
        { withCredentials: true },
      )

      if (response.data.success) {
        setDeviceStates((prev) => {
          const newStates = { ...prev }
          deviceIds.forEach((id) => {
            newStates[id] = false
          })
          return newStates
        })
        toast.success("All devices turned OFF - Good night!")
      }
    } catch (error: any) {
      console.error("[v0] Error turning off all devices:", error)
      toast.error(error.response?.data?.message || "Failed to turn off all devices")
    } finally {
      setTogglingAllDevices(false)
    }
  }

  if (loading && !stats) {
    return <Loader fullScreen />
  }

  return (
    <div className="space-y-8 m-10">
      {/* Header with Alarm Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor system status and control devices</p>
        </div>
        <Button onClick={() => setIsAlarmModalOpen(true)} className="gap-2">
          <Clock className="h-4 w-4" />
          Set Alarm
        </Button>
      </div>

      {/* Stats Grid */}
      {/* {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Total Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDevices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Total Labs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLabs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Faculty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFaculty}</div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Lab Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Devices by Lab</CardTitle>
          <CardDescription>Select a lab to view and control its devices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedLabId} onValueChange={setSelectedLabId}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select a lab..." />
            </SelectTrigger>
            <SelectContent>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id.toString()}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent> 
          </Select>

          {/* Good Morning and Good Night buttons */}
          {selectedLabId && devices.length > 0 && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleGoodMorning}
                disabled={togglingAllDevices}
                className="flex-1 gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Sunrise className="h-4 w-4" />
                {togglingAllDevices ? "Processing..." : "Good Morning"}
              </Button>
              <Button
                onClick={handleGoodNight}
                disabled={togglingAllDevices}
                className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Moon className="h-4 w-4" />
                {togglingAllDevices ? "Processing..." : "Good Night"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device Cards Grid */}
      {selectedLabId && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Lab Devices</h2>
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No devices found in this lab</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => {
                const isOn = deviceStates[device.id]
                const isToggling = togglingDevice === device.id

                return (
                  <Card key={device.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{device.Name}</CardTitle>
                      <CardDescription>Pin {device.PinNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* State Display */}
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">Status</span>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold transition-all ${
                            isOn
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-red-500/20 text-red-600 dark:text-red-400"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full transition-all ${
                              isOn ? "bg-green-600 dark:bg-green-400" : "bg-red-600 dark:bg-red-400"
                            }`}
                          />
                          {isOn ? "ON" : "OFF"}
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <Button
                        onClick={() => handleToggleDevice(device)}
                        disabled={isToggling}
                        className={`w-full gap-2 transition-all ${
                          isOn ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {isToggling ? (
                          <>
                            <Power className="h-4 w-4 animate-spin" />
                            {isOn ? "Turning OFF" : "Turning ON"}
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4" />
                            Turn {isOn ? "OFF" : "ON"}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Set Alarm Modal */}
      <SetAlarmModal open={isAlarmModalOpen} onOpenChange={setIsAlarmModalOpen} selectedLabId={selectedLabId} />
    </div>
  )
}
