import { GoogleGenerativeAI } from "@google/generative-ai"
import { getTopicUrls, matchQueryToTopic } from "./query-router"
import { robustScrapeUrl, formatRobustScrapedData, extractCompaniesFromScrapedData } from "./robust-scraper"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface DebugLiveResponse {
  answer: string
  images: string[]
  sources: string[]
  topic?: string
  urlsScraped?: number
  scrapingSuccess?: boolean
  debugInfo?: {
    tablesFound: number
    listsFound: number
    linksFound: number
    companiesExtracted: number
    scrapingErrors: string[]
  }
  scrapingTimestamp?: Date
}

export async function generateDebugLiveResponse(question: string): Promise<DebugLiveResponse> {
  console.log(`🚀 DEBUG LIVE SCRAPER - Processing question: "${question}"`)

  try {
    // Step 1: Identify topic
    const topic = matchQueryToTopic(question)
    console.log(`🎯 DEBUG LIVE SCRAPER - Matched topic: ${topic || "NONE"}`)

    if (!topic) {
      console.log("❌ DEBUG LIVE SCRAPER - No topic matched")
      return generateNoTopicDebugResponse(question)
    }

    // Step 2: Get mapped URLs
    const urls = await getTopicUrls(topic)
    console.log(`🗺️ DEBUG LIVE SCRAPER - Found ${urls.length} mapped URLs for ${topic}:`)
    urls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`)
    })

    if (urls.length === 0) {
      console.log("❌ DEBUG LIVE SCRAPER - No URLs mapped for topic")
      return generateNoUrlsDebugResponse(question, topic)
    }

    // Step 3: Scrape all URLs with robust scraper
    console.log(`🔍 DEBUG LIVE SCRAPER - Starting robust scraping of ${urls.length} URLs...`)
    const scrapePromises = urls.map((url) => robustScrapeUrl(url, topic))
    const results = await Promise.allSettled(scrapePromises)

    const scrapedData = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
      .map((result) => result.value)

    const successfulScrapes = scrapedData.filter((data) => data.success)
    const failedScrapes = scrapedData.filter((data) => !data.success)

    console.log(`📊 DEBUG LIVE SCRAPER - Scraping results:`)
    console.log(`   ✅ Successful: ${successfulScrapes.length}`)
    console.log(`   ❌ Failed: ${failedScrapes.length}`)

    // Log detailed results
    successfulScrapes.forEach((data, index) => {
      console.log(`✅ SUCCESS ${index + 1}: ${data.url}`)
      console.log(`   📋 Tables: ${data.tables.length}`)
      console.log(`   📝 Lists: ${data.lists.length}`)
      console.log(`   🔗 Links: ${data.links.length}`)
      console.log(`   📄 Paragraphs: ${data.paragraphs.length}`)
    })

    failedScrapes.forEach((data, index) => {
      console.log(`❌ FAILED ${index + 1}: ${data.url}`)
      console.log(`   Error: ${data.errorMessage}`)
    })

    if (successfulScrapes.length === 0) {
      console.log("❌ DEBUG LIVE SCRAPER - No successful scrapes")
      return generateScrapingFailedDebugResponse(question, topic, urls, failedScrapes)
    }

    // Step 4: Format scraped content
    const formattedContent = formatRobustScrapedData(successfulScrapes)
    console.log(`📝 DEBUG LIVE SCRAPER - Formatted content length: ${formattedContent.length} characters`)

    // Step 5: Extract specific data based on topic
    let extractedCompanies: string[] = []
    if (topic === "placements") {
      extractedCompanies = extractCompaniesFromScrapedData(successfulScrapes)
      console.log(`🏢 DEBUG LIVE SCRAPER - Extracted ${extractedCompanies.length} companies:`)
      extractedCompanies.slice(0, 10).forEach((company, index) => {
        console.log(`   ${index + 1}. ${company}`)
      })
    }

    // Step 6: Generate AI response
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are CollegeGPT, the AI assistant for CMR Technical Campus. You have just received LIVE, REAL-TIME data scraped from the official college website.

CRITICAL INSTRUCTIONS:
- You MUST use ONLY the live scraped data provided below
- This is CURRENT, REAL-TIME information from the official website
- Present the information in a conversational, natural way
- DO NOT use generic responses or templates
- DO NOT redirect users to visit websites - give them the actual information
- Include specific details from the scraped data
- Be enthusiastic and helpful - you have the actual current information!

RESPONSE STYLE:
- Start with confidence: "Here's the current information..." or "Based on the latest data from the website..."
- Present data clearly and completely
- Include all relevant details from the scraped data
- Use a conversational, friendly tone
- Make it clear this is current, live information

TOPIC: ${topic}
LIVE DATA AVAILABLE: Yes - scraped from ${successfulScrapes.length} official pages
SCRAPING TIME: ${new Date().toLocaleString()}

${topic === "placements" && extractedCompanies.length > 0 ? `COMPANIES EXTRACTED: ${extractedCompanies.length} companies found` : ""}`,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    const prompt = `
User Question: "${question}"

LIVE SCRAPED DATA FROM CMR TECHNICAL CAMPUS OFFICIAL WEBSITE:
${formattedContent}

${extractedCompanies.length > 0 ? `\nEXTRACTED COMPANIES:\n${extractedCompanies.map((company, index) => `${index + 1}. ${company}`).join("\n")}` : ""}

Sources: ${successfulScrapes.map((data) => data.url).join(", ")}
Scraped at: ${new Date().toLocaleString()}

Please provide a comprehensive, conversational response using this live data. Present the actual information from the scraped content - don't redirect the user to visit websites since you have the current information right here. Be specific and include the details from the scraped data.

${topic === "placements" ? "Focus on presenting the companies and their details clearly. If salary information is available, include it." : ""}

Make your response sound natural and helpful, like you're sharing the latest information you just found.
`

    console.log(`🤖 DEBUG LIVE SCRAPER - Sending to Gemini API...`)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log(`✅ DEBUG LIVE SCRAPER - Generated response, length: ${text.length} characters`)

    // Prepare debug info
    const debugInfo = {
      tablesFound: successfulScrapes.reduce((sum, data) => sum + data.tables.length, 0),
      listsFound: successfulScrapes.reduce((sum, data) => sum + data.lists.length, 0),
      linksFound: successfulScrapes.reduce((sum, data) => sum + data.links.length, 0),
      companiesExtracted: extractedCompanies.length,
      scrapingErrors: failedScrapes.map((data) => `${data.url}: ${data.errorMessage}`),
    }

    return {
      answer: text.trim(),
      images: [],
      sources: successfulScrapes.map((data) => data.url),
      topic: topic,
      urlsScraped: successfulScrapes.length,
      scrapingSuccess: true,
      debugInfo: debugInfo,
      scrapingTimestamp: new Date(),
    }
  } catch (error) {
    console.error("❌ DEBUG LIVE SCRAPER - Error:", error)
    return generateErrorDebugResponse(question, error.message)
  }
}

