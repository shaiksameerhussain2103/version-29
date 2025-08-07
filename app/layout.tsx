import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CollegeGPT – AI Assistant for CMR Technical Campus",
  description:
    "An AI-powered assistant for students and faculty at CMR Technical Campus, offering instant answers, document-based GPT, and academic automation.",
  keywords: [
    "CollegeGPT",
    "CMR Technical Campus",
    "AI Chatbot",
    "Faculty Assistant",
    "Student Queries",
    "Academic Automation",
    "GPT",
    "Education Technology",
    "CMR",
    "AI Assistant",
  ],
  authors: [{ name: "Shaik Sameer Hussain", email: "shaiksameerhussain@gmail.com" }],
  creator: "Shaik Sameer Hussain",
  publisher: "CMR Technical Campus",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://collegegpt.vercel.app",
    title: "CollegeGPT – AI Assistant for CMR Technical Campus",
    description:
      "An AI-powered assistant for students and faculty at CMR Technical Campus, offering instant answers, document-based GPT, and academic automation.",
    siteName: "CollegeGPT",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CollegeGPT - AI Assistant for CMR Technical Campus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CollegeGPT – AI Assistant for CMR Technical Campus",
    description:
      "An AI-powered assistant for students and faculty at CMR Technical Campus, offering instant answers, document-based GPT, and academic automation.",
    images: ["/og-image.png"],
    creator: "@shaiksameerhussain",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  category: "education",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="application-name" content="CollegeGPT" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CollegeGPT" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Inline SVG Favicon - CollegeGPT */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%231e40af;stop-opacity:1' /><stop offset='100%25' style='stop-color:%23d97706;stop-opacity:1' /></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23grad)'/><path d='M25 45 L50 35 L75 45 L75 55 L50 65 L25 55 Z' fill='white' opacity='0.9'/><circle cx='50' cy='42' r='8' fill='white'/><rect x='47' y='50' width='6' height='15' fill='white' rx='3'/></svg>"
        />

        {/* Fallback favicon for older browsers */}
        <link
          rel="shortcut icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' style='stop-color:%231e40af;stop-opacity:1' /><stop offset='100%25' style='stop-color:%23d97706;stop-opacity:1' /></linearGradient></defs><circle cx='50' cy='50' r='45' fill='url(%23grad)'/><path d='M25 45 L50 35 L75 45 L75 55 L50 65 L25 55 Z' fill='white' opacity='0.9'/><circle cx='50' cy='42' r='8' fill='white'/><rect x='47' y='50' width='6' height='15' fill='white' rx='3'/></svg>"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "CollegeGPT",
              description: "AI-powered assistant for students and faculty at CMR Technical Campus",
              url: "https://collegegpt.vercel.app",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Person",
                name: "Shaik Sameer Hussain",
                email: "shaiksameerhussain@gmail.com",
              },
              publisher: {
                "@type": "Organization",
                name: "CMR Technical Campus",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
