import axios from "axios"
import * as cheerio from "cheerio"

interface StructuredContent {
  type: string
  data: string[]
  metadata?: Record<string, any>
}

interface StructuredScrapedData {
  topic: string
  url: string
  structuredContent: StructuredContent[]
  rawText: string
  images: string[]
  success: boolean
}

// Topic-specific DOM selectors for structured content extraction
const TOPIC_SELECTORS = {
  placements: {
    companies: [
      ".companies-visited ul li",
      ".company-list li",
      ".placement-companies .company",
      ".companies-grid .company-item",
      "ul li:contains('Ltd')",
      "ul li:contains('Technologies')",
      "ul li:contains('Systems')",
      "ul li:contains('Solutions')",
      ".company-name",
      "img[alt*='company']",
      "img[alt*='logo']",
    ],
    students: [".students-placed .student", ".placement-stats .stat", "table.placement-table tr", ".student-profile"],
    statistics: [".placement-percentage", ".stats-number", ".placement-data"],
  },
  faculty: {
    profiles: [
      ".faculty-table tr",
      ".faculty-profile",
      ".faculty-card",
      ".faculty-member",
      ".staff-profile",
      "table tr",
      ".faculty-list .faculty",
    ],
    names: [".faculty-name", ".professor-name", "td:first-child", "h3", "h4"],
    designations: [".designation", ".position", ".title", "td:nth-child(2)"],
    emails: ["a[href^='mailto:']", ".email", ".contact-email"],
  },
  question_bank: {
    subjects: [".subject-list li", ".question-bank-subject", ".subject-name", "table.subjects tr"],
    downloads: [
      "a[href$='.pdf']",
      "a[href*='download']",
      ".download-link",
      ".pdf-link",
      "a:contains('Download')",
      "a:contains('PDF')",
    ],
    papers: [".question-paper", ".previous-paper", ".exam-paper"],
  },
  results: {
    announcements: [".result-announcement", ".result-notice", ".exam-result", "a[href*='result']"],
    links: ["a[href*='result']", ".result-link", "a:contains('Result')"],
  },
  notifications: {
    circulars: [".circular", ".notification", ".notice", ".announcement", "ul.notifications li", ".news-item"],
    dates: [".date", ".published-date", ".notice-date"],
    links: ["a[href$='.pdf']", ".circular-link", "a:contains('Download')"],
  },
  fees: {
    structure: [".fee-structure table tr", ".fee-table tr", ".course-fee", ".fee-details"],
    amounts: [".fee-amount", ".amount", "td:contains('₹')", "td:contains('Rs')"],
  },
  contact: {
    phones: ["a[href^='tel:']", ".phone", ".contact-number", "td:contains('+')"],
    emails: ["a[href^='mailto:']", ".email", ".contact-email"],
    addresses: [".address", ".location", ".contact-address"],
  },
}

export async function scrapeStructuredContent(url: string, topic: string): Promise<StructuredScrapedData> {
  console.log(`Structured Scraper - Starting structured scrape for ${topic}: ${url}`)

  const result: StructuredScrapedData = {
    topic,
    url,
    structuredContent: [],
    rawText: "",
    images: [],
    success: false,
  }

  try {
    const response = await axios.get(url, {
      timeout: 10000,
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

    console.log(`Structured Scraper - Successfully fetched ${topic} page (${response.status})`)

    const $ = cheerio.load(response.data)

    // Remove unwanted elements
    $(
      "script, style, noscript, nav, footer, .menu, .navigation, header, .header, .sidebar, .ads, .advertisement",
    ).remove()

    // Extract structured content based on topic
    const topicSelectors = TOPIC_SELECTORS[topic]
    if (topicSelectors) {
      for (const [contentType, selectors] of Object.entries(topicSelectors)) {
        const extractedData = extractContentBySelectors($, selectors, contentType, topic)
        if (extractedData.length > 0) {
          result.structuredContent.push({
            type: contentType,
            data: extractedData,
          })
        }
      }
    }

    // Extract images with proper URL resolution
    $("img").each((_, element) => {
      const src = $(element).attr("src")
      const dataSrc = $(element).attr("data-src")
      const alt = $(element).attr("alt") || ""
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

          // Include images that might be relevant to the topic
          if (
            fullUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) &&
            (alt.toLowerCase().includes(topic) ||
              alt.toLowerCase().includes("logo") ||
              alt.toLowerCase().includes("company") ||
              alt.toLowerCase().includes("faculty"))
          ) {
            result.images.push(fullUrl)
          }
        } catch (urlError) {
          console.error(`Structured Scraper - Invalid image URL: ${actualSrc} from ${url}`)
        }
      }
    })

    // Extract fallback raw text if no structured content found
    if (result.structuredContent.length === 0) {
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

      result.rawText = textContent.replace(/\s+/g, " ").replace(/\n+/g, " ").replace(/\t+/g, " ").trim()
    }

    result.success = result.structuredContent.length > 0 || result.rawText.length > 100

    console.log(
      `Structured Scraper - Extracted ${result.structuredContent.length} structured content blocks and ${result.images.length} images from ${topic}`,
    )

    return result
  } catch (error) {
    console.error(`Structured Scraper - Failed to scrape ${topic} from ${url}:`, error.message)
    result.success = false
    return result
  }
}

