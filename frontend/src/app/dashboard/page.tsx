"use client"


import AdminDashboard from "@/components/dashboard/admin/page"
import FacultyDashboard from "@/components/dashboard/faculty/page"

import StudentDashboard from "@/components/dashboard/student/page"



import { useUser } from "@/context/UserContext"
import { redirect } from "next/navigation"

export default function Dashboard() {
  const { userData } = useUser()

  // If there's no user data or role, redirect to the home page
  if (!userData || !userData.role) {
    redirect("/")
    return null
  }

  // Determine which dashboard to render based on user role
  let dashboardComponent 

  switch (userData.role) {
    case "ADMIN":
      dashboardComponent = <AdminDashboard />
      break
    case "FACULTY":
      dashboardComponent = <FacultyDashboard />
      break
    case "STUDENT":
      dashboardComponent = <StudentDashboard />
      break
  
      break


    default:
      // Optionally handle unknown roles
      dashboardComponent = <p>Unauthorized access :(</p>
      break
  }

  return (
    <>
{/* <StoreDashboard /> */}

      {dashboardComponent}
    </>
  )
}
