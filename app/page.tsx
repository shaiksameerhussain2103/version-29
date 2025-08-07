"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  GraduationCap,
  Shield,
  Mail,
  ArrowUp,
  Sparkles,
  Brain,
  BookOpen,
  Users2,
  Award,
  Menu,
  X,
  MessageSquare,
} from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useEffect, useState } from "react"

// Professional floating elements (subtle) - Fixed for SSR
const FloatingElements = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  if (dimensions.width === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-300/20 rounded-full"
          initial={{
            x: Math.random() * dimensions.width,
            y: Math.random() * dimensions.height,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            repeat: Number.POSITIVE_INFINITY,
            delay: i * 2,
          }}
        />
      ))}
    </div>
  )
}

// Professional background with subtle gradients
const ProfessionalBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
      <motion.div
        className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-indigo-600/10 to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Number.POSITIVE_INFINITY,
        }}
      />
    </div>
  )
}

// Professional scrolling tags
const ProfessionalTags = () => {
  const tags = [
    "Academic Excellence",
    "AI-Powered Learning",
    "Faculty Resources",
    "Student Support",
    "Digital Innovation",
    "Smart Campus",
    "Educational Technology",
    "Research Tools",
  ]

  return (
    <div className="relative overflow-hidden py-6">
      <motion.div
        className="flex space-x-6 whitespace-nowrap"
        animate={{
          x: [0, -800],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      >
        {[...tags, ...tags].map((tag, index) => (
          <span
            key={index}
            className="inline-block px-6 py-3 bg-white/5 backdrop-blur-sm rounded-lg text-white/70 text-sm font-medium border border-white/10 hover:bg-white/10 transition-colors"
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

// Professional AI icon animation
const ProfessionalAIIcon = () => {
  return (
    <div className="relative w-24 h-24 mx-auto mb-8">
      <motion.div
        className="absolute inset-0 border-2 border-blue-400/30 rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <Brain className="w-10 h-10 text-blue-400" />
      </motion.div>
    </div>
  )
}

export default function HomePage() {
  const [scrollToTop, setScrollToTop] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -30])

  useEffect(() => {
    const handleScroll = () => {
      setScrollToTop(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTopHandler = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Professional Navigation */}
      <motion.nav
        className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div className="flex items-center space-x-3" whileHover={{ scale: 1.02 }}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-md">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  CollegeGPT
                </span>
                <p className="text-xs text-gray-500 -mt-1">CMR Technical Campus</p>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "#about" },
                { name: "Student GPT", href: "/student-gpt" },
                { name: "Faculty Login", href: "/signin" },
                { name: "Contact", href: "#contact" },
              ].map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium relative group"
                  >
                    {item.name}
                    <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              className="md:hidden py-4 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {[
                { name: "Home", href: "/" },
                { name: "About", href: "#about" },
                { name: "Student GPT", href: "/student-gpt" },
                { name: "Faculty Login", href: "/signin" },
                { name: "Contact", href: "#contact" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Professional Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <ProfessionalBackground />
        <FloatingElements />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Professional AI Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <ProfessionalAIIcon />
          </motion.div>

          {/* Professional Content Card */}
          <motion.div
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ y: y1 }}
          >
            {/* Professional Heading */}
            <motion.h1
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span className="text-white">CollegeGPT</span>
              <br />
              <span className="text-2xl md:text-3xl text-blue-200 font-normal">
                AI Assistant for CMR Technical Campus
              </span>
            </motion.h1>

            {/* Professional Subtitle */}
            <motion.p
              className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Empowering academic excellence through intelligent assistance. Streamlined access to information for
              students and comprehensive tools for faculty.
            </motion.p>

            {/* Professional Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <Link href="/student-gpt">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base rounded-lg shadow-lg border-0 font-medium"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Try Student GPT
                  </Button>
                </motion.div>
              </Link>

              <Link href="/signin">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-base rounded-lg font-medium bg-transparent"
                  >
                    Faculty Login
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Professional Feature Icons */}
            <motion.div
              className="flex justify-center space-x-12 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
            >
              {[
                { icon: BookOpen, label: "Learning" },
                { icon: Users2, label: "Faculty" },
                { icon: Sparkles, label: "AI Powered" },
                { icon: Award, label: "Excellence" },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Professional Tags */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.3 }}
          >
            <ProfessionalTags />
          </motion.div>
        </div>

        {/* Professional Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="w-5 h-8 border border-white/40 rounded-full flex justify-center">
            <motion.div
              className="w-0.5 h-2 bg-white/60 rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          </div>
        </motion.div>
      </section>

      {/* Professional About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Platform Overview</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Dual-mode AI system designed to enhance academic experience for both students and faculty members
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Student Mode */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Student GPT</h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    AI-powered chatbot with instant access to college information including announcements, schedules,
                    and campus resources.
                  </p>
                  <ul className="space-y-3 text-gray-600 mb-6">
                    {[
                      "Real-time college information",
                      "Academic calendar and events",
                      "Admission and course details",
                      "Campus facilities and services",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/student-gpt">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Try Student GPT
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Faculty Mode */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Faculty Portal</h3>
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Secure, authenticated environment with advanced AI tools and administrative capabilities.
                  </p>
                  <ul className="space-y-3 text-gray-600 mb-6">
                    {[
                      "Document management and analysis",
                      "Administrative data access",
                      "Research and academic tools",
                      "Collaborative workspace features",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signin">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      <Shield className="w-4 h-4 mr-2" />
                      Faculty Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">CollegeGPT</span>
                  <p className="text-sm text-gray-400">CMR Technical Campus</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
                Advancing educational excellence through artificial intelligence and innovative technology solutions.
              </p>
              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4" />
                <span>cmr.collegegpt@gmail.com</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2">
                {[
                  { name: "Home", href: "/" },
                  { name: "About", href: "#about" },
                  { name: "Student GPT", href: "/student-gpt" },
                  { name: "Faculty Login", href: "/signin" },
                ].map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-300 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Connect</h4>
              <div className="flex space-x-3">
                {["LinkedIn", "GitHub", "Website"].map((social) => (
                  <div
                    key={social}
                    className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-medium">{social[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 CollegeGPT - CMR Technical Campus. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Professional Scroll to Top */}
      <motion.button
        className={`fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-300 ${
          scrollToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        onClick={scrollToTopHandler}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  )
}
