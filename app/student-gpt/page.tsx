import type { Metadata } from "next"
import StudentGPTChat from "./student-gpt-chat"

export const metadata: Metadata = {
  title: "Student GPT - CollegeGPT",
  description:
    "Ask questions about CMR Technical Campus - Get instant AI-powered answers about academics, admissions, facilities, and more.",
  keywords: ["Student GPT", "CMR queries", "college information", "AI assistant", "student help"],
}

export default function StudentGPTPage() {
  return <StudentGPTChat />
}
