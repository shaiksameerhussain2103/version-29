import type { Metadata } from "next"
import SignInForm from "./signin-form"

export const metadata: Metadata = {
  title: "Faculty Sign In - CollegeGPT",
  description: "Sign in to your CollegeGPT faculty account to access AI-powered tools and administrative features.",
}

export default function SignInPage() {
  return <SignInForm />
}
