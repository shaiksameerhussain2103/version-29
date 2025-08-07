import { GoogleGenerativeAI } from "@google/generative-ai"
import { routeAndScrapeQuery } from "./query-router"
import { generateStructuredRoutedResponse } from "./enhanced-structured-router"
import { matchQueryToTopic } from "./query-router"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface QueryRoutedResponse {
  answer: string
  images: string[]
  sources: string[]
  topic?: string
  urlsScraped?: number
  isRouted?: boolean
}

export async function generateQueryRoutedResponse(question: string): Promise<QueryRoutedResponse> {
  try {
    console.log("Enhanced Query Gemini - Processing question:", question)

    // Identify the topic first
    const topic = matchQueryToTopic(question)

    if (!topic) {
      console.log("Enhanced Query Gemini - No topic matched, using fallback")
      return generateQueryFallbackResponse(question)
    }

    console.log(`Enhanced Query Gemini - Using structured routing for topic: ${topic}`)

    // Use structured routing for better content extraction
    const structuredResponse = await generateStructuredRoutedResponse(question, topic)

    if (structuredResponse && structuredResponse.answer && structuredResponse.isStructuredRouted) {
      return {
        answer: structuredResponse.answer,
        images: structuredResponse.images || [],
        sources: structuredResponse.sources || [],
        topic: structuredResponse.topic,
        urlsScraped: structuredResponse.urlsScraped,
        isRouted: true,
      }
    }

    // If structured routing didn't work, fall back to the original method
    console.log("Enhanced Query Gemini - Structured routing failed, using original method")
    const routedData = await routeAndScrapeQuery(question)

    if (!routedData || !routedData.success) {
      console.log("Enhanced Query Gemini - No routed data available, using fallback")
      return generateQueryFallbackResponse(question)
    }

    console.log(
      `Enhanced Query Gemini - Using routed data for topic: ${routedData.topic} (${routedData.urlsScraped} URLs scraped)`,
    )

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are CollegeGPT, the official AI assistant for CMR Technical Campus. Your role is to answer students' academic and general queries using the provided institutional content.

IMPORTANT GUIDELINES:
- Use ONLY the information from the scraped college website data provided
- Be helpful, accurate, and professional in your responses
- Format responses with clear headings, bullet points, and structure using markdown
- If the provided data is limited, acknowledge this and direct users to official sources
- Include relevant details like contact information, procedures, or deadlines when available
- Keep responses comprehensive but concise (aim for 200-600 words)
- Always maintain a helpful and encouraging tone
- Use emojis sparingly and appropriately
- If information is missing from the scraped data, be honest about it

RESPONSE FORMAT:
- Use markdown formatting for better readability
- Structure with clear headings (##, ###)
- Use bullet points for lists
- Include contact information when available
- End with helpful next steps or official website reference

TOPIC FOCUS: This query is specifically about "${routedData.topic}" so focus your response on this topic using the comprehensive data provided from ${routedData.urlsScraped} official sources.

Do not hallucinate or make up information not present in the provided data. If information is missing, guide users to official sources.`,
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const prompt = `
User Question: "${question}"

Topic: ${routedData.topic}
URLs Scraped: ${routedData.urlsScraped}

Comprehensive College Website Data:
${routedData.content}

Available Image URLs: ${routedData.images.join(", ")}
Source URLs: ${routedData.sources.join(", ")}

Please provide a comprehensive, well-formatted answer based strictly on the provided college website information. Use markdown formatting for better readability. Focus specifically on ${routedData.topic} information using the data from multiple official sources. If the information is limited, acknowledge this and provide helpful guidance on where to find more details.

Focus on being helpful while staying within the bounds of the provided information.
`

    console.log("Enhanced Query Gemini - Sending request to API...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Enhanced Query Gemini - Received response, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    return {
      answer: text.trim(),
      images: routedData.images || [],
      sources: routedData.sources || [],
      topic: routedData.topic,
      urlsScraped: routedData.urlsScraped,
      isRouted: true,
    }
  } catch (error) {
    console.error("Enhanced Query Gemini - API Error:", error)

    // Return appropriate fallback based on error type
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      return generateQueryErrorFallback(question, "authentication")
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return generateQueryErrorFallback(question, "quota")
    } else {
      return generateQueryErrorFallback(question, "general")
    }
  }
}

function generateQueryFallbackResponse(question: string): QueryRoutedResponse {
  return {
    answer: `## 🤖 General Information Request

Thank you for your question about "${question}".

I'm designed to help with specific topics related to CMR Technical Campus such as:

### 📚 **What I can help with:**
• **Faculty Information** - Professor details, department faculty
• **Director Information** - College administration details  
• **Placements & Careers** - T&P cell, company visits, job opportunities
• **Fee Structure** - Course fees, payment information
• **Courses & Programs** - Available degrees, curriculum details
• **Contact Information** - Phone numbers, addresses, email contacts
• **Examination** - Question banks, results, schedules, evaluation
• **Notifications** - Circulars, announcements, notices

### 💡 **For your specific query:**
• Try rephrasing with specific keywords (e.g., "faculty", "placements", "fees", "results")
• Visit the official website: https://cmrtc.ac.in/
• Contact the college directly for detailed information

### 📞 **Direct Contact:**
For immediate assistance with your query, please:
• Visit: https://cmrtc.ac.in/contact/
• Call the college during working hours
• Email the relevant department

**How can I help you with CMR Technical Campus today?** 🎓`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    isRouted: false,
  }
}

function generateQueryErrorFallback(question: string, errorType: string): QueryRoutedResponse {
  const errorMessages = {
    authentication: "Service authentication issue - technical team notified",
    quota: "API usage limit reached - service will resume shortly",
    general: "Temporary technical issue - our team is working on it",
  }

  return {
    answer: `## 🔧 Service Temporarily Unavailable

I'm experiencing technical difficulties processing your question about "${question}".

### 🚨 **Error Details:**
${errorMessages[errorType] || errorMessages.general}

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

### 🎯 **Specific Topics I Can Help With:**
• Faculty information and profiles
• Director and administration details
• Placement and career services
• Fee structure and payments
• Course and program details
• Examination information
• Contact information

**I apologize for the inconvenience and will be back to help you soon!** 🎓`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    isRouted: false,
  }
}
