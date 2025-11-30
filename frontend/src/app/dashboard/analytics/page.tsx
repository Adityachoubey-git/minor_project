"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/context/UserContext"

import {
  Loader2,
  BarChart3,
  Users,
  Cpu,
  Clock as ClockIcon,
} from "lucide-react"

// 📊 Recharts
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts"
import { useRouter } from "next/navigation"
type RangeType = "day" | "week" | "month" | "year"

interface UsageByUser {
  userId: number
  name: string
  role: "ADMIN" | "FACULTY" | "STUDENT"
  commandCount: number
    idNumber: string   
    email: string
}

interface UsageByRole {
  role: string
  commandCount: number
}

interface UsageByDevice {
  deviceId: number
  name: string
  pin: number | null
  commandCount: number
}

interface UsageByLab {
  labId: number
  labName: string
  commandCount: number
}

interface DeviceOnDuration {
  deviceId: number
  deviceName: string
  hoursOn: number
}

interface DeviceUsageByUser {
  userId: number
  userName: string
  role: string
  deviceId: number
  deviceName: string
  commandCount: number
    idNumber: string
    email: string
}

interface TimeOfDayBucket {
  hour: number
  commandCount: number
}

interface AnalyticsResponse {
  success: boolean
  range: {
    type: RangeType
    label: string
    start: string
    end: string
  }
  summary: {
    totalCommands: number
    uniqueUsers: number
    uniqueDevices: number
  }
  usageByUser: UsageByUser[]
  usageByRole: UsageByRole[]
  usageByDevice: UsageByDevice[]
  usageByLab: UsageByLab[]
  deviceOnDurationHours: DeviceOnDuration[]
  deviceUsageByUser: DeviceUsageByUser[]
  timeOfDayHeatmap: TimeOfDayBucket[]
}

// colorful palette
const COLORS = [
  "#6366F1",
  "#EC4899",
  "#22C55E",
  "#F97316",
  "#06B6D4",
  "#EAB308",
  "#A855F7",
  "#F97373",
]

