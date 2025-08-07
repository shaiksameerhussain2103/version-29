import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GraduationCap, Users, FileText, Settings, BarChart3, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Faculty Dashboard - CollegeGPT",
  description: "Access your CollegeGPT faculty dashboard with AI-powered tools and administrative features.",
}

export default function FacultyDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
                  CollegeGPT
                </span>
                <p className="text-sm text-gray-600">Faculty Dashboard</p>
              </div>
            </div>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to Faculty Dashboard</h1>
          <p className="text-gray-600">Access your AI-powered tools and manage your academic resources.</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* AI Assistant */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <span>AI Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Chat with your private AI assistant powered by your uploaded documents.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Start Conversation</Button>
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-amber-600" />
                <span>Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Upload and manage your academic documents and resources.</p>
              <Button className="w-full bg-amber-600 hover:bg-amber-700">Manage Documents</Button>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-green-600" />
                <span>Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View usage statistics and AI interaction insights.</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">View Analytics</Button>
            </CardContent>
          </Card>

          {/* Student Queries */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-purple-600" />
                <span>Student Queries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Monitor and respond to student questions and feedback.</p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">View Queries</Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-gray-50 to-gray-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Settings className="w-6 h-6 text-gray-600" />
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Configure your account preferences and AI settings.</p>
              <Button className="w-full bg-gray-600 hover:bg-gray-700">Open Settings</Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50">
            <CardHeader>
              <CardTitle className="text-indigo-600">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Documents Uploaded:</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">AI Conversations:</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Student Interactions:</span>
                <span className="font-semibold">0</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto border-0 bg-gradient-to-r from-blue-50 to-amber-50">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">🚀 More Features Coming Soon!</h3>
              <p className="text-gray-600">
                We're continuously working to enhance your CollegeGPT experience. Stay tuned for advanced AI features,
                document analysis tools, and enhanced collaboration capabilities.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
