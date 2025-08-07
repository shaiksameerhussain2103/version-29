import { GoogleGenerativeAI } from "@google/generative-ai"
import { getTargetedCollegeData, getTopicFallbackData } from "./targeted-scraper"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface EnhancedScrapedData {
  content: string
  images: string[]
  sources: string[]
  topic?: string
  isTargeted?: boolean
}

interface EnhancedGeminiResponse {
  answer: string
}

export async function generateEnhancedGeminiResponse(question: string): Promise<{
  answer: string
  images: string[]
  sources: string[]
  topic?: string
}> {
  try {
    console.log("Enhanced Gemini - Processing question:", question)

    // Try targeted scraping first
    const targetedData = await getTargetedCollegeData(question)

    let scrapedData: EnhancedScrapedData
    let isTargeted = false

    if (targetedData && targetedData.success) {
      console.log(`Enhanced Gemini - Using targeted data for topic: ${targetedData.topic}`)
      scrapedData = {
        content: targetedData.content,
        images: targetedData.images,
        sources: [targetedData.sourceUrl],
        topic: targetedData.topic,
        isTargeted: true,
      }
      isTargeted = true
    } else if (targetedData && !targetedData.success) {
      console.log(`Enhanced Gemini - Targeted scraping failed, using fallback for topic: ${targetedData.topic}`)
      const fallbackData = getTopicFallbackData(targetedData.topic)
      scrapedData = {
        content: fallbackData.content,
        images: fallbackData.images,
        sources: [fallbackData.sourceUrl],
        topic: fallbackData.topic,
        isTargeted: false,
      }
    } else {
      // No specific topic identified, use general response
      console.log("Enhanced Gemini - No specific topic identified, providing general guidance")
      return generateGeneralGuidanceResponse(question)
    }

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

${isTargeted ? `TOPIC FOCUS: This query is specifically about "${scrapedData.topic}" so focus your response on this topic using the targeted data provided.` : ""}

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

${isTargeted ? `Topic: ${scrapedData.topic}` : "General Query"}

Scraped College Website Data:
${scrapedData.content || "Limited data available from college website."}

Available Image URLs: ${scrapedData.images.join(", ")}
Source URL: ${scrapedData.sources.join(", ")}

Please provide a comprehensive, well-formatted answer based strictly on the provided college website information. Use markdown formatting for better readability. ${isTargeted ? `Focus specifically on ${scrapedData.topic} information.` : ""} If the information is limited, acknowledge this and provide helpful guidance on where to find more details.

Focus on being helpful while staying within the bounds of the provided information.
`

    console.log("Enhanced Gemini - Sending request to API...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Enhanced Gemini - Received response, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    return {
      answer: text.trim(),
      images: scrapedData.images || [],
      sources: scrapedData.sources || [],
      topic: scrapedData.topic,
    }
  } catch (error) {
    console.error("Enhanced Gemini - API Error:", error)

    // Return appropriate fallback based on error type
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      return generateErrorFallback(question, "authentication")
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      return generateErrorFallback(question, "quota")
    } else {
      return generateErrorFallback(question, "general")
    }
  }
}

function generateGeneralGuidanceResponse(question: string): {
  answer: string
  images: string[]
  sources: string[]
} {
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
• **About College** - Institution overview, facilities

### 💡 **For your specific query:**
• Try rephrasing with specific keywords (e.g., "faculty", "placements", "fees")
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
  }
}

function generateErrorFallback(
  question: string,
  errorType: string,
): {
  answer: string
  images: string[]
  sources: string[]
} {
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
• Contact information

**I apologize for the inconvenience and will be back to help you soon!** 🎓`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
  }
}
