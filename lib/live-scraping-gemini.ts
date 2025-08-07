import { GoogleGenerativeAI } from "@google/generative-ai"
import { getTopicUrls, matchQueryToTopic } from "./query-router"
import { extractDynamicContent, formatDynamicContent } from "./dynamic-content-extractor"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface LiveScrapingResponse {
  answer: string
  images: string[]
  sources: string[]
  topic?: string
  urlsScraped?: number
  liveDataFound?: boolean
  scrapingTimestamp?: Date
}

export async function generateLiveScrapingResponse(question: string): Promise<LiveScrapingResponse> {
  try {
    console.log("Live Scraping - Processing question:", question)

    // Identify topic from question
    const topic = matchQueryToTopic(question)

    if (!topic) {
      console.log("Live Scraping - No topic matched")
      return generateNoTopicResponse(question)
    }

    console.log(`Live Scraping - Matched topic: ${topic}`)

    // Get mapped URLs for this topic
    const urls = await getTopicUrls(topic)

    if (urls.length === 0) {
      console.log(`Live Scraping - No URLs mapped for topic: ${topic}`)
      return generateNoUrlsResponse(question, topic)
    }

    console.log(`Live Scraping - Found ${urls.length} mapped URLs for ${topic}`)

    // Scrape all mapped URLs dynamically
    const scrapePromises = urls.map((url) => extractDynamicContent(url, topic))
    const results = await Promise.allSettled(scrapePromises)

    const successfulScrapes = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((data) => data.success)

    if (successfulScrapes.length === 0) {
      console.log(`Live Scraping - No successful scrapes for topic: ${topic}`)
      return generateScrapingFailedResponse(question, topic, urls)
    }

    console.log(`Live Scraping - Successfully scraped ${successfulScrapes.length} URLs`)

    // Format the live scraped content
    const liveContent = formatDynamicContent(successfulScrapes)
    const sources = successfulScrapes.map((data) => data.url)

    // Check if we have meaningful live data
    const hasLiveData = successfulScrapes.some((data) => data.extractedContent.length > 0)

    if (!hasLiveData) {
      console.log(`Live Scraping - No meaningful live data extracted`)
      return generateNoDataResponse(question, topic, sources)
    }

    // Generate response using live scraped data
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are CollegeGPT, the AI assistant for CMR Technical Campus. You have just received LIVE, REAL-TIME data scraped from the official college website.

CRITICAL INSTRUCTIONS:
- You MUST use ONLY the live scraped data provided below
- This is CURRENT, REAL-TIME information from the official website
- Present the information in a conversational, dynamic way
- DO NOT use generic responses or templates
- DO NOT redirect users to visit websites - give them the actual information
- Format responses naturally like a helpful assistant who has the latest information
- Include specific details from the scraped data
- Be enthusiastic and helpful - you have the actual current information!

RESPONSE STYLE:
- Start with confidence: "Here's the current information..." or "Based on the latest data from the website..."
- Present lists clearly and completely
- Include all relevant details from the scraped data
- End with helpful context or next steps
- Use a conversational, friendly tone
- Make it clear this is current, live information

TOPIC: ${topic}
LIVE DATA AVAILABLE: Yes - scraped from ${successfulScrapes.length} official pages
SCRAPING TIME: ${new Date().toLocaleString()}`,
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const prompt = `
User Question: "${question}"

LIVE SCRAPED DATA FROM CMR TECHNICAL CAMPUS OFFICIAL WEBSITE:
${liveContent}

Sources: ${sources.join(", ")}
Scraped at: ${new Date().toLocaleString()}

Please provide a comprehensive, conversational response using this live data. Present the actual information from the scraped content - don't redirect the user to visit websites since you have the current information right here. Be specific and include the details from the scraped data.

Make your response sound natural and helpful, like you're sharing the latest information you just found.
`

    console.log("Live Scraping - Sending live data to Gemini...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Live Scraping - Generated response from live data, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    return {
      answer: text.trim(),
      images: [],
      sources: sources,
      topic: topic,
      urlsScraped: successfulScrapes.length,
      liveDataFound: true,
      scrapingTimestamp: new Date(),
    }
  } catch (error) {
    console.error("Live Scraping - Error:", error)
    return generateErrorResponse(question, error.message)
  }
}

function generateNoTopicResponse(question: string): LiveScrapingResponse {
  return {
    answer: `I understand you're asking about "${question}". 

To give you the most accurate and current information, could you please be more specific about what you're looking for? I can help with:

• **Placements** - Companies, statistics, internships
• **Question Banks** - Previous papers, downloads
• **Results** - Exam results and announcements  
• **Notifications** - Circulars and notices
• **Faculty** - Department faculty information
• **Fees** - Fee structure and payments

Try asking something like "Which companies visited for placements?" or "Show me CSE question banks" for more targeted results.`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    liveDataFound: false,
  }
}

function generateNoUrlsResponse(question: string, topic: string): LiveScrapingResponse {
  return {
    answer: `I understand you're asking about ${topic} - "${question}".

Unfortunately, I don't have specific URLs configured for this topic yet. This means I can't provide you with the most current information from the official website.

**What you can do:**
• Visit the official website: https://cmrtc.ac.in/
• Contact the college directly for current ${topic} information
• Try rephrasing your question with different keywords

I'm continuously being updated with more specific information sources, so please try again later!`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    topic: topic,
    liveDataFound: false,
  }
}

function generateScrapingFailedResponse(question: string, topic: string, urls: string[]): LiveScrapingResponse {
  return {
    answer: `I tried to get the latest ${topic} information for your question "${question}", but I'm having trouble accessing the official pages right now.

**I attempted to check:**
${urls.map((url, index) => `${index + 1}. ${url}`).join("\n")}

**What you can try:**
• Visit these pages directly for the most current information
• Contact the college for immediate assistance
• Try asking again in a few minutes

The information might be temporarily unavailable due to website maintenance or connectivity issues.`,
    images: [],
    sources: urls,
    topic: topic,
    urlsScraped: 0,
    liveDataFound: false,
  }
}

function generateNoDataResponse(question: string, topic: string, sources: string[]): LiveScrapingResponse {
  return {
    answer: `I successfully accessed the official ${topic} pages for your question "${question}", but I couldn't extract specific structured information from them at this time.

**Pages checked:**
${sources.map((url, index) => `${index + 1}. ${url.replace("https://cmrtc.ac.in", "")}`).join("\n")}

This could mean:
• The pages are being updated with new information
• The content structure has changed recently
• The information might be in a format I can't currently process

**For immediate assistance:**
• Visit the pages above directly
• Contact the relevant department
• Try asking your question in a different way

I'm continuously improving my ability to extract information from these pages!`,
    images: [],
    sources: sources,
    topic: topic,
    liveDataFound: false,
  }
}

function generateErrorResponse(question: string, errorMessage: string): LiveScrapingResponse {
  return {
    answer: `I encountered a technical issue while trying to get current information for "${question}".

**Error details:** ${errorMessage.includes("quota") ? "API usage limit reached" : "Technical connectivity issue"}

**What you can do:**
• Try asking again in a few moments
• Visit https://cmrtc.ac.in/ directly
• Contact the college for immediate assistance
• Rephrase your question

I apologize for the inconvenience - I'll be back to help you with live information soon!`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    liveDataFound: false,
  }
}
