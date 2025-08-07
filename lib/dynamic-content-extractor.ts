import axios from "axios"
import * as cheerio from "cheerio"

interface ExtractedContent {
  type: "list" | "table" | "links" | "text"
  title?: string
  items: string[]
  metadata?: Record<string, any>
}

interface DynamicScrapedData {
  url: string
  topic: string
  extractedContent: ExtractedContent[]
  rawText: string
  success: boolean
  timestamp: Date
}

// Enhanced selectors for dynamic content extraction
const DYNAMIC_SELECTORS = {
  placements: {
    companies: {
      selectors: [
        // Company lists
        ".companies-visited ul li",
        ".company-list li",
        ".placement-companies .company",
        ".companies-grid .company-item",
        ".company-name",
        "ul li",
        "ol li",
        // Table-based company data
        "table tr td:first-child",
        "table.companies tr td",
        ".company-table tr td",
        // Card-based layouts
        ".company-card h3",
        ".company-card .name",
        ".placement-card .company",
        // Image alt text for logos
        "img[alt*='company']",
        "img[alt*='logo']",
        // Generic content that might contain company names
        "p:contains('Ltd')",
        "p:contains('Technologies')",
        "p:contains('Systems')",
        "div:contains('Pvt')",
      ],
      filters: ["Ltd", "Technologies", "Systems", "Solutions", "Pvt", "Inc", "Corp"],
    },
    students: {
      selectors: [
        ".students-placed .student",
        ".placement-stats .number",
        "table.placement-stats tr",
        ".student-count",
        ".placed-students",
      ],
    },
    statistics: {
      selectors: [".placement-percentage", ".stats-number", ".placement-data", ".success-rate"],
    },
  },
  question_bank: {
    subjects: {
      selectors: [
        "a[href$='.pdf']",
        ".download-link",
        ".pdf-link",
        ".question-paper-link",
        "a:contains('Download')",
        "a:contains('PDF')",
        "table tr td a",
        ".subject-list a",
        ".question-bank-item a",
      ],
    },
    papers: {
      selectors: [".question-paper", ".previous-paper", ".exam-paper", "table.question-papers tr", ".paper-list li"],
    },
  },
  results: {
    announcements: {
      selectors: [
        ".result-announcement",
        ".result-notice",
        ".exam-result",
        "a[href*='result']",
        ".result-link",
        ".announcement",
      ],
    },
  },
  notifications: {
    circulars: {
      selectors: [
        ".circular",
        ".notification",
        ".notice",
        ".announcement",
        "ul.notifications li",
        ".news-item",
        ".circular-item",
        "a[href$='.pdf']",
        ".notice-board li",
      ],
    },
  },
  faculty: {
    profiles: {
      selectors: [
        "table.faculty-table tr",
        ".faculty-profile",
        ".faculty-card",
        ".faculty-member",
        ".staff-profile",
        "table tr",
        ".faculty-list .faculty",
        ".professor-card",
      ],
    },
  },
}

export async function extractDynamicContent(url: string, topic: string): Promise<DynamicScrapedData> {
  console.log(`Dynamic Extractor - Processing ${topic} from: ${url}`)

  const result: DynamicScrapedData = {
    url,
    topic,
    extractedContent: [],
    rawText: "",
    success: false,
    timestamp: new Date(),
  }

  try {
    const response = await axios.get(url, {
      timeout: 12000,
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
        "Cache-Control": "no-cache",
      },
    })

    console.log(`Dynamic Extractor - Successfully fetched ${url} (${response.status})`)

    const $ = cheerio.load(response.data)

    // Remove unwanted elements
    $(
      "script, style, noscript, nav, footer, .menu, .navigation, header, .header, .sidebar, .ads, .advertisement, .social-media",
    ).remove()

    // Extract content based on topic
    const topicConfig = DYNAMIC_SELECTORS[topic]
    if (topicConfig) {
      for (const [contentType, config] of Object.entries(topicConfig)) {
        const extractedItems = extractContentByType($, config.selectors, contentType, topic, url)
        if (extractedItems.length > 0) {
          result.extractedContent.push({
            type: "list",
            title: contentType.charAt(0).toUpperCase() + contentType.slice(1),
            items: extractedItems,
          })
        }
      }
    }

    // If no structured content found, try generic extraction
    if (result.extractedContent.length === 0) {
      const genericContent = extractGenericContent($, topic)
      if (genericContent.length > 0) {
        result.extractedContent.push({
          type: "text",
          title: "Information",
          items: genericContent,
        })
      }
    }

    // Extract raw text as fallback
    const mainContent = $("main, .main-content, .content, .page-content, article, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()

    result.rawText = mainContent.substring(0, 2000)
    result.success = result.extractedContent.length > 0 || result.rawText.length > 100

    console.log(
      `Dynamic Extractor - Extracted ${result.extractedContent.length} content blocks from ${url} (Success: ${result.success})`,
    )

    return result
  } catch (error) {
    console.error(`Dynamic Extractor - Failed to extract from ${url}:`, error.message)
    result.success = false
    return result
  }
}

