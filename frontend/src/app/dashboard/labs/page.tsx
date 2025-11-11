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
import { Plus, Trash2, Edit2, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Lab {
  id: number
  name: string
  createdAt: string
}

export default function LabsManagement() {
  const [labs, setLabs] = useState<Lab[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null)
  const [labName, setLabName] = useState("")
  const [error, setError] = useState("")

  const limit = 10

  const fetchLabs = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await axios.get(`${Base_Url}/lab/get`, {
        params: {
          page,
          limit,
          search,
        },
        withCredentials:true,
      })

      if (response.data.success) {
        setLabs(response.data.labs)
        setTotalPages(response.data.totalPages)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch labs")
      console.error("[v0] Error fetching labs:", err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchLabs()
  }, [fetchLabs])

  const handleCreateLab = async () => {
    if (!labName.trim()) {
      setError("Lab name is required")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(`${Base_Url}/lab/create`, {
        name: labName,
      },{withCredentials:true})

      if (response.data.success) {
        setLabName("")
        setIsCreateOpen(false)
        setPage(1)
        await fetchLabs()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create lab")
      console.error("[v0] Error creating lab:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditLab = async () => {
    if (!labName.trim() || !selectedLab) {
      setError("Lab name is required")
      return
    }

    setLoading(true)
    try {
      const response = await axios.put(`${Base_Url}/lab/labEdit/${selectedLab.id}`, {
        name: labName,
        
      },{withCredentials:true})

      if (response.data.success) {
        setLabName("")
        setSelectedLab(null)
        setIsEditOpen(false)
        await fetchLabs()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to edit lab")
      console.error("[v0] Error editing lab:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLab = async () => {
    if (!selectedLab) return

    setLoading(true)
    try {
      const response = await axios.delete(`${Base_Url}/lab/delete/${selectedLab.id}`,{withCredentials:true})

      if (response.data.success) {
        setSelectedLab(null)
        setIsDeleteOpen(false)
        setPage(1)
        await fetchLabs()
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete lab")
      console.error("[v0] Error deleting lab:", err)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (lab: Lab) => {
    setSelectedLab(lab)
    setLabName(lab.name)
    setIsEditOpen(true)
    setError("")
  }

  const openDeleteDialog = (lab: Lab) => {
    setSelectedLab(lab)
    setIsDeleteOpen(true)
    setError("")
  }

  return (
    <div className="space-y-8 m-10">
      {loading && <Loader fullScreen />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Labs Management</h1>
          <p className="text-muted-foreground mt-2">Create, edit, and manage laboratory spaces</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2"
              onClick={() => {
                setLabName("")
                setError("")
              }}
            >
              <Plus className="h-4 w-4" />
              Create Lab
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lab</DialogTitle>
              <DialogDescription>Enter the name of the new laboratory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
              <Input
                placeholder="Lab name (e.g., Physics Lab, Chemistry Lab)"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateLab()}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLab} disabled={loading}>
                  {loading ? "Creating..." : "Create Lab"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search and Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search labs by name..."
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

      {/* Labs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Labs</CardTitle>
          <CardDescription>Total labs: {labs.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {labs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No labs found. Create one to get started!</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Lab ID</TableHead>
                    <TableHead>Lab Name</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labs.map((lab) => (
                    <TableRow key={lab.id}>
                         <TableCell className="font-medium">{lab.id}</TableCell>
                      <TableCell className="font-medium">{lab.name}</TableCell>
                      <TableCell>{new Date(lab.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(lab)} className="gap-2">
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(lab)}
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

          {/* Pagination */}
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

      {/* Edit Lab Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lab</DialogTitle>
            <DialogDescription>Update the laboratory name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              placeholder="Lab name"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleEditLab()}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLab} disabled={loading}>
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
            <AlertDialogTitle>Delete Lab</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedLab?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLab}
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
