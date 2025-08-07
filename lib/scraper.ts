import axios from "axios"
import * as cheerio from "cheerio"

const COLLEGE_URLS = [
  "https://cmrtc.ac.in/",
  "https://cmrtc.ac.in/academics/fee-structure/",
  "https://cmrtc.ac.in/contact/",
  "https://cmrtc.ac.in/administration/about-college/",
  "https://cmrtc.ac.in/academics/courses-offered/",
  "https://cmrtc.ac.in/t-p-cell/about-t-p-cell/",
  "https://cmrtc.ac.in/departments/department-of-information-technology/faculty-it/",
  "https://cmrtc.ac.in/administration/director/",
  "https://cmrtc.ac.in/t-p-cell/companies-visited/",
]

interface ScrapedData {
  content: string
  images: string[]
  sources: string[]
}

interface ScrapedPage {
  url: string
  content: string
  images: string[]
}

export async function scrapeCollegeData(): Promise<ScrapedData> {
  console.log("Scraper - Starting comprehensive college data scraping...")

  const scrapedData: ScrapedData = {
    content: "",
    images: [],
    sources: [],
  }

  const scrapePromises = COLLEGE_URLS.map(async (url): Promise<ScrapedPage> => {
    try {
      console.log(`Scraper - Attempting to scrape: ${url}`)

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

      console.log(`Scraper - Successfully fetched: ${url} (${response.status})`)

      const $ = cheerio.load(response.data)

      // Remove unwanted elements that don't contain useful content
      $(
        "script, style, noscript, nav, footer, .menu, .navigation, header, .header, .sidebar, .ads, .advertisement",
      ).remove()

      // Extract main content text from various possible containers
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
        const dataSrc = $(element).attr("data-src") // For lazy-loaded images
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
            console.error(`Scraper - Invalid image URL: ${actualSrc} from ${url}`)
          }
        }
      })

      console.log(`Scraper - Extracted ${textContent.length} characters and ${images.length} images from ${url}`)

      return {
        url,
        content: textContent.substring(0, 2000), // Limit content per page to avoid token limits
        images: images.slice(0, 3), // Limit images per page
      }
    } catch (error) {
      console.error(`Scraper - Failed to scrape ${url}:`, error.message)
      return {
        url,
        content: "",
        images: [],
      }
    }
  })

  try {
    // Wait for all scraping operations to complete
    const results = await Promise.allSettled(scrapePromises)

    let successfulScrapes = 0
    results.forEach((result) => {
      if (result.status === "fulfilled" && result.value.content.trim()) {
        const page = result.value
        scrapedData.content += `\n\n--- Content from ${page.url} ---\n${page.content}`
        scrapedData.images.push(...page.images)
        scrapedData.sources.push(page.url)
        successfulScrapes++
      }
    })

    // Remove duplicate images
    scrapedData.images = [...new Set(scrapedData.images)]

    console.log(
      `Scraper - Completed: ${successfulScrapes}/${COLLEGE_URLS.length} successful scrapes, ${scrapedData.sources.length} sources, ${scrapedData.images.length} unique images`,
    )

    // If no content was scraped, provide comprehensive fallback
    if (!scrapedData.content.trim() || successfulScrapes === 0) {
      console.log("Scraper - No content scraped, using fallback data")
      scrapedData.content = `CMR Technical Campus - Premier Engineering Institution

CMR Technical Campus is a leading engineering college offering undergraduate and postgraduate programs in various disciplines including:

ACADEMIC PROGRAMS:
- Computer Science Engineering
- Electronics and Communication Engineering  
- Electrical and Electronics Engineering
- Mechanical Engineering
- Civil Engineering
- Information Technology
- Artificial Intelligence and Data Science
- Cyber Security

FACILITIES:
- Modern laboratories and workshops
- Well-equipped library
- Hostel facilities for boys and girls
- Sports and recreational facilities
- Placement and training cell
- Research and development centers

ADMISSIONS:
- Applications accepted through online portal
- Eligibility based on entrance exam scores
- Merit-based selection process
- Scholarships available for deserving students

PLACEMENTS:
- Strong industry connections
- Regular campus recruitment drives
- Training and skill development programs
- High placement percentage

For detailed and current information about admissions, fee structure, courses, faculty, and facilities, please visit the official website or contact the college directly.

Contact Information:
Website: https://cmrtc.ac.in/
Location: CMR Technical Campus, Hyderabad`

      scrapedData.sources = ["https://cmrtc.ac.in/"]
    }
  } catch (error) {
    console.error("Scraper - General error during scraping process:", error)

    // Provide fallback data even in case of complete failure
    scrapedData.content = `CMR Technical Campus information is temporarily unavailable due to technical issues. Please visit https://cmrtc.ac.in/ for the latest updates and information about courses, admissions, and facilities.`
    scrapedData.sources = ["https://cmrtc.ac.in/"]
  }

  return scrapedData
}
