import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Find faculty member
    const facultyRef = collection(db, "faculty_profiles")
    const q = query(facultyRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return NextResponse.json({ message: "Invalid credentials or unverified email" }, { status: 401 })
    }

    const facultyDoc = querySnapshot.docs[0]
    const facultyData = facultyDoc.data()

    // Check if account is verified
    if (!facultyData.verified) {
      return NextResponse.json({ message: "Email not verified. Please complete registration." }, { status: 401 })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, facultyData.encryptedPassword)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials or unverified email" }, { status: 401 })
    }

    // Successful login
    return NextResponse.json(
      {
        message: "Sign in successful",
        faculty: {
          id: facultyDoc.id,
          name: facultyData.name,
          email: facultyData.email,
          branch: facultyData.branch,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Sign in error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
