import type { Metadata } from "next"
import SignUpForm from "./signup-form"

export const metadata: Metadata = {
  title: "Faculty Registration - CollegeGPT",
  description: "Register for a CollegeGPT faculty account to access AI-powered tools and administrative features.",
}

export default function SignUpPage() {
  return <SignUpForm />
}
