import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import axios from "axios"
import * as cheerio from "cheerio"

// Static fallback mapping in case Firestore is unavailable
const STATIC_URL_MAPPING = {
  faculty: [
    "https://cmrtc.ac.in/departments/department-of-computer-science-engineering/faculty/",
    "https://cmrtc.ac.in/departments/department-of-computer-science-engineering-data-science/faculty-ds/",
    "https://cmrtc.ac.in/departments/department-of-mechanical-engineering/faculty/",
  ],
  director: ["https://cmrtc.ac.in/administration/director/"],
  placements: [
    "https://cmrtc.ac.in/t-p-cell/about-t-p-cell/",
    "https://cmrtc.ac.in/t-p-cell/training-placement-team/",
    "https://cmrtc.ac.in/t-p-cell/companies-visited/",
    "https://cmrtc.ac.in/t-p-cell/students-placed/",
    "https://cmrtc.ac.in/t-p-cell/alumni/",
    "https://cmrtc.ac.in/t-p-cell/internships/",
  ],
  syllabus: ["https://cmrtc.ac.in/academics/courses-offered/"],
  fees: ["https://cmrtc.ac.in/academics/fee-structure/"],
  question_bank: ["https://cmrtc.ac.in/exam-section/question-banks/"],
  results: ["https://cmrtc.ac.in/exam-section/results/"],
  exam_schedules: ["https://cmrtc.ac.in/exam-section/schedules/"],
  notifications: ["https://cmrtc.ac.in/exam-section/circular-notification/"],
  evaluation: ["https://cmrtc.ac.in/exam-section/evaluation-process/"],
  malpractice: ["https://cmrtc.ac.in/exam-section/malpracties-rules/"],
  coe: ["https://cmrtc.ac.in/exam-section/controller-of-examination/"],
  contact: ["https://cmrtc.ac.in/contact/"],
}

// Keyword mapping for topic detection
const TOPIC_KEYWORDS = {
  faculty: ["faculty", "professor", "dean", "teaching", "teacher", "staff", "instructor"],
  director: ["director", "director cmr", "head", "principal"],
  placements: [
    "placement",
    "company",
    "internship",
    "tp cell",
    "t&p cell",
    "training",
    "alumni",
    "job",
    "career",
    "recruitment",
  ],
  syllabus: ["course", "syllabus", "program", "department", "curriculum", "branch"],
  fees: ["fees", "fee structure", "payment", "cost", "tuition", "charges"],
  question_bank: ["question paper", "question bank", "previous paper", "past paper", "exam paper"],
  results: ["result", "marks", "grades", "score", "examination result"],
  exam_schedules: ["exam schedule", "exam date", "examination schedule", "exam time"],
  notifications: ["notification", "circular", "announcement", "notice"],
  evaluation: ["evaluation", "grading", "assessment", "marking"],
  malpractice: ["malpractice", "rules", "misconduct", "unfair means"],
  coe: ["controller of examination", "coe", "exam controller"],
  contact: ["contact", "address", "email", "phone", "reach", "location"],
}

interface RoutedScrapedData {
  content: string
  images: string[]
  sources: string[]
  topic: string
  urlsScraped: number
  success: boolean
}

export function matchQueryToTopic(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim()

  console.log("Query Router - Analyzing query:", normalizedQuery)

  // Check each topic for keyword matches
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const hasMatch = keywords.some((keyword) => normalizedQuery.includes(keyword.toLowerCase()))

    if (hasMatch) {
      console.log(`Query Router - Matched topic: ${topic}`)
      return topic
    }
  }

  console.log("Query Router - No specific topic matched")
  return null
}

export async function getTopicUrls(topic: string): Promise<string[]> {
  try {
    console.log(`Query Router - Fetching URLs for topic: ${topic}`)

    // Try to get URLs from Firestore first
    const mappingDoc = await getDoc(doc(db, "scraper_mappings", "topic_urls"))

    if (mappingDoc.exists()) {
      const data = mappingDoc.data()
      const urls = data[topic]

      if (urls && Array.isArray(urls) && urls.length > 0) {
        console.log(`Query Router - Found ${urls.length} URLs in Firestore for ${topic}`)
        return urls
      }
    }

    console.log(`Query Router - Firestore data not available, using static mapping for ${topic}`)
  } catch (firestoreError) {
    console.error("Query Router - Firestore error:", firestoreError)
  }

  // Fallback to static mapping
  const staticUrls = STATIC_URL_MAPPING[topic] || []
  console.log(`Query Router - Using ${staticUrls.length} static URLs for ${topic}`)
  return staticUrls
}