function extractContentBySelectors(
  $: cheerio.CheerioAPI,
  selectors: string[],
  contentType: string,
  topic: string,
): string[] {
  const extractedData: string[] = []

  for (const selector of selectors) {
    try {
      $(selector).each((_, element) => {
        const $element = $(element)
        let text = ""

        // Special handling for different content types
        if (contentType === "downloads" || contentType === "links") {
          const href = $element.attr("href")
          const linkText = $element.text().trim()
          if (href && linkText) {
            text = `${linkText} (${href})`
          }
        } else if (contentType === "emails") {
          const href = $element.attr("href")
          if (href && href.startsWith("mailto:")) {
            text = href.replace("mailto:", "")
          } else {
            text = $element.text().trim()
          }
        } else if (contentType === "phones") {
          const href = $element.attr("href")
          if (href && href.startsWith("tel:")) {
            text = href.replace("tel:", "")
          } else {
            text = $element.text().trim()
          }
        } else if (contentType === "profiles" && $element.is("tr")) {
          // Extract table row data
          const cells = $element.find("td")
          if (cells.length >= 2) {
            const name = cells.eq(0).text().trim()
            const designation = cells.eq(1).text().trim()
            const email = cells.eq(2).text().trim() || ""
            text = `${name} - ${designation}${email ? ` (${email})` : ""}`
          }
        } else if (contentType === "companies") {
          text = $element.text().trim()
          // Clean up company names
          if (text && text.length > 2 && !text.includes("http") && !text.includes("www")) {
            // Remove common prefixes/suffixes that aren't part of company names
            text = text.replace(/^(•|\*|-|\d+\.)\s*/, "").trim()
          }
        } else {
          text = $element.text().trim()
        }

        // Add to results if meaningful content
        if (text && text.length > 2 && !extractedData.includes(text)) {
          extractedData.push(text)
        }
      })

      // If we found content with this selector, we can break early for some types
      if (extractedData.length > 0 && (contentType === "companies" || contentType === "profiles")) {
        break
      }
    } catch (selectorError) {
      console.error(`Structured Scraper - Error with selector "${selector}":`, selectorError.message)
      continue
    }
  }

  return extractedData.slice(0, 50) // Limit results to prevent overwhelming responses
}

export function formatStructuredContent(structuredData: StructuredScrapedData[]): string {
  if (!structuredData || structuredData.length === 0) {
    return ""
  }

  let formattedContent = ""

  structuredData.forEach((data) => {
    if (data.structuredContent.length > 0) {
      formattedContent += `\n\n--- Structured Data from ${data.url} (${data.topic}) ---\n`

      data.structuredContent.forEach((content) => {
        if (content.data.length > 0) {
          formattedContent += `\n${content.type.toUpperCase()}:\n`
          content.data.forEach((item, index) => {
            formattedContent += `${index + 1}. ${item}\n`
          })
        }
      })
    } else if (data.rawText) {
      formattedContent += `\n\n--- Content from ${data.url} ---\n${data.rawText.substring(0, 1000)}`
    }
  })

  return formattedContent
}

export function combineStructuredImages(structuredData: StructuredScrapedData[]): string[] {
  const allImages: string[] = []

  structuredData.forEach((data) => {
    allImages.push(...data.images)
  })

  // Remove duplicates and limit total images
  return [...new Set(allImages)].slice(0, 10)
}

export function combineStructuredSources(structuredData: StructuredScrapedData[]): string[] {
  return structuredData.map((data) => data.url)
}
