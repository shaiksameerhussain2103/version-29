// Shared OTP storage that persists across API routes
interface OtpData {
  otp: string
  expires: number
}

class OtpStore {
  private store = new Map<string, OtpData>()

  set(email: string, otp: string, expiryMinutes = 10) {
    try {
      const expires = Date.now() + expiryMinutes * 60 * 1000
      this.store.set(email.toLowerCase().trim(), { otp, expires })
      console.log(`CollegeGPT OTP Store - OTP set for ${email}, expires in ${expiryMinutes} minutes`)
    } catch (error) {
      console.error("CollegeGPT OTP Store - Set Error:", error)
    }
  }

  get(email: string): OtpData | undefined {
    try {
      const data = this.store.get(email.toLowerCase().trim())
      if (!data) {
        console.log(`CollegeGPT OTP Store - No OTP found for ${email}`)
        return undefined
      }

      // Check if expired
      if (Date.now() > data.expires) {
        console.log(`CollegeGPT OTP Store - OTP expired for ${email}`)
        this.store.delete(email.toLowerCase().trim())
        return undefined
      }

      return data
    } catch (error) {
      console.error("CollegeGPT OTP Store - Get Error:", error)
      return undefined
    }
  }

  verify(email: string, otp: string): boolean {
    try {
      const data = this.get(email)
      if (!data) {
        console.log(`CollegeGPT OTP Store - Verification failed: No OTP data for ${email}`)
        return false
      }

      const isValid = data.otp === otp.trim()
      if (isValid) {
        // Keep the OTP for registration process, but mark as verified
        this.store.set(email.toLowerCase().trim(), { ...data, otp: `VERIFIED_${otp}` })
        console.log(`CollegeGPT OTP Store - OTP verified successfully for ${email}`)
      } else {
        console.log(`CollegeGPT OTP Store - OTP verification failed for ${email}`)
      }
      return isValid
    } catch (error) {
      console.error("CollegeGPT OTP Store - Verify Error:", error)
      return false
    }
  }

  isVerified(email: string): boolean {
    try {
      const data = this.store.get(email.toLowerCase().trim())
      const verified = data ? data.otp.startsWith("VERIFIED_") : false
      console.log(`CollegeGPT OTP Store - Verification status for ${email}: ${verified}`)
      return verified
    } catch (error) {
      console.error("CollegeGPT OTP Store - IsVerified Error:", error)
      return false
    }
  }

  delete(email: string) {
    try {
      const deleted = this.store.delete(email.toLowerCase().trim())
      console.log(`CollegeGPT OTP Store - OTP deleted for ${email}: ${deleted}`)
    } catch (error) {
      console.error("CollegeGPT OTP Store - Delete Error:", error)
    }
  }

  // Clean up expired OTPs periodically
  cleanup() {
    try {
      const now = Date.now()
      let cleanedCount = 0
      for (const [email, data] of this.store.entries()) {
        if (now > data.expires) {
          this.store.delete(email)
          cleanedCount++
        }
      }
      if (cleanedCount > 0) {
        console.log(`CollegeGPT OTP Store - Cleaned up ${cleanedCount} expired OTPs`)
      }
    } catch (error) {
      console.error("CollegeGPT OTP Store - Cleanup Error:", error)
    }
  }
}

// Create a singleton instance
const otpStore = new OtpStore()

// Clean up expired OTPs every 5 minutes
setInterval(
  () => {
    otpStore.cleanup()
  },
  5 * 60 * 1000,
)

export default otpStore
