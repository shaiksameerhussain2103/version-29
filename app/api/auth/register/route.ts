import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import bcrypt from "bcryptjs"
import otpStore from "@/lib/otp-store"

export async function POST(request: NextRequest) {
  try {
    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("CollegeGPT Register - JSON Parse Error:", parseError)
      return NextResponse.json(
        { message: "Invalid request format. Please check your data and try again." },
        { status: 400 },
      )
    }

    const { fullName, department, email, password } = requestBody

    // Comprehensive input validation
    if (!fullName || !department || !email || !password) {
      console.error("CollegeGPT Register - Missing fields:", {
        fullName: !!fullName,
        department: !!department,
        email: !!email,
        password: !!password,
      })
      return NextResponse.json(
        { message: "All fields are required. Please fill in your name, department, email, and password." },
        { status: 400 },
      )
    }

    // Validate field types and lengths
    if (typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ message: "Please enter a valid full name (at least 2 characters)." }, { status: 400 })
    }

    if (typeof department !== "string" || department.trim().length < 3) {
      return NextResponse.json({ message: "Please select a valid department." }, { status: 400 })
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ message: "Invalid email or password format." }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters long." }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()
    const trimmedDepartment = department.trim()

    // Check if email is verified via OTP
    console.log("CollegeGPT Register - Checking OTP verification for:", trimmedEmail)
    if (!otpStore.isVerified(trimmedEmail)) {
      return NextResponse.json(
        { message: "Email not verified. Please verify your email first using the OTP sent to your inbox." },
        { status: 400 },
      )
    }

    // Check if faculty member already exists
    console.log("CollegeGPT Register - Checking for existing faculty:", trimmedEmail)
    let facultyRef, existingQuery, querySnapshot

    try {
      facultyRef = collection(db, "faculty_profiles")
      existingQuery = query(facultyRef, where("email", "==", trimmedEmail))
      querySnapshot = await getDocs(existingQuery)
    } catch (firestoreError) {
      console.error("CollegeGPT Register - Firestore Query Error:", firestoreError)
      return NextResponse.json({ message: "Database connection error. Please try again in a moment." }, { status: 500 })
    }

    if (!querySnapshot.empty) {
      console.log("CollegeGPT Register - Faculty already exists:", trimmedEmail)
      return NextResponse.json(
        { message: "A faculty account with this email already exists. Please sign in instead." },
        { status: 400 },
      )
    }

    // Hash password securely
    console.log("CollegeGPT Register - Hashing password for:", trimmedEmail)
    let encryptedPassword
    try {
      const saltRounds = 12
      encryptedPassword = await bcrypt.hash(password, saltRounds)
    } catch (hashError) {
      console.error("CollegeGPT Register - Password Hash Error:", hashError)
      return NextResponse.json({ message: "Password processing error. Please try again." }, { status: 500 })
    }

    // Prepare faculty data
    const facultyData = {
      name: trimmedName,
      branch: trimmedDepartment,
      email: trimmedEmail,
      encryptedPassword: encryptedPassword,
      verified: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true,
      role: "faculty",
    }

    // Create faculty profile in Firestore
    console.log("CollegeGPT Register - Creating faculty profile for:", trimmedEmail)
    let docRef
    try {
      docRef = await addDoc(facultyRef, facultyData)
      console.log("CollegeGPT Register - Faculty profile created successfully:", docRef.id)
    } catch (firestoreWriteError) {
      console.error("CollegeGPT Register - Firestore Write Error:", firestoreWriteError)

      // Check if it's a permission error
      if (firestoreWriteError.code === "permission-denied") {
        return NextResponse.json(
          { message: "Database permission error. Please contact support if this persists." },
          { status: 500 },
        )
      }

      return NextResponse.json({ message: "Failed to create faculty account. Please try again." }, { status: 500 })
    }

    // Clean up OTP after successful registration
    try {
      otpStore.delete(trimmedEmail)
      console.log("CollegeGPT Register - OTP cleaned up for:", trimmedEmail)
    } catch (otpCleanupError) {
      console.error("CollegeGPT Register - OTP Cleanup Error:", otpCleanupError)
      // Don't fail the registration for OTP cleanup errors
    }

    // Return success response
    console.log("CollegeGPT Register - Registration completed successfully for:", trimmedEmail)
    return NextResponse.json(
      {
        message: "Faculty account created successfully! Welcome to CollegeGPT.",
        success: true,
        facultyId: docRef.id,
        email: trimmedEmail,
        name: trimmedName,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("CollegeGPT Register - Unexpected Error:", error)

    // Return generic error message for security
    return NextResponse.json(
      {
        message:
          "An unexpected error occurred during registration. Please try again or contact support if the problem persists.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
