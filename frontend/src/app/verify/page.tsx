"use client"

import { useState, useEffect } from "react"
import type React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Base_Url from "@/hooks/Baseurl"

type PendingVerify = { user_id: number; email: string }

export default function VerifyPage() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState("")
  const [resendCount, setResendCount] = useState(0)
  const [pending, setPending] = useState<PendingVerify | null>(null)

  // Load pending verification info (set in login step)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("pendingVerify")
      if (raw) {
        setPending(JSON.parse(raw))
      } else {
        setError("Missing verification context. Please log in again.")
      }
    } catch {
      setError("Unable to load verification context. Please log in again.")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!pending?.user_id) {
      setError("User data not loaded yet. Please log in again.")
      return
    }
    if (otp.length < 5) {
      setError("Please enter the 5-digit code.")
      return
    }

    setIsLoading(true)
    try {
      const res = await axios.post(
        `${Base_Url}/auth/otp-verification-email`,
        { otp, user_id: pending.user_id },
        { withCredentials: true }
      )

      if (res.data.success) {
        setIsVerified(true)
        // clean up temp data
        sessionStorage.removeItem("pendingVerify")
        setTimeout(() => router.push("/dashboard"), 1000)
      } else {
        setError(res.data.message || "OTP verification failed.")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP verification failed.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    if (!pending?.email) {
      setError("Missing email to resend OTP. Please log in again.")
      return
    }
    try {
      await axios.post(
        `${Base_Url}/auth/resend-otp`,
        { email: pending.email },
        { withCredentials: true }
      )
      setResendCount((c) => c + 1)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP")
    }
  }

  // Success screen
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
        <div className="absolute top-6 right-6 z-20">
          <ThemeSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-lg text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-green-500/20">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground">
                Your email has been verified successfully. Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Normal screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="absolute top-6 right-6 z-20">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
            <span className="text-xs font-medium text-primary">Verification pending</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
              ✉️
            </div>
            <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a verification code to{" "}
              <span className="font-medium text-foreground">{pending?.email || "your email"}</span>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Enter OTP Code</label>
              <Input
                type="text"
                placeholder="00000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 5))}
                className="rounded-lg text-center text-2xl font-mono tracking-widest"
                maxLength={5}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Check your email and enter the 5-digit code
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || otp.length < 5 || !pending?.user_id}
              className="w-full rounded-lg"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              <button
                onClick={handleResend}
                disabled={isLoading || !pending?.email}
                className="text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-50"
              >
                Resend OTP
              </button>
            </p>
            {resendCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                OTP resent {resendCount} time(s)
              </p>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