function extractContentByType(
  $: cheerio.CheerioAPI,
  selectors: string[],
  contentType: string,
  topic: string,
  url: string,
): string[] {
  const extractedItems: string[] = []
  const seenItems = new Set<string>()

  for (const selector of selectors) {
    try {
      $(selector).each((_, element) => {
        const $element = $(element)
        let text = ""

        if (contentType === "companies") {
          // Special handling for company extraction
          if ($element.is("img")) {
            const alt = $element.attr("alt") || ""
            if (alt && alt.length > 2) {
              text = alt.replace(/logo|image|company/gi, "").trim()
            }
          } else if ($element.is("a")) {
            const href = $element.attr("href") || ""
            const linkText = $element.text().trim()
            if (linkText && linkText.length > 2) {
              text = linkText
            }
          } else {
            text = $element.text().trim()
          }

          // Filter for company-like names
          if (text && text.length > 2) {
            const hasCompanyIndicators =
              text.includes("Ltd") ||
              text.includes("Technologies") ||
              text.includes("Systems") ||
              text.includes("Solutions") ||
              text.includes("Pvt") ||
              text.includes("Inc") ||
              text.includes("Corp") ||
              text.includes("Software") ||
              text.includes("Consulting") ||
              /^[A-Z][a-zA-Z\s&]+$/.test(text)

            if (hasCompanyIndicators && text.length < 100) {
              text = text.replace(/^(•|\*|-|\d+\.)\s*/, "").trim()
            } else if (!hasCompanyIndicators) {
              text = "" // Skip non-company-like text
            }
          }
        } else if (contentType === "subjects" || contentType === "papers") {
          // Handle download links and PDFs
          if ($element.is("a")) {
            const href = $element.attr("href") || ""
            const linkText = $element.text().trim()
            if (href.includes(".pdf") || href.includes("download") || linkText.includes("Download")) {
              text = `${linkText} (${href.startsWith("http") ? href : new URL(href, url).href})`
            } else {
              text = linkText
            }
          } else {
            text = $element.text().trim()
          }
        } else if (contentType === "profiles") {
          // Handle faculty profiles
          if ($element.is("tr")) {
            const cells = $element.find("td")
            if (cells.length >= 2) {
              const name = cells.eq(0).text().trim()
              const designation = cells.eq(1).text().trim()
              const email = cells.eq(2).text().trim() || ""
              if (name && designation) {
                text = `${name} - ${designation}${email ? ` (${email})` : ""}`
              }
            }
          } else {
            text = $element.text().trim()
          }
        } else {
          // Generic text extraction
          text = $element.text().trim()
        }

        // Add to results if meaningful and unique
        if (text && text.length > 2 && text.length < 500 && !seenItems.has(text.toLowerCase())) {
          extractedItems.push(text)
          seenItems.add(text.toLowerCase())
        }
      })

      // If we found good content with this selector, we can continue to get more
      if (extractedItems.length >= 5 && contentType === "companies") {
        break // We have enough companies, no need to try more selectors
      }
    } catch (selectorError) {
      console.error(`Dynamic Extractor - Error with selector "${selector}":`, selectorError.message)
      continue
    }
  }

  return extractedItems.slice(0, 30) // Limit results
}

function extractGenericContent($: cheerio.CheerioAPI, topic: string): string[] {
  const content: string[] = []

  // Try to find topic-relevant content
  const topicKeywords = {
    placements: ["placement", "company", "recruit", "job", "career", "interview"],
    question_bank: ["question", "paper", "exam", "download", "pdf", "subject"],
    results: ["result", "marks", "grade", "score", "examination"],
    notifications: ["notification", "circular", "notice", "announcement"],
    faculty: ["faculty", "professor", "teacher", "staff", "department"],
  }

  const keywords = topicKeywords[topic] || []

  // Look for paragraphs or divs containing relevant keywords
  $("p, div, li").each((_, element) => {
    const text = $(element).text().trim()
    if (text.length > 20 && text.length < 300) {
      const hasKeyword = keywords.some((keyword) => text.toLowerCase().includes(keyword))
      if (hasKeyword) {
        content.push(text)
      }
    }
  })

  return content.slice(0, 10)
}

export function formatDynamicContent(scrapedData: DynamicScrapedData[]): string {
  if (!scrapedData || scrapedData.length === 0) {
    return ""
  }

  let formattedContent = ""

  scrapedData.forEach((data) => {
    if (data.success && data.extractedContent.length > 0) {
      formattedContent += `\n\n=== LIVE DATA FROM ${data.url} ===\n`
      formattedContent += `Topic: ${data.topic.toUpperCase()}\n`
      formattedContent += `Scraped: ${data.timestamp.toLocaleString()}\n\n`

      data.extractedContent.forEach((content) => {
        if (content.items.length > 0) {
          formattedContent += `${content.title}:\n`
          content.items.forEach((item, index) => {
            formattedContent += `${index + 1}. ${item}\n`
          })
          formattedContent += "\n"
        }
      })
    }
  })

  return formattedContent
}
