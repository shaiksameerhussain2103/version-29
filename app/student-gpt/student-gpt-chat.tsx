"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Send,
  RotateCcw,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Loader2,
  GraduationCap,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  images?: string[]
  sources?: string[]
  timestamp: Date
  isTyping?: boolean
  isError?: boolean
}

// Add this after the imports and before the component
const gptStyles = `
  .gpt-response {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #374151;
  }
  
  .gpt-heading-1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 1.5rem 0 1rem 0;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }
  
  .gpt-heading-2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin: 1.25rem 0 0.75rem 0;
  }
  
  .gpt-heading-3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #374151;
    margin: 1rem 0 0.5rem 0;
  }
  
  .gpt-paragraph {
    margin: 0.75rem 0;
    color: #4b5563;
  }
  
  .gpt-unordered-list {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  
  .gpt-ordered-list {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  
  .gpt-list-item {
    margin: 0.25rem 0;
    color: #4b5563;
  }
  
  .gpt-numbered-item {
    margin: 0.25rem 0;
    color: #4b5563;
  }
  
  .gpt-email-link {
    color: #2563eb;
    text-decoration: underline;
    text-decoration-color: #93c5fd;
  }
  
  .gpt-email-link:hover {
    color: #1d4ed8;
    text-decoration-color: #2563eb;
  }
  
  .gpt-url-link {
    color: #2563eb;
    text-decoration: underline;
    text-decoration-color: #93c5fd;
    word-break: break-all;
  }
  
  .gpt-url-link:hover {
    color: #1d4ed8;
    text-decoration-color: #2563eb;
  }
  
  .gpt-response strong {
    font-weight: 600;
    color: #1f2937;
  }
  
  .gpt-response em {
    font-style: italic;
    color: #6b7280;
  }
  
  /* Dark mode support */
  .dark .gpt-response {
    color: #d1d5db;
  }
  
  .dark .gpt-heading-1,
  .dark .gpt-heading-2 {
    color: #f9fafb;
  }
  
  .dark .gpt-heading-3 {
    color: #e5e7eb;
  }
  
  .dark .gpt-paragraph,
  .dark .gpt-list-item,
  .dark .gpt-numbered-item {
    color: #d1d5db;
  }
  
  .dark .gpt-response strong {
    color: #f9fafb;
  }
  
  .dark .gpt-response em {
    color: #9ca3af;
  }
  
  .dark .gpt-heading-1 {
    border-bottom-color: #374151;
  }
`

