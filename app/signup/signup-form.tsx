"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GraduationCap, Mail, Lock, User, Building, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    department: "",
    email: "",
    password: "",
  })
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isOtpVerified, setIsOtpVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [otpError, setOtpError] = useState("")

  const { toast } = useToast()

  const departments = [
    "Computer Science Engineering",
    "Electronics and Communication Engineering",
    "Electrical and Electronics Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Information Technology",
    "Artificial Intelligence and Data Science",
    "Cyber Security",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const sendOtp = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your institutional email address.",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setOtpError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsOtpSent(true)
        toast({
          title: "OTP Sent! ✅",
          description: "Please check your email for the verification code.",
          className: "bg-green-50 border-green-200",
        })

        // Show debug OTP in development
        if (data.debug?.otp) {
          console.log("CollegeGPT Debug OTP:", data.debug.otp)
          toast({
            title: "Debug Mode",
            description: `OTP: ${data.debug.otp}`,
            className: "bg-yellow-50 border-yellow-200",
          })
        }
      } else {
        setOtpError(data.message || "Failed to send OTP")
        toast({
          title: "Error",
          description: data.message || "Failed to send OTP",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("CollegeGPT Send OTP Error:", error)
      setOtpError("Network error. Please try again.")
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otp) {
      toast({
        title: "OTP Required",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      })
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      toast({
        title: "Invalid OTP Format",
        description: "OTP must be exactly 6 digits.",
        variant: "destructive",
      })
      return
    }

    setIsVerifyingOtp(true)
    setOtpError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        setIsOtpVerified(true)
        toast({
          title: "Email Verified! ✅",
          description: "You can now complete your registration.",
          className: "bg-green-50 border-green-200",
        })
      } else {
        setOtpError(data.message || "Invalid OTP")
        toast({
          title: "Verification Failed",
          description: data.message || "Please check your code and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("CollegeGPT Verify OTP Error:", error)
      setOtpError("Network error. Please try again.")
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isOtpVerified) {
      toast({
        title: "Email Not Verified",
        description: "Please verify your email before registering.",
        variant: "destructive",
      })
      return
    }

    if (!formData.fullName || !formData.department || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsRegistering(true)
    try {
      console.log("CollegeGPT Registration - Submitting data:", {
        fullName: formData.fullName,
        department: formData.department,
        email: formData.email,
        passwordLength: formData.password.length,
      })

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log("CollegeGPT Registration - Response:", { status: response.status, data })

      if (response.ok && data.success) {
        toast({
          title: "Registration Successful! 🎉",
          description: "Your faculty account has been created. Redirecting to sign in...",
          className: "bg-green-50 border-green-200",
        })
        // Redirect to sign in page after a delay
        setTimeout(() => {
          window.location.href = "/signin"
        }, 2000)
      } else {
        console.error("CollegeGPT Registration - Failed:", data)
        toast({
          title: "Registration Failed",
          description: data.message || "Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("CollegeGPT Registration Error:", error)
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
              CollegeGPT
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Faculty Registration</h1>
          <p className="text-gray-600">Join CMR Technical Campus AI Assistant</p>
        </div>

        {/* Registration Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800">Create Your Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-gray-700 font-medium">
                  Department/Branch
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email with OTP */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Institutional Email
                </Label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@cmr.edu.in"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isOtpVerified}
                      required
                    />
                    {isOtpVerified && <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />}
                  </div>
                  <Button
                    type="button"
                    onClick={sendOtp}
                    disabled={isLoading || isOtpVerified || !formData.email}
                    className="h-12 px-4 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isOtpVerified ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </div>
              </div>

              {/* OTP Input */}
              {isOtpSent && !isOtpVerified && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="otp" className="text-gray-700 font-medium">
                    Verification Code
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      onClick={verifyOtp}
                      disabled={isVerifyingOtp || !otp || otp.length !== 6}
                      className="h-12 px-4 bg-green-600 hover:bg-green-700"
                    >
                      {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  {otpError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{otpError}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Check your email for the verification code</p>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!isOtpVerified || isRegistering}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Faculty Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
