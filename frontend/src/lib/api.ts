import Base_Url from "@/hooks/Baseurl"
import axios, { type AxiosError } from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add token to requests if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken")
      localStorage.removeItem("userRole")
      window.location.href = "/"
    }
    return Promise.reject(error)
  },
)

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) => apiClient.post(`${Base_Url}/auth/login`, { email, password }),

  register: (name: string, email: string, password: string, role: string, Idnumber: string) =>
    apiClient.post(`${Base_Url}/auth/signup`, { name, email, password, role, Idnumber }),

  verifyOTP: (otp: string, user_id: number) => apiClient.post(`${Base_Url}/auth/otp-verification-email`, { otp, user_id }),

  forgotPassword: (email: string) => apiClient.post(`${Base_Url}/auth/forgot-password`, { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    apiClient.post(`${Base_Url}/auth/reset-password`, { email, token, newPassword }),

  getUserProfile: () => apiClient.get(`${Base_Url}/auth/get_user_profile`),

  logout: () => apiClient.post(`${Base_Url}/auth/logout`),
}

export default apiClient