export default function AdminAnalyticsPage() {
   const router = useRouter()
  const { userData } = useUser()
  const [range, setRange] = useState<RangeType>("day")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyticsResponse | null>(null)

  // clicked / active states for charts
  const [activeRoleIndex, setActiveRoleIndex] = useState<number | null>(null)
  const [activeDeviceIndex, setActiveDeviceIndex] = useState<number | null>(null)
  const [activeHourIndex, setActiveHourIndex] = useState<number | null>(null)

    useEffect(() => {
    if (!userData) return
    if (userData.role !== "ADMIN") {
      router.push("/dashboard") // or "/"
    }
  }, [userData, router])
  if (!userData || userData.role !== "ADMIN") {
    return null
  }
  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await axios.get<AnalyticsResponse>(`${Base_Url}/analytics/usage`, {
        params: { range },
        withCredentials: true,
      })
      setData(res.data)
      setActiveRoleIndex(null)
      setActiveDeviceIndex(null)
      setActiveHourIndex(null)
    } catch (err) {
      console.error("Error fetching analytics", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const topUsers = data?.usageByUser
    ? [...data.usageByUser].sort((a, b) => b.commandCount - a.commandCount).slice(0, 5)
    : []

  const topDevices = data?.usageByDevice
    ? [...data.usageByDevice].sort((a, b) => b.commandCount - a.commandCount).slice(0, 5)
    : []

  const topOnDevices = data?.deviceOnDurationHours
    ? [...data.deviceOnDurationHours].sort((a, b) => b.hoursOn - a.hoursOn).slice(0, 5)
    : []

  const labsUsage = data?.usageByLab
    ? [...data.usageByLab].sort((a, b) => b.commandCount - a.commandCount)
    : []

  const topUserDevice = data?.deviceUsageByUser
    ? [...data.deviceUsageByUser].sort((a, b) => b.commandCount - a.commandCount).slice(0, 10)
    : []

  const timeOfDay = data?.timeOfDayHeatmap ?? []

  const activeRole =
    activeRoleIndex !== null && data?.usageByRole[activeRoleIndex]
      ? data.usageByRole[activeRoleIndex]
      : null

  const activeDevice =
    activeDeviceIndex !== null && topDevices[activeDeviceIndex]
      ? topDevices[activeDeviceIndex]
      : null

  const activeHour =
    activeHourIndex !== null && timeOfDay[activeHourIndex]
      ? timeOfDay[activeHourIndex]
      : null

  return (
    <div className="m-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Usage Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Device usage insights by user, role, device, time, and labs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Range</span>
            <Select value={range} onValueChange={(v) => setRange(v as RangeType)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">Last 7 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This financial year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {data?.range.label} ({data?.range.start.slice(0, 10)} →{" "}
              {data?.range.end.slice(0, 10)})
            </CardDescription>
          </div>
          {userData && (
            <Badge variant="outline">
              Logged in as {userData.name} ({userData.role?.toLowerCase()})
            </Badge>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Active users</p>
              <p className="text-xl font-semibold">
                {data?.summary.uniqueUsers ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Cpu className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Active devices</p>
              <p className="text-xl font-semibold">
                {data?.summary.uniqueDevices ?? "-"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total commands</p>
              <p className="text-xl font-semibold">
                {data?.summary.totalCommands ?? "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top users + Role usage (with pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top users */}
        <Card>
          <CardHeader>
            <CardTitle>Top users by device usage</CardTitle>
            <CardDescription>
              Who is sending the most commands in this range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!topUsers.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">User</th>
                          <th className="py-2 text-left">ID Number</th> 
                            <th className="py-2 text-left">Email</th> 
                    <th className="py-2 text-left">Role</th>
                  
                    <th className="py-2 text-right">Commands</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u) => (
                    <tr key={u.userId} className="border-b last:border-0">
                      <td className="py-2">{u.name}</td>
                          <td className="py-2 text-muted-foreground">
        {u.idNumber || "-"}                           {/* 👈 new */}
      </td>
          <td className="py-2 text-muted-foreground">
        {u.email || "-"}                           {/* 👈 new */}
      </td>
                      <td className="py-2 capitalize text-muted-foreground">
                        {u.role.toLowerCase()}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {u.commandCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Usage by role – PIE + detail */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by role</CardTitle>
            <CardDescription>
              Click or hover a slice to see role details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!data?.usageByRole?.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.usageByRole}
                        dataKey="commandCount"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        onClick={(_, index) => setActiveRoleIndex(index)}
                      >
                        {data.usageByRole.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            strokeWidth={activeRoleIndex === index ? 3 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} commands`,
                          props.payload.role,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs text-muted-foreground">
                  {activeRole ? (
                    <div className="rounded-md border px-3 py-2 bg-muted/40">
                      <p className="font-semibold mb-1">
                        Selected role: {activeRole.role.toLowerCase()}
                      </p>
                      <p>Commands: {activeRole.commandCount}</p>
                    </div>
                  ) : (
                    <p>Click a pie slice to see details here.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most used devices – BAR + detail */}
        <Card>
          <CardHeader>
            <CardTitle>Most used devices</CardTitle>
            <CardDescription>
              Hover or click bars to inspect a device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!topDevices.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart
                      data={topDevices}
                      margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} commands`,
                          props.payload.name,
                        ]}
                      />
                      <Bar
                        dataKey="commandCount"
                        onClick={(_, index) => setActiveDeviceIndex(index)}
                      >
                        {topDevices.map((entry, index) => (
                          <Cell
                            key={`bar-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            strokeWidth={activeDeviceIndex === index ? 2 : 0}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs text-muted-foreground">
                  {activeDevice ? (
                    <div className="rounded-md border px-3 py-2 bg-muted/40">
                      <p className="font-semibold mb-1">
                        Device: {activeDevice.name}
                      </p>
                      <p>Pin: {activeDevice.pin ?? "-"}</p>
                      <p>Commands: {activeDevice.commandCount}</p>
                    </div>
                  ) : (
                    <p>Click a bar to see that device&apos;s details here.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Devices ON duration */}
        <Card>
          <CardHeader>
            <CardTitle>Devices ON duration</CardTitle>
            <CardDescription>
              Approximate hours devices stayed ON in this range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!topOnDevices.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Device</th>
                    <th className="py-2 text-right">Hours ON</th>
                  </tr>
                </thead>
                <tbody>
                  {topOnDevices.map((d) => (
                    <tr key={d.deviceId} className="border-b last:border-0">
                      <td className="py-2">{d.deviceName}</td>
                      <td className="py-2 text-right font-medium">
                        {d.hoursOn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Labs + Time-of-day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lab usage */}
        <Card>
          <CardHeader>
            <CardTitle>Lab usage</CardTitle>
            <CardDescription>
              Which labs are operated the most in this range.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!labsUsage.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Lab</th>
                    <th className="py-2 text-right">Commands</th>
                  </tr>
                </thead>
                <tbody>
                  {labsUsage.map((lab) => (
                    <tr key={lab.labId} className="border-b last:border-0">
                      <td className="py-2">{lab.labName}</td>
                      <td className="py-2 text-right font-medium">
                        {lab.commandCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Time-of-day usage – AREA + hover */}
        <Card>
          <CardHeader>
            <CardTitle>Time-of-day usage</CardTitle>
            <CardDescription>
              Hover or click to see which hours are most active.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!timeOfDay.length ? (
              <p className="text-sm text-muted-foreground">No data.</p>
            ) : (
              <>
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart
                      data={timeOfDay}
                      margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      onClick={(state) => {
                        if (state && state.activeTooltipIndex != null) {
                          setActiveHourIndex(state.activeTooltipIndex)
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(h) => `${h.toString().padStart(2, "0")}:00`}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} commands`,
                          `${props.payload.hour
                            .toString()
                            .padStart(2, "0")}:00`,
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="commandCount"
                        stroke="#6366F1"
                        fill="#A5B4FC"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-xs text-muted-foreground">
                  {activeHour ? (
                    <div className="rounded-md border px-3 py-2 bg-muted/40">
                      <p className="font-semibold mb-1">
                        Hour:{" "}
                        {activeHour.hour.toString().padStart(2, "0")}
                        :00
                      </p>
                      <p>Commands: {activeHour.commandCount}</p>
                    </div>
                  ) : (
                    <p>Click anywhere on the graph to see that hour&apos;s data here.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User ↔ Device matrix */}
      <Card>
        <CardHeader>
          <CardTitle>User–device usage</CardTitle>
          <CardDescription>
            Which user uses which devices more (top 10 combinations).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!topUserDevice.length ? (
            <p className="text-sm text-muted-foreground">No data.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">User</th>
                          <th className="py-2 text-left">ID Number</th> 
                            <th className="py-2 text-left">Email</th> 
                    <th className="py-2 text-left">Role</th>
                    <th className="py-2 text-left">Device</th>
                    <th className="py-2 text-right">Commands</th>
                  </tr>
                </thead>
                <tbody>
                  {topUserDevice.map((row, idx) => (
                    <tr
                      key={`${row.userId}-${row.deviceId}-${idx}`}
                      className="border-b last:border-0"
                    >
                      <td className="py-2">{row.userName}</td>
                       <td className="py-2 text-muted-foreground">
        {row.idNumber || "-"}                         {/* 👈 new */}
      </td>
       <td className="py-2 text-muted-foreground">
        {row.email || "-"}                         {/* 👈 new */}
      </td>
                      <td className="py-2 capitalize text-muted-foreground">
                        {row.role.toLowerCase()}
                      </td>
                      <td className="py-2">{row.deviceName}</td>
                      <td className="py-2 text-right font-medium">
                        {row.commandCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