function generateNoTopicDebugResponse(question: string): DebugLiveResponse {
  return {
    answer: `I understand you're asking about "${question}". 

To give you the most accurate and current information, could you please be more specific? I can help with:

• **Placements** - Companies, statistics, internships
• **Question Banks** - Previous papers, downloads
• **Results** - Exam results and announcements  
• **Notifications** - Circulars and notices
• **Faculty** - Department faculty information
• **Fees** - Fee structure and payments

Try asking something like "Which companies visited for placements?" or "Show me CSE question banks" for more targeted results.`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    scrapingSuccess: false,
    debugInfo: {
      tablesFound: 0,
      listsFound: 0,
      linksFound: 0,
      companiesExtracted: 0,
      scrapingErrors: ["No topic matched from question"],
    },
  }
}

function generateNoUrlsDebugResponse(question: string, topic: string): DebugLiveResponse {
  return {
    answer: `I understand you're asking about ${topic} - "${question}".

Unfortunately, I don't have specific URLs configured for this topic yet in my database. This means I can't scrape the most current information from the official website.

**Debug Info:**
- Topic identified: ${topic}
- URLs mapped: 0
- Scraping attempted: No

**What you can do:**
• Visit the official website: https://cmrtc.ac.in/
• Contact the college directly for current ${topic} information
• Try rephrasing your question with different keywords

I'm continuously being updated with more specific information sources!`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    topic: topic,
    scrapingSuccess: false,
    debugInfo: {
      tablesFound: 0,
      listsFound: 0,
      linksFound: 0,
      companiesExtracted: 0,
      scrapingErrors: [`No URLs mapped for topic: ${topic}`],
    },
  }
}

function generateScrapingFailedDebugResponse(
  question: string,
  topic: string,
  urls: string[],
  failedScrapes: any[],
): DebugLiveResponse {
  return {
    answer: `I attempted to get the latest ${topic} information for your question "${question}", but encountered issues scraping the official pages.

**Debug Information:**
- Topic: ${topic}
- URLs attempted: ${urls.length}
- Successful scrapes: 0
- Failed scrapes: ${failedScrapes.length}

**Scraping Errors:**
${failedScrapes.map((data, index) => `${index + 1}. ${data.url}\n   Error: ${data.errorMessage}`).join("\n")}

**URLs Attempted:**
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
    scrapingSuccess: false,
    debugInfo: {
      tablesFound: 0,
      listsFound: 0,
      linksFound: 0,
      companiesExtracted: 0,
      scrapingErrors: failedScrapes.map((data) => `${data.url}: ${data.errorMessage}`),
    },
  }
}

function generateErrorDebugResponse(question: string, errorMessage: string): DebugLiveResponse {
  return {
    answer: `I encountered a technical issue while trying to get current information for "${question}".

**Error details:** ${errorMessage.includes("quota") ? "API usage limit reached" : "Technical connectivity issue"}

**Debug Info:**
- Scraping attempted: Yes
- Error type: ${errorMessage.includes("quota") ? "API Quota" : "Technical Error"}
- Full error: ${errorMessage}

**What you can do:**
• Try asking again in a few moments
• Visit https://cmrtc.ac.in/ directly
• Contact the college for immediate assistance
• Rephrase your question

I apologize for the inconvenience - I'll be back to help you with live information soon!`,
    images: [],
    sources: ["https://cmrtc.ac.in/"],
    scrapingSuccess: false,
    debugInfo: {
      tablesFound: 0,
      listsFound: 0,
      linksFound: 0,
      companiesExtracted: 0,
      scrapingErrors: [errorMessage],
    },
  }
}
