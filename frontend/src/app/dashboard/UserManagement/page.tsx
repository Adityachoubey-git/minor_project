"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Eye } from "lucide-react"
import toast from "react-hot-toast"

interface User {
  id: number
  name: string
  email: string
  role: "ADMIN" | "FACULTY" | "STUDENT"
  IDnumber: string
  isActive: boolean
  createdAt: string
}

// For frontend filter
type RoleFilter = "ALL" | "FACULTY" | "STUDENT"

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL") // 👈 NEW

  const limit = 20

  // 🔹 Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params: any = { page, limit, search }

      // Only send role when not ALL
      if (roleFilter !== "ALL") {
        params.role = roleFilter // "FACULTY" or "STUDENT"
      }

      const res = await axios.get(`${Base_Url}/auth/admin/users`, {
        params,
        withCredentials: true,
      })

      if (res.data.success) {
        setUsers(res.data.users)
        setTotalPages(res.data.totalPages)
      } else {
        toast.error(res.data.message || "Failed to load users")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Load users when page/search/roleFilter changes
  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, roleFilter])

  // 🔹 Toggle Active / Inactive
  const handleStatusToggle = async (user: User) => {
    const newStatus = !user.isActive
    try {
      await axios.patch(
        `${Base_Url}/auth/admin/users/${user.id}/status`,
        { isActive: newStatus },
        { withCredentials: true },
      )

      toast.success(`User ${newStatus ? "activated" : "deactivated"}`)

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: newStatus } : u,
        ),
      )

      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, isActive: newStatus })
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change status")
    }
  }

  const openProfile = (user: User) => {
    setSelectedUser(user)
    setIsProfileOpen(true)
  }

  return (
    <div className="m-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">
            View all users, change their status, and inspect profiles.
          </p>
        </div>
      </div>

      {/* Search + Role Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter by search term and role (Faculty / Student)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            {/* Search */}
            <div className="flex gap-3 max-w-md w-full">
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setPage(1)
                }}
              >
                Clear
              </Button>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Select
                value={roleFilter}
                onValueChange={(value: RoleFilter) => {
                  setRoleFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                  <SelectItem value="STUDENT">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {loading
              ? "Loading users..."
              : `Users on this page: ${users.length}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground py-6">
              No users found.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">
                        {user.role.toLowerCase()}
                      </TableCell>
                      <TableCell>{user.IDnumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleStatusToggle(user)}
                          />
                          <span className="text-xs">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openProfile(user)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Details of the selected user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium break-all">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">
                  {selectedUser.role.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID Number</p>
                <p className="font-medium">{selectedUser.IDnumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">
                  {selectedUser.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined</p>
                <p className="font-medium">
                  {new Date(selectedUser.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
