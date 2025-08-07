import { GoogleGenerativeAI } from "@google/generative-ai"
import { getTopicUrls } from "./query-router"
import {
  scrapeStructuredContent,
  formatStructuredContent,
  combineStructuredImages,
  combineStructuredSources,
} from "./structured-scraper"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface StructuredRoutedResponse {
  answer: string
  images: string[]
  sources: string[]
  topic?: string
  urlsScraped?: number
  structuredDataFound?: boolean
  isStructuredRouted?: boolean
}

export async function generateStructuredRoutedResponse(
  question: string,
  topic: string,
): Promise<StructuredRoutedResponse> {
  try {
    console.log(`Structured Router - Processing question for topic: ${topic}`)

    // Get URLs for the topic
    const urls = await getTopicUrls(topic)

    if (urls.length === 0) {
      console.log(`Structured Router - No URLs found for topic: ${topic}`)
      return generateStructuredFallbackResponse(question, topic)
    }

    console.log(`Structured Router - Scraping ${urls.length} URLs for structured content`)

    // Scrape all URLs for structured content
    const scrapePromises = urls.map((url) => scrapeStructuredContent(url, topic))
    const results = await Promise.allSettled(scrapePromises)

    const structuredData = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((data) => data.success)

    if (structuredData.length === 0) {
      console.log(`Structured Router - No structured data extracted for topic: ${topic}`)
      return generateStructuredFallbackResponse(question, topic)
    }

    // Format structured content for Gemini
    const formattedContent = formatStructuredContent(structuredData)
    const images = combineStructuredImages(structuredData)
    const sources = combineStructuredSources(structuredData)

    console.log(`Structured Router - Successfully extracted structured data from ${structuredData.length} URLs`)

    // Check if we have meaningful structured content
    const hasStructuredContent = structuredData.some((data) => data.structuredContent.length > 0)

    if (!hasStructuredContent) {
      console.log(`Structured Router - No meaningful structured content found, using fallback`)
      return generateStructuredFallbackResponse(question, topic)
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are CollegeGPT, the official AI assistant for CMR Technical Campus. You have been provided with structured, pre-processed data extracted from official college pages.

IMPORTANT GUIDELINES:
- Use ONLY the structured data provided below
- The data has been specifically extracted from relevant sections of official pages
- Format your response with clear headings, bullet points, and structure using markdown
- Be comprehensive and include all relevant details from the structured data
- If asking about companies, list them clearly with proper formatting
- If asking about faculty, include names, designations, and contact info when available
- If asking about downloads/links, provide clear instructions on how to access them
- Keep responses well-organized and student-friendly
- Use emojis sparingly and appropriately

TOPIC FOCUS: This query is specifically about "${topic}" and you have structured data extracted from ${structuredData.length} official pages.

The structured data includes specific lists, tables, and organized content rather than raw page text. Use this to provide accurate, detailed responses.`,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const prompt = `
User Question: "${question}"

Topic: ${topic}
URLs Processed: ${structuredData.length}

STRUCTURED DATA EXTRACTED FROM OFFICIAL CMR TECHNICAL CAMPUS PAGES:
${formattedContent}

Available Images: ${images.length > 0 ? images.join(", ") : "None"}
Source Pages: ${sources.join(", ")}

Please provide a comprehensive, well-formatted answer using the structured data above. Focus on presenting the information in a clear, organized manner that directly addresses the user's question about ${topic}.

If the structured data contains lists (companies, faculty, downloads, etc.), present them in an organized format. If there are contact details, include them. If there are links or downloads, explain how to access them.
`

    console.log("Structured Router - Sending structured data to Gemini API...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Structured Router - Received response from Gemini, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    return {
      answer: text.trim(),
      images: images,
      sources: sources,
      topic: topic,
      urlsScraped: structuredData.length,
      structuredDataFound: true,
      isStructuredRouted: true,
    }
  } catch (error) {
    console.error("Structured Router - API Error:", error)
    return generateStructuredErrorFallback(question, topic, error.message)
  }
}

function generateStructuredFallbackResponse(question: string, topic: string): StructuredRoutedResponse {
  const topicResponses = {
    placements: `## 🏢 Placement Information

I'm having difficulty accessing the current placement data from the official pages.

### 📊 **What I can help you find:**
• **Companies Visited** - List of recruiting companies
• **Placement Statistics** - Success rates and numbers
• **Student Achievements** - Placement highlights
• **Training Programs** - Skill development initiatives

### 🔗 **For Current Information:**
• **T&P Cell Page**: https://cmrtc.ac.in/t-p-cell/about-t-p-cell/
• **Companies Visited**: https://cmrtc.ac.in/t-p-cell/companies-visited/
• **Contact T&P Cell**: Visit the official website for contact details

**Please visit the official pages or contact the Training & Placement Cell directly for the most current placement information.**`,

    faculty: `## 👨‍🏫 Faculty Information

I'm having difficulty accessing the current faculty data from the official pages.

### 📋 **What I can help you find:**
• **Faculty Profiles** - Names, designations, qualifications
• **Department Faculty** - Subject-wise faculty lists
• **Contact Information** - Email addresses and office details
• **Research Areas** - Faculty expertise and interests

### 🔗 **For Current Information:**
• **CSE Faculty**: https://cmrtc.ac.in/departments/department-of-computer-science-engineering/faculty/
• **Other Departments**: Visit respective department pages
• **Contact College**: For specific faculty inquiries

**Please visit the official department pages for complete faculty profiles and contact information.**`,

    question_bank: `## 📚 Question Bank Information

I'm having difficulty accessing the current question bank data from the official pages.

### 📖 **What I can help you find:**
• **Previous Question Papers** - Subject-wise past papers
• **Download Links** - PDF access to question banks
• **Exam Patterns** - Question paper formats
• **Subject Coverage** - Available subjects and years

### 🔗 **For Current Information:**
• **Question Banks**: https://cmrtc.ac.in/exam-section/question-banks/
• **Exam Section**: Visit for complete examination resources
• **Contact Exam Cell**: For specific paper requests

**Please visit the official exam section for downloadable question papers and study materials.**`,
  }

  return {
    answer:
      topicResponses[topic] ||
      `## ℹ️ ${topic.charAt(0).toUpperCase() + topic.slice(1)} Information

I'm having difficulty accessing the current ${topic} data from the official pages.

### 🔗 **For Current Information:**
• **Official Website**: https://cmrtc.ac.in/
• **Contact College**: Visit the contact page for assistance
• **Try Again**: The information may be available shortly

**Please visit the official website or contact the college directly for the most current ${topic} information.**`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    topic: topic,
    urlsScraped: 0,
    structuredDataFound: false,
    isStructuredRouted: false,
  }
}

function generateStructuredErrorFallback(
  question: string,
  topic: string,
  errorMessage: string,
): StructuredRoutedResponse {
  return {
    answer: `## 🔧 Service Temporarily Unavailable

I'm experiencing technical difficulties processing your ${topic} question: "${question}".

### 🚨 **Technical Issue:**
${
  errorMessage.includes("quota")
    ? "API usage limit reached - service will resume shortly"
    : errorMessage.includes("authentication")
      ? "Service authentication issue - technical team notified"
      : "Temporary technical issue - our team is working on it"
}

### 💡 **What you can do:**
• **Visit Official Website**: https://cmrtc.ac.in/
• **Contact Directly**: Call or email the college
• **Try Again Later**: Service may be restored shortly
• **Rephrase Question**: Try asking with different keywords

### 📞 **For Immediate Assistance:**
• **Contact Page**: https://cmrtc.ac.in/contact/
• **Phone**: Check the official website for current numbers
• **Email**: Available on the college website
• **Visit Campus**: Direct visit during working hours

**I apologize for the inconvenience and will be back to help you soon!** 🎓`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    topic: topic,
    urlsScraped: 0,
    structuredDataFound: false,
    isStructuredRouted: false,
  }
}
