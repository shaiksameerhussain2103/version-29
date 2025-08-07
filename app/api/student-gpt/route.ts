import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, addDoc, query, getDocs, orderBy, limit } from "firebase/firestore"
import { scrapeCollegeData } from "@/lib/scraper"
import { generateGeminiResponse } from "@/lib/gemini"
import { generateEnhancedGeminiResponse } from "@/lib/enhanced-gemini"
import { generateQueryRoutedResponse } from "@/lib/enhanced-query-gemini"
import { generateLiveScrapingResponse } from "@/lib/live-scraping-gemini"
import { generateDebugLiveResponse } from "@/lib/debug-live-scraper"
import { normalizeQuery, calculateSimilarity } from "@/lib/nlp-utils"

export async function POST(request: NextRequest) {
  // Ensure JSON response headers are always set
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
  }

  try {
    console.log("🚀 STUDENT GPT API - Request received")

    // Parse request body safely
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("❌ STUDENT GPT API - JSON Parse Error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format - JSON parsing failed",
          answer: "❌ **Request Error**\n\nThere was an issue with your request format. Please try again.",
          images: [],
          sources: [],
        },
        { status: 400, headers },
      )
    }

    const { question } = requestBody

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Question is required and must be a string",
          answer: "❌ **Missing Question**\n\nPlease provide a question about CMR Technical Campus.",
          images: [],
          sources: [],
        },
        { status: 400, headers },
      )
    }

    const trimmedQuestion = question.trim()
    if (trimmedQuestion.length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Question too short",
          answer: "❌ **Question Too Short**\n\nPlease provide a more detailed question (at least 3 characters).",
          images: [],
          sources: [],
        },
        { status: 400, headers },
      )
    }

    console.log(`🎯 STUDENT GPT API - Processing question: "${trimmedQuestion}"`)

    // Step 1: Normalize the query for similarity matching
    let normalizedQuery
    try {
      normalizedQuery = normalizeQuery(trimmedQuestion)
      console.log(`🔄 STUDENT GPT API - Normalized query: "${normalizedQuery}"`)
    } catch (normalizeError) {
      console.error("❌ STUDENT GPT API - Normalization Error:", normalizeError)
      normalizedQuery = trimmedQuestion.toLowerCase().trim()
    }

    // Step 2: Check for similar cached responses (but prioritize fresh data for critical topics)
    let bestMatch = null
    let highestSimilarity = 0

    try {
      const queriesRef = collection(db, "student_queries")
      const recentQueries = query(queriesRef, orderBy("createdAt", "desc"), limit(30))
      const querySnapshot = await getDocs(recentQueries)

      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data()
          if (data.normalizedQuestion) {
            const similarity = calculateSimilarity(normalizedQuery, data.normalizedQuestion)

            // Only use cache for very high similarity and very recent queries (within 30 minutes)
            const queryAge = new Date().getTime() - new Date(data.createdAt).getTime()
            const thirtyMinutes = 30 * 60 * 1000

            if (similarity > highestSimilarity && similarity >= 0.95 && queryAge < thirtyMinutes) {
              highestSimilarity = similarity
              bestMatch = data
            }
          }
        } catch (similarityError) {
          console.error("❌ STUDENT GPT API - Similarity calculation error:", similarityError)
        }
      })

      // Only use cache for non-critical topics and very recent, very similar queries
      if (
        bestMatch &&
        !trimmedQuestion.toLowerCase().includes("companies") &&
        !trimmedQuestion.toLowerCase().includes("placement") &&
        !trimmedQuestion.toLowerCase().includes("question bank") &&
        !trimmedQuestion.toLowerCase().includes("result")
      ) {
        console.log(`💾 STUDENT GPT API - Using cached response with similarity: ${highestSimilarity}`)
        return NextResponse.json(
          {
            success: true,
            answer: bestMatch.answerHTML || "I found a similar question but the answer seems to be missing.",
            images: bestMatch.imageUrls || [],
            sources: bestMatch.sourceUrls || ["https://cmrtc.ac.in/"],
            cached: true,
          },
          { headers },
        )
      }
    } catch (cacheError) {
      console.error("❌ STUDENT GPT API - Cache lookup error:", cacheError)
      // Continue with fresh generation if cache fails
    }

    // Step 3: Try DEBUG LIVE SCRAPING first (NEW PRIMARY METHOD WITH FULL DEBUGGING)
    console.log("🔍 STUDENT GPT API - Attempting DEBUG live scraping with robust parser...")

    let debugLiveResponse
    try {
      debugLiveResponse = await generateDebugLiveResponse(trimmedQuestion)

      if (debugLiveResponse && debugLiveResponse.answer) {
        console.log("✅ STUDENT GPT API - Debug live scraping response generated")
        console.log(`📊 STUDENT GPT API - Debug info:`, debugLiveResponse.debugInfo)

        // Cache the debug live response
        try {
          const queryData = {
            rawQuestion: trimmedQuestion,
            normalizedQuestion: normalizedQuery,
            answerHTML: debugLiveResponse.answer,
            sourceUrls: debugLiveResponse.sources,
            imageUrls: debugLiveResponse.images,
            topic: debugLiveResponse.topic || "general",
            urlsScraped: debugLiveResponse.urlsScraped || 0,
            createdAt: new Date().toISOString(),
            similarityHash: normalizedQuery.split(" ").sort().join(" "),
            isDebugLiveScraped: true,
            scrapingSuccess: debugLiveResponse.scrapingSuccess,
            debugInfo: debugLiveResponse.debugInfo,
            scrapingTimestamp: debugLiveResponse.scrapingTimestamp?.toISOString(),
          }

          await addDoc(collection(db, "student_queries"), queryData)
          console.log("💾 STUDENT GPT API - Debug live response cached successfully")
        } catch (cacheError) {
          console.error("❌ STUDENT GPT API - Failed to cache debug live response:", cacheError)
        }

        return NextResponse.json(
          {
            success: true,
            answer: debugLiveResponse.answer,
            images: debugLiveResponse.images || [],
            sources: debugLiveResponse.sources || [],
            topic: debugLiveResponse.topic,
            urlsScraped: debugLiveResponse.urlsScraped,
            cached: false,
            debugLiveScraped: true,
            scrapingSuccess: debugLiveResponse.scrapingSuccess,
            debugInfo: debugLiveResponse.debugInfo,
            scrapingTimestamp: debugLiveResponse.scrapingTimestamp,
          },
          { headers },
        )
      }
    } catch (debugLiveError) {
      console.error("❌ STUDENT GPT API - Debug live scraping failed:", debugLiveError)
      // Continue to fallback methods
    }

    // Step 4: Try original live scraping (FALLBACK)
    console.log("🔄 STUDENT GPT API - Attempting original live scraping...")

    let liveResponse
    try {
      liveResponse = await generateLiveScrapingResponse(trimmedQuestion)

      if (liveResponse && liveResponse.answer && liveResponse.liveDataFound) {
        console.log("✅ STUDENT GPT API - Original live scraping response generated successfully")

        // Cache the live response
        try {
          const queryData = {
            rawQuestion: trimmedQuestion,
            normalizedQuestion: normalizedQuery,
            answerHTML: liveResponse.answer,
            sourceUrls: liveResponse.sources,
            imageUrls: liveResponse.images,
            topic: liveResponse.topic || "general",
            urlsScraped: liveResponse.urlsScraped || 0,
            createdAt: new Date().toISOString(),
            similarityHash: normalizedQuery.split(" ").sort().join(" "),
            isLiveScraped: true,
            scrapingTimestamp: liveResponse.scrapingTimestamp?.toISOString(),
          }

          await addDoc(collection(db, "student_queries"), queryData)
          console.log("💾 STUDENT GPT API - Live response cached successfully")
        } catch (cacheError) {
          console.error("❌ STUDENT GPT API - Failed to cache live response:", cacheError)
        }

        return NextResponse.json(
          {
            success: true,
            answer: liveResponse.answer,
            images: liveResponse.images || [],
            sources: liveResponse.sources || [],
            topic: liveResponse.topic,
            urlsScraped: liveResponse.urlsScraped,
            cached: false,
            liveScraped: true,
            scrapingTimestamp: liveResponse.scrapingTimestamp,
          },
          { headers },
        )
      } else if (liveResponse && liveResponse.answer) {
        // Even if no live data found, return the response (it might be a helpful guidance response)
        console.log("ℹ️ STUDENT GPT API - Live scraping returned guidance response")
        return NextResponse.json(
          {
            success: true,
            answer: liveResponse.answer,
            images: liveResponse.images || [],
            sources: liveResponse.sources || [],
            topic: liveResponse.topic,
            cached: false,
            liveScraped: false,
          },
          { headers },
        )
      }
    } catch (liveScrapingError) {
      console.error("❌ STUDENT GPT API - Live scraping failed:", liveScrapingError)
      // Continue to fallback methods
    }

    // Step 5: Try query-routed scraping (EXISTING FALLBACK)
    console.log("🔄 STUDENT GPT API - Attempting query-routed scraping...")

    let queryRoutedResponse
    try {
      queryRoutedResponse = await generateQueryRoutedResponse(trimmedQuestion)

      if (queryRoutedResponse && queryRoutedResponse.answer && queryRoutedResponse.isRouted) {
        console.log("✅ STUDENT GPT API - Query-routed response generated successfully")

        return NextResponse.json(
          {
            success: true,
            answer: queryRoutedResponse.answer,
            images: queryRoutedResponse.images || [],
            sources: queryRoutedResponse.sources || [],
            topic: queryRoutedResponse.topic,
            urlsScraped: queryRoutedResponse.urlsScraped,
            cached: false,
            queryRouted: true,
          },
          { headers },
        )
      }
    } catch (queryRoutedError) {
      console.error("❌ STUDENT GPT API - Query-routed scraping failed:", queryRoutedError)
    }

    // Step 6: Try enhanced targeted scraping (EXISTING FALLBACK)
    console.log("🔄 STUDENT GPT API - Attempting enhanced targeted scraping...")

    let enhancedResponse
    try {
      enhancedResponse = await generateEnhancedGeminiResponse(trimmedQuestion)

      if (enhancedResponse && enhancedResponse.answer) {
        console.log("✅ STUDENT GPT API - Enhanced response generated successfully")

        return NextResponse.json(
          {
            success: true,
            answer: enhancedResponse.answer,
            images: enhancedResponse.images || [],
            sources: enhancedResponse.sources || [],
            topic: enhancedResponse.topic,
            cached: false,
            enhanced: true,
          },
          { headers },
        )
      }
    } catch (enhancedError) {
      console.error("❌ STUDENT GPT API - Enhanced scraping failed:", enhancedError)
    }

    // Step 7: Fallback to original scraping method (LAST RESORT)
    console.log("🔄 STUDENT GPT API - Falling back to original scraping method...")

    let scrapedData
    try {
      scrapedData = await scrapeCollegeData()
      console.log("✅ STUDENT GPT API - Scraped data from", scrapedData.sources.length, "sources")
    } catch (scrapeError) {
      console.error("❌ STUDENT GPT API - Scraping error:", scrapeError)
      scrapedData = {
        content:
          "CMR Technical Campus is a premier engineering institution. For detailed information, visit https://cmrtc.ac.in/",
        images: [],
        sources: ["https://cmrtc.ac.in/"],
      }
    }

    let geminiResponse
    try {
      geminiResponse = await generateGeminiResponse(trimmedQuestion, scrapedData)
      console.log("✅ STUDENT GPT API - Generated Gemini response successfully")
    } catch (geminiError) {
      console.error("❌ STUDENT GPT API - Gemini error:", geminiError)

      return NextResponse.json(
        {
          success: true,
          answer: `I apologize, but I'm having trouble processing your question about "${trimmedQuestion}" right now.

**What you can try:**
• Rephrase your question in simpler terms
• Ask about specific topics like admissions, courses, or facilities
• Wait a moment and try again

**For immediate assistance:**
• Visit: https://cmrtc.ac.in/
• Contact the college directly
• Check the official website for updates

I'll be back to help you soon! 🎓`,
          images: [],
          sources: ["https://cmrtc.ac.in/"],
          cached: false,
        },
        { headers },
      )
    }

    return NextResponse.json(
      {
        success: true,
        answer: geminiResponse.answer,
        images: scrapedData.images || [],
        sources: scrapedData.sources || [],
        cached: false,
        enhanced: false,
      },
      { headers },
    )
  } catch (error) {
    console.error("❌ STUDENT GPT API - Unexpected Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Internal server error: ${error.message || "Unknown error"}`,
        answer: `❌ **Service Temporarily Unavailable**

I'm experiencing technical difficulties right now. This could be due to:

• High server load
• Network connectivity issues  
• Temporary service maintenance

**What you can do:**
• Try again in a few moments
• Rephrase your question
• Visit the official website: https://cmrtc.ac.in/

**For urgent queries:**
• Contact CMR Technical Campus directly
• Check the official website for contact information

I apologize for the inconvenience and will be back online soon! 🔧`,
        images: [],
        sources: ["https://cmrtc.ac.in/"],
        debug: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500, headers },
    )
  }
}