export default function StudentGPTChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: `👋 **Welcome to Student GPT!**

I'm your AI assistant for CMR Technical Campus. I can help you with:

• **Academics** - Course details, fee structure, syllabus
• **Admissions** - Eligibility, application process, deadlines  
• **Campus Life** - Facilities, hostels, activities
• **Placements** - Companies, statistics, training programs
• **Faculty** - Department information, contact details
• **General** - Location, contact info, college policies

Ask me anything about CMR Technical Campus! 🎓`,
      timestamp: new Date(),
    },
  ])

  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSources, setExpandedSources] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleApiResponse = async (response: Response) => {
    let data

    try {
      // Check if response is JSON by examining Content-Type header
      const contentType = response.headers.get("content-type")
      console.log("Student GPT - Response Content-Type:", contentType)
      console.log("Student GPT - Response Status:", response.status)

      if (contentType && contentType.includes("application/json")) {
        data = await response.json()
        console.log("Student GPT - Parsed JSON response:", data)
      } else {
        // If not JSON, treat as text error (likely HTML error page)
        const text = await response.text()
        console.error("Student GPT - Non-JSON response received:", text.substring(0, 200))

        // Return a structured error response
        return {
          success: false,
          answer: `❌ **Server Communication Error**

The server returned an unexpected response format. This usually indicates:

• Server is temporarily overloaded
• Network connectivity issues
• Service maintenance in progress

**Please try:**
• Refreshing the page and trying again
• Checking your internet connection
• Waiting a few moments before retrying

**For immediate help:**
• Visit: https://cmrtc.ac.in/
• Contact the college directly

Sorry for the technical difficulty! 🔧`,
          images: [],
          sources: ["https://cmrtc.ac.in/"],
        }
      }
    } catch (parseError) {
      console.error("Student GPT - Response parsing error:", parseError)
      return {
        success: false,
        answer: `❌ **Connection Error**

I'm having trouble connecting to the server right now. This could be due to:

• Network connectivity issues
• Server maintenance
• High traffic load

**Please try:**
• Refreshing the page
• Checking your internet connection
• Trying again in a few moments

**For immediate help:**
• Visit: https://cmrtc.ac.in/
• Contact the college directly

Sorry for the inconvenience! 🔧`,
        images: [],
        sources: ["https://cmrtc.ac.in/"],
      }
    }

    // Ensure the response has the expected structure
    if (!data || typeof data !== "object") {
      return {
        success: false,
        answer: "❌ **Invalid Response**\n\nReceived an invalid response from the server. Please try again.",
        images: [],
        sources: ["https://cmrtc.ac.in/"],
      }
    }

    // Provide defaults for missing fields
    return {
      success: data.success !== false,
      answer: data.answer || "I apologize, but I couldn't generate a proper response. Please try again.",
      images: Array.isArray(data.images) ? data.images : [],
      sources: Array.isArray(data.sources) ? data.sources : ["https://cmrtc.ac.in/"],
      cached: data.cached || false,
      error: data.error || null,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: "typing",
      type: "ai",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, typingMessage])

    try {
      console.log("Student GPT - Sending request:", userMessage.content)

      const response = await fetch("/api/student-gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ question: userMessage.content }),
      })

      console.log("Student GPT - Response status:", response.status)
      console.log("Student GPT - Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await handleApiResponse(response)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.answer || "I apologize, but I couldn't generate a response. Please try again.",
        images: data.images || [],
        sources: data.sources || [],
        timestamp: new Date(),
        isError: !data.success,
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(aiMessage))
    } catch (error) {
      console.error("Student GPT - Network Error:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: `❌ **Network Error**

I couldn't connect to the server. This might be due to:

• Internet connectivity issues
• Server temporarily unavailable
• Browser blocking the request

**Please try:**
• Checking your internet connection
• Refreshing the page
• Trying again in a moment

**Alternative options:**
• Visit the official website: https://cmrtc.ac.in/
• Contact the college directly for urgent queries

I'll be back online soon! 🔄`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => prev.filter((m) => m.id !== "typing").concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId)
    if (messageIndex === -1) return

    const userMessage = messages[messageIndex - 1]
    if (!userMessage || userMessage.type !== "user") return

    setIsLoading(true)

    // Add typing indicator
    const typingMessage: Message = {
      id: "typing-regen",
      type: "ai",
      content: "",
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages((prev) => [...prev, typingMessage])

    try {
      console.log("Student GPT - Regenerating response for:", userMessage.content)

      const response = await fetch("/api/student-gpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ question: userMessage.content }),
      })

      const data = await handleApiResponse(response)

      const newAiMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: data.answer || "I apologize, but I couldn't generate a response. Please try again.",
        images: data.images || [],
        sources: data.sources || [],
        timestamp: new Date(),
        isError: !data.success,
      }

      setMessages((prev) => prev.filter((m) => m.id !== "typing-regen").concat(newAiMessage))
    } catch (error) {
      console.error("Student GPT - Regenerate Error:", error)

      const errorMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: `❌ **Regeneration Failed**

I couldn't regenerate the response due to a network error.

**Please try:**
• Using the original response above
• Asking your question again
• Refreshing the page

Sorry for the inconvenience! 🔄`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => prev.filter((m) => m.id !== "typing-regen").concat(errorMessage))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        content: `👋 **Welcome back to Student GPT!**

I'm ready to help you with any questions about CMR Technical Campus. What would you like to know?`,
        timestamp: new Date(),
      },
    ])
  }

  const handleFeedback = async (messageId: string, isHelpful: boolean) => {
    // Optional: Send feedback to analytics
    console.log(`Feedback for message ${messageId}: ${isHelpful ? "helpful" : "not helpful"}`)
  }

  const formatContent = (content: string) => {
    if (!content) return ""

    // Convert markdown-style content to clean HTML
    const html = content
      // Convert headers (### -> h3, ## -> h2, # -> h1)
      .replace(/^### (.*$)/gim, '<h3 class="gpt-heading-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="gpt-heading-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="gpt-heading-1">$1</h1>')

      // Convert bold text (**text** -> <strong>)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

      // Convert italic text (*text* -> <em>)
      .replace(/\*(.*?)\*/g, "<em>$1</em>")

      // Convert bullet points (• text -> <li>)
      .replace(/^• (.*$)/gim, '<li class="gpt-list-item">$1</li>')

      // Convert numbered lists (1. text -> <li>)
      .replace(/^\d+\. (.*$)/gim, '<li class="gpt-numbered-item">$1</li>')

      // Convert email links
      .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1" class="gpt-email-link">$1</a>')

      // Convert URLs to clickable links
      .replace(
        /(https?:\/\/[^\s<>"]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="gpt-url-link">$1</a>',
      )

      // Split into paragraphs and wrap
      .split("\n\n")
      .map((paragraph) => {
        if (!paragraph.trim()) return ""

        // Check if paragraph contains list items
        if (paragraph.includes('<li class="gpt-list-item">')) {
          return `<ul class="gpt-unordered-list">${paragraph}</ul>`
        }
        if (paragraph.includes('<li class="gpt-numbered-item">')) {
          return `<ol class="gpt-ordered-list">${paragraph}</ol>`
        }

        // Check if it's already a heading
        if (paragraph.match(/^<h[1-6]/)) {
          return paragraph
        }

        // Wrap in paragraph
        return `<p class="gpt-paragraph">${paragraph}</p>`
      })
      .join("")

      // Clean up empty elements
      .replace(/<p class="gpt-paragraph"><\/p>/g, "")
      .replace(/<ul class="gpt-unordered-list"><\/ul>/g, "")
      .replace(/<ol class="gpt-ordered-list"><\/ol>/g, "")

    return html
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <style dangerouslySetInnerHTML={{ __html: gptStyles }} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text text-transparent">
                  CollegeGPT
                </span>
                <p className="text-sm text-gray-600">Student GPT</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleClearChat}
                variant="outline"
                size="sm"
                className="border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
              <Link href="/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  Faculty Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-4rem)] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : "flex-row"} items-start space-x-3`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === "user"
                      ? "bg-blue-600 text-white ml-3"
                      : message.isError
                        ? "bg-red-500 text-white mr-3"
                        : "bg-gradient-to-br from-amber-500 to-orange-600 text-white mr-3"
                  }`}
                >
                  {message.type === "user" ? (
                    <User className="w-4 h-4" />
                  ) : message.isError ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Content */}
                <Card
                  className={`${
                    message.type === "user"
                      ? "bg-blue-600 text-white border-0"
                      : message.isError
                        ? "bg-red-50 border-red-200 shadow-sm"
                        : "bg-white border-gray-200 shadow-sm"
                  }`}
                >
                  <CardContent className="p-4">
                    {message.isTyping ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`gpt-response prose prose-sm max-w-none ${
                            message.type === "user" ? "prose-invert" : message.isError ? "prose-red" : ""
                          }`}
                          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                        />

                        {/* Images */}
                        {message.images && message.images.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Images</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {message.images.map((img, idx) => (
                                <div key={idx} className="relative">
                                  <img
                                    src={img || "/placeholder.svg"}
                                    alt={`Reference image ${idx + 1}`}
                                    className="rounded-lg max-w-full h-auto shadow-sm border border-gray-200"
                                    style={{ maxWidth: "100%", height: "auto" }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none"
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-4 border-t border-gray-200 pt-3">
                            <button
                              onClick={() => setExpandedSources(expandedSources === message.id ? "" : message.id)}
                              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
                            >
                              <span>Sources ({message.sources.length})</span>
                              {expandedSources === message.id ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                              )}
                            </button>
                            {expandedSources === message.id && (
                              <div className="space-y-2">
                                {message.sources.map((source, idx) => (
                                  <div key={idx} className="flex items-start space-x-2">
                                    <span className="text-xs text-gray-500 mt-1">{idx + 1}.</span>
                                    <a
                                      href={source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                                    >
                                      {source.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI Message Actions */}
                        {message.type === "ai" && !message.isTyping && (
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleFeedback(message.id, true)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-green-600"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, false)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRegenerate(message.id)}
                              disabled={isLoading}
                              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Regenerate</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about CMR Technical Campus..."
                className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Student GPT can make mistakes. Verify important information with official college sources.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
