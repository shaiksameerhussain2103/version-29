import { type NextRequest, NextResponse } from "next/server"
import { sendOtpEmail } from "@/lib/email"
import otpStore from "@/lib/otp-store"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Store OTP with 10-minute expiry
    otpStore.set(email, otp, 10)

    console.log(`Generated OTP for ${email}: ${otp}`) // For debugging

    // Send OTP email
    const emailResult = await sendOtpEmail(email, otp)

    if (emailResult.success) {
      return NextResponse.json(
        {
          message: "OTP sent successfully",
          debug: process.env.NODE_ENV === "development" ? { otp } : undefined,
        },
        { status: 200 },
      )
    } else {
      console.error("Email sending failed:", emailResult.error)
      return NextResponse.json({ message: "Failed to send OTP email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
