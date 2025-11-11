"use client"
import { Header } from "@/components/header"
import { useUser } from "@/context/UserContext"
import axios from "axios"
import { redirect, useRouter } from "next/navigation"

import type React from "react"
import { useEffect, useState } from "react"
import axiosRetry from "axios-retry"
import { Loader, AlertTriangle, ArrowRight } from "lucide-react"


import Base_Url from "@/hooks/Baseurl"
import Footer from "@/components/footer"

import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DeleteCookie } from "@/lib/deletecokkies"
import { AdminSidebar } from "@/components/dashboard/admin/components/AdminSidebar"
import { FacultySidebar } from "@/components/dashboard/faculty/components/FacultySidebar"
import { Studentsidebar } from "@/components/dashboard/student/components/StudentSidebar"

const userProfileApi = axios.create({
  baseURL: Base_Url,
  withCredentials: true,
})

axiosRetry(userProfileApi, {
  retries: 4,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error),
})

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userData, setUserData } = useUser()
  const [isloading, setisloading] = useState(true)
  const [redirecttostatus, setredirecttostatus] = useState(false)
  const router = useRouter()
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setredirecttostatus(false)
        setisloading(true)
        const response = await userProfileApi.get("/auth/get_user_profile")
        const user = response.data.user
        setUserData(user)

        
      } catch (error: any) {
        if (error.response?.status === 403) {
          setredirecttostatus(true)
        } else if (error.response?.status === 401) {
          await DeleteCookie("token")
        }
        setUserData(null)
      } finally {
        setisloading(false)
      }
    }
    fetchUserData()
  }, [setUserData])

  if (isloading) {
    return (
      <div className="flex items-center justify-center h-[100vh]">
        <Loader className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (redirecttostatus) {
    redirect("/status")
  }

  if (!userData) {
    redirect("/")
  }

  const role = userData.role
  if (!role) {
    redirect("/")
  }

  let sidebar
  switch (role) {
    case "ADMIN":
      sidebar = <AdminSidebar />
      break
    
      break
    case "FACULTY":
      sidebar = <FacultySidebar />
      break
    case "STUDENT":
      sidebar = <Studentsidebar />
      break

 
  
    default:
      sidebar = null
  }

  return (
    <>
      <div className="min-h-screen flex flex-col md:flex-row">
        <div className="hidden md:block w-64 flex-shrink-0 sticky top-0 h-screen">{sidebar}</div>
        <div className="flex-grow flex flex-col min-w-0">
          <Header mobileSidebar={sidebar} />
          {children}
          <Footer />
        </div>
      </div>

      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-md p-0" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex flex-col items-center text-center p-6 pt-8">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
              <AlertTriangle className="h-7 w-7 text-yellow-500 dark:text-yellow-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Action Required</h3>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              To finish your account setup, please set your weekly lab day and group number on your profile.
            </p>
          </div>
          <DialogFooter className="bg-slate-50 dark:bg-slate-800/50 flex flex-row-reverse sm:justify-between px-6 py-4">
            <Button
              onClick={() => {
                setIsProfileModalOpen(false)
                router.push("/dashboard/profile")
              }}
            >
              Go to Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => setIsProfileModalOpen(false)}>
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DashboardLayout
