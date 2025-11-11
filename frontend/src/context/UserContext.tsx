"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import Base_Url from "@/hooks/Baseurl";




export type Role = 'STUDENT' | 'FACULTY' |  'ADMIN' ;

export interface UserData {
    id:number,
    name:string,
    email:string,
   IDnumber  : String,
    role:string,
 
}



type UserContextType = {
  userData: UserData | null
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>
  refreshUserData: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null)

  const refreshUserData = async () => {
    try {
      const response = await axios.get(
                    `${Base_Url}/auth/get_user_profile`,
                );
      setUserData(response.data.user)
    } catch (error) {
      console.error("Failed to refresh user data:", error)
      setUserData(null)
    }
  }

  return (
    <UserContext.Provider value={{ userData, setUserData, refreshUserData }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}


