"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"
import axios from "axios"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Lock, Loader2, Eye, EyeOff, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Base_Url from "@/hooks/Baseurl"
import { useUser } from "@/context/UserContext"

export default function LoginPage() {
  const router = useRouter()
  const { refreshUserData } = useUser()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // ✅ CAPTCHA logic
  const [captcha, setCaptcha] = useState("")
  const [captchaInput, setCaptchaInput] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  /** Generate random CAPTCHA text */
  const generateCaptchaText = () => {
    const chars = "ABCDEFGHJKLMNPQRTY23456789"
    let newCaptcha = ""
    for (let i = 0; i < 6; i++) {
      newCaptcha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptcha(newCaptcha)
    setCaptchaInput("")
  }

  /** Draw CAPTCHA on canvas */
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#f1f5f9"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      ctx.save()
      ctx.font = `bold ${Math.random() * 10 + 25}px "Courier New", monospace`
      ctx.fillStyle = `rgb(${Math.random() * 150}, ${Math.random() * 150}, ${Math.random() * 150})`
      ctx.translate(25 + i * 20, canvas.height / 2)
      ctx.rotate((Math.random() - 0.5) * 0.4)
      ctx.fillText(char, 0, Math.random() * 10 - 5)
      ctx.restore()
    }

    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
      ctx.strokeStyle = "rgba(0,0,0,0.2)"
      ctx.stroke()
    }
  }

  useEffect(() => {
    generateCaptchaText()
  }, [])

  useEffect(() => {
    if (captcha) drawCaptcha(captcha)
  }, [captcha])

  /** Handle login form submission */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLogin()
  }

  /** Login handler using cookies + useUser context */
const handleLogin = async () => {
  if (!email || !password) {
    setError("Please enter both email and password.")
    return
  }
  if (!captchaInput) {
    setError("Please enter the CAPTCHA.")
    return
  }
  if (captchaInput.toLowerCase() !== captcha.toLowerCase()) {
    setError("Invalid CAPTCHA. Please try again.")
    generateCaptchaText()
    return
  }

  setIsLoading(true)
  setError("")

  try {
    // 1) Try login — backend sets cookie (or returns OTP-needed info)
    const response = await axios.post(
      `${Base_Url}/auth/login`,
      { email, password },
      { withCredentials: true }
    )

    // 2) If backend says verification required, stash info and go to /verify
    if (
      response.data?.message?.toLowerCase?.().includes("verification") &&
      response.data?.emailverified === false
    ) {
      const payload = {
        user_id: response.data.user_id,
        email: response.data.email || email,
      }
      sessionStorage.setItem("pendingVerify", JSON.stringify(payload))
      router.push("/verify")
      return
    }

    // 3) Normal login path → now we can fetch profile
    await refreshUserData()
    const userRes = await axios.get(`${Base_Url}/auth/get_user_profile`, { withCredentials: true })
    const user = userRes.data.user

    if (!user?.emailverified) {
      // extremely defensive: if profile says not verified, still redirect to /verify
      sessionStorage.setItem("pendingVerify", JSON.stringify({ user_id: user?.id, email: user?.email || email }))
      router.push("/verify")
      return
    }

    if (user?.role) {
      if (rememberMe) localStorage.setItem("rememberMe", email)
      else localStorage.removeItem("rememberMe")
      // clean up any stale pendingVerify
      sessionStorage.removeItem("pendingVerify")
      router.push(`/dashboard`)
      return
    }

    setError("Unexpected login state. Please try again.")
  } catch (err: any) {
    // If server responds with OTP-needed shape in error, handle here too
    const msg = err.response?.data?.message || "Login failed. Please try again."
    const needsVerify =
      msg.toLowerCase().includes("verification") ||
      err.response?.data?.emailverified === false

    if (needsVerify) {
      const payload = {
        user_id: err.response?.data?.user_id,
        email: err.response?.data?.email || email,
      }
      sessionStorage.setItem("pendingVerify", JSON.stringify(payload))
      router.push("/verify")
      return
    }

    setError(msg)
    generateCaptchaText()
  } finally {
    setIsLoading(false)
  }
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center px-4 relative">
      <div className="absolute top-6 right-6 z-20">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-background/80 border border-border/40 shadow-2xl rounded-2xl p-8 backdrop-blur-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              ⚛️
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Lab Autonomy</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="example@lab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full w-10 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">CAPTCHA</label>
            <div className="flex items-center gap-2">
              <canvas
                ref={canvasRef}
                width="180"
                height="50"
                className="rounded-md border bg-slate-100"
              />
              <Button type="button" variant="outline" size="icon" onClick={generateCaptchaText}>
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
            <Input
              type="text"
              placeholder="Enter the text above"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">Keep me signed in</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-lg font-semibold text-base bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 flex justify-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link href="/register" className="ml-1 text-primary font-semibold hover:text-primary/80">
            Create one
          </Link>
        </div>

        <div className="mt-6 p-4 rounded-lg border border-border/30 bg-background/40 backdrop-blur-sm text-xs text-muted-foreground text-center">
          This is a secure, encrypted connection. Your credentials are protected with industry-standard encryption.
        </div>
      </div>
    </div>
  )
}