export async function scrapeTopicUrls(topic: string, urls: string[]): Promise<RoutedScrapedData> {
  console.log(`Query Router - Starting scraping for topic: ${topic} with ${urls.length} URLs`)

  const scrapedData: RoutedScrapedData = {
    content: "",
    images: [],
    sources: [],
    topic: topic,
    urlsScraped: 0,
    success: false,
  }

  const scrapePromises = urls.map(async (url, index) => {
    try {
      console.log(`Query Router - Scraping URL ${index + 1}/${urls.length}: ${url}`)

      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
        },
      })

      console.log(`Query Router - Successfully fetched: ${url} (${response.status})`)

      const $ = cheerio.load(response.data)

      // Remove unwanted elements
      $(
        "script, style, noscript, nav, footer, .menu, .navigation, header, .header, .sidebar, .ads, .advertisement",
      ).remove()

      // Extract main content text
      let textContent = ""
      const contentSelectors = [
        "main",
        ".main-content",
        ".content",
        ".page-content",
        ".entry-content",
        ".post-content",
        "article",
        ".article",
        "body",
      ]

      for (const selector of contentSelectors) {
        const element = $(selector).first()
        if (element.length > 0) {
          textContent = element.text()
          break
        }
      }

      // Clean up the text content
      textContent = textContent.replace(/\s+/g, " ").replace(/\n+/g, " ").replace(/\t+/g, " ").trim()

      // Extract images with proper URL resolution
      const images: string[] = []
      $("img").each((_, element) => {
        const src = $(element).attr("src")
        const dataSrc = $(element).attr("data-src")
        const actualSrc = src || dataSrc

        if (actualSrc) {
          try {
            let fullUrl: string
            if (actualSrc.startsWith("http")) {
              fullUrl = actualSrc
            } else if (actualSrc.startsWith("//")) {
              fullUrl = "https:" + actualSrc
            } else {
              fullUrl = new URL(actualSrc, url).href
            }

            // Only include actual image files
            if (fullUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
              images.push(fullUrl)
            }
          } catch (urlError) {
            console.error(`Query Router - Invalid image URL: ${actualSrc} from ${url}`)
          }
        }
      })

      console.log(`Query Router - Extracted ${textContent.length} characters and ${images.length} images from ${url}`)

      return {
        url,
        content: textContent.substring(0, 2000), // Limit content per URL
        images: images.slice(0, 3), // Limit images per URL
        success: textContent.length > 50, // Consider successful if we got meaningful content
      }
    } catch (error) {
      console.error(`Query Router - Failed to scrape ${url}:`, error.message)
      return {
        url,
        content: "",
        images: [],
        success: false,
      }
    }
  })

  try {
    // Wait for all scraping operations to complete
    const results = await Promise.allSettled(scrapePromises)

    let successfulScrapes = 0
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.success) {
        const pageData = result.value
        scrapedData.content += `\n\n--- Content from ${pageData.url} ---\n${pageData.content}`
        scrapedData.images.push(...pageData.images)
        scrapedData.sources.push(pageData.url)
        successfulScrapes++
      }
    })

    // Remove duplicate images
    scrapedData.images = [...new Set(scrapedData.images)]
    scrapedData.urlsScraped = successfulScrapes
    scrapedData.success = successfulScrapes > 0

    console.log(
      `Query Router - Completed scraping for ${topic}: ${successfulScrapes}/${urls.length} successful, ${scrapedData.sources.length} sources, ${scrapedData.images.length} unique images`,
    )

    // If no content was scraped successfully, provide topic-specific fallback
    if (!scrapedData.success || !scrapedData.content.trim()) {
      console.log(`Query Router - No content scraped for ${topic}, using fallback data`)
      scrapedData.content = getTopicFallbackContent(topic)
      scrapedData.sources = ["https://cmrtc.ac.in/"]
      scrapedData.success = true // Mark as success since we have fallback content
    }
  } catch (error) {
    console.error(`Query Router - General error during scraping for ${topic}:`, error)
    scrapedData.content = getTopicFallbackContent(topic)
    scrapedData.sources = ["https://cmrtc.ac.in/"]
    scrapedData.success = true
  }

  return scrapedData
}

