import { type NextRequest, NextResponse } from "next/server"
import otpStore from "@/lib/otp-store"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    console.log(`Verifying OTP for ${email}: ${otp}`) // For debugging

    if (!email || !otp) {
      return NextResponse.json({ message: "Email and OTP are required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ message: "OTP must be 6 digits" }, { status: 400 })
    }

    // Verify OTP
    const isValid = otpStore.verify(email, otp)

    if (!isValid) {
      const storedData = otpStore.get(email)
      if (!storedData) {
        return NextResponse.json({ message: "OTP not found or expired. Please request a new one." }, { status: 400 })
      } else {
        return NextResponse.json({ message: "Invalid OTP. Please check and try again." }, { status: 400 })
      }
    }

    // OTP verified successfully
    return NextResponse.json(
      {
        message: "OTP verified successfully",
        verified: true,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