export async function routeAndScrapeQuery(query: string): Promise<RoutedScrapedData | null> {
  const topic = matchQueryToTopic(query)

  if (!topic) {
    console.log("Query Router - No topic matched, returning null")
    return null
  }

  console.log(`Query Router - Processing query for topic: ${topic}`)

  const urls = await getTopicUrls(topic)

  if (urls.length === 0) {
    console.log(`Query Router - No URLs found for topic: ${topic}`)
    return null
  }

  const scrapedData = await scrapeTopicUrls(topic, urls)
  return scrapedData
}

function getTopicFallbackContent(topic: string): string {
  const fallbackContent = {
    faculty: `CMR Technical Campus Faculty Information

The college has experienced faculty members across various departments including Computer Science Engineering, Electronics and Communication Engineering, Mechanical Engineering, Civil Engineering, and Information Technology.

Faculty members hold advanced degrees and have industry experience. The college emphasizes quality education through qualified teaching staff.

For detailed faculty profiles, contact information, and department-wise faculty lists, please visit the official website or contact the college directly.`,

    director: `CMR Technical Campus Director Information

The college is led by an experienced Director who oversees academic and administrative operations.

The Director's office handles strategic planning, policy implementation, and overall institutional governance.

For specific information about the current Director, their background, and contact details, please visit the official website or contact the college administration.`,

    placements: `CMR Technical Campus Placement Information

The Training and Placement Cell (T&P Cell) facilitates campus recruitment and career development for students.

Services include campus recruitment drives, industry interaction programs, skill development training, interview preparation, and career guidance.

The college maintains relationships with various companies for student placements across different engineering disciplines.`,

    syllabus: `CMR Technical Campus Academic Programs

The college offers undergraduate and postgraduate programs in various engineering disciplines including Computer Science, Electronics, Mechanical, Civil, and Information Technology.

Each program includes comprehensive curriculum, practical training, and industry exposure.

For detailed course information, eligibility criteria, and admission requirements, please visit the official website.`,

    fees: `CMR Technical Campus Fee Information

The college offers various programs with competitive fee structures including tuition fees, laboratory fees, library fees, development fees, and examination fees.

Payment options and scholarship opportunities may be available for eligible students.

For current fee details, payment schedules, and financial assistance information, please visit the official website.`,

    question_bank: `CMR Technical Campus Question Bank

The college provides question banks and previous examination papers to help students prepare for their assessments.

These resources are typically available through the examination section or academic departments.

For access to question banks and previous papers, contact the examination section or visit the official website.`,

    results: `CMR Technical Campus Results

Examination results are published through the official college website and examination section.

Students can access their results using their registration numbers and other required credentials.

For result queries and clarifications, contact the examination section or controller of examinations.`,

    exam_schedules: `CMR Technical Campus Examination Schedules

Examination schedules are published well in advance through the examination section.

Students are advised to regularly check the official website and notice boards for schedule updates.

For examination schedule queries, contact the examination section or controller of examinations.`,

    notifications: `CMR Technical Campus Notifications

Official notifications and circulars are published through the college website and notice boards.

These include academic announcements, examination notices, and administrative updates.

For the latest notifications, regularly check the official website or contact the college administration.`,

    evaluation: `CMR Technical Campus Evaluation Process

The college follows a comprehensive evaluation system including continuous assessment and semester examinations.

The evaluation process is designed to assess student learning outcomes and academic progress.

For evaluation queries and procedures, contact the examination section or academic departments.`,

    malpractice: `CMR Technical Campus Examination Rules

The college has strict rules regarding examination conduct and malpractice prevention.

Students are expected to maintain academic integrity and follow examination guidelines.

For detailed rules and regulations, refer to the student handbook or contact the examination section.`,

    coe: `CMR Technical Campus Controller of Examinations

The Controller of Examinations oversees all examination-related activities including scheduling, conduct, and result processing.

The office handles examination policies, procedures, and student queries related to examinations.

For examination-related matters, contact the Controller of Examinations office.`,

    contact: `CMR Technical Campus Contact Information

The college is located in Hyderabad and can be reached through various communication channels.

For specific contact details including phone numbers, email addresses, and department-wise contacts, please visit the official website.

The college administration is available during working hours for student and parent queries.`,
  }

  return (
    fallbackContent[topic] ||
    `Information about ${topic} is currently unavailable. Please visit https://cmrtc.ac.in/ for the latest updates.`
  )
}
