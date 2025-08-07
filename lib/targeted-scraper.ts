import axios from "axios"
import * as cheerio from "cheerio"

// Keyword-to-URL mapping for targeted scraping
const KEYWORD_URL_MAPPING = {
  faculty: {
    keywords: ["faculty", "professor", "dean", "teaching", "teacher", "staff", "instructor"],
    url: "https://cmrtc.ac.in/departments/department-of-computer-science-engineering/faculty/",
    topic: "Faculty",
  },
  director: {
    keywords: ["director", "director cmr", "head", "principal"],
    url: "https://cmrtc.ac.in/administration/director/",
    topic: "Director",
  },
  placements: {
    keywords: ["placements", "companies", "t&p", "training", "placement", "job", "career", "recruitment"],
    url: "https://cmrtc.ac.in/t-p-cell/about-t-p-cell/",
    topic: "Placements",
  },
  companies: {
    keywords: ["companies visited", "company list", "recruiters", "employers"],
    url: "https://cmrtc.ac.in/t-p-cell/companies-visited/",
    topic: "Companies",
  },
  fees: {
    keywords: ["fee", "fees", "cost", "tuition", "payment", "charges"],
    url: "https://cmrtc.ac.in/academics/fee-structure/",
    topic: "Fee Structure",
  },
  courses: {
    keywords: ["courses", "programs", "curriculum", "syllabus", "degree", "branch", "department"],
    url: "https://cmrtc.ac.in/academics/courses-offered/",
    topic: "Courses",
  },
  contact: {
    keywords: ["contact", "address", "phone", "email", "location", "reach"],
    url: "https://cmrtc.ac.in/contact/",
    topic: "Contact",
  },
  about: {
    keywords: ["about", "college", "institution", "campus", "history", "overview"],
    url: "https://cmrtc.ac.in/administration/about-college/",
    topic: "About College",
  },
}

interface TargetedScrapedData {
  content: string
  images: string[]
  sourceUrl: string
  topic: string
  success: boolean
}

export function identifyTargetTopic(question: string): { topic: string; url: string; keywords: string[] } | null {
  const normalizedQuestion = question.toLowerCase().trim()

  console.log("Targeted Scraper - Analyzing question:", normalizedQuestion)

  // Check each mapping for keyword matches
  for (const [key, mapping] of Object.entries(KEYWORD_URL_MAPPING)) {
    const hasKeyword = mapping.keywords.some((keyword) => normalizedQuestion.includes(keyword.toLowerCase()))

    if (hasKeyword) {
      console.log(`Targeted Scraper - Matched topic: ${mapping.topic} for keywords: ${mapping.keywords.join(", ")}`)
      return {
        topic: mapping.topic,
        url: mapping.url,
        keywords: mapping.keywords,
      }
    }
  }

  console.log("Targeted Scraper - No specific topic matched, will use general scraping")
  return null
}

export async function scrapeTargetedUrl(url: string, topic: string): Promise<TargetedScrapedData> {
  console.log(`Targeted Scraper - Starting targeted scrape for ${topic}: ${url}`)

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

    console.log(`Targeted Scraper - Successfully fetched ${topic} page (${response.status})`)

    const $ = cheerio.load(response.data)

    // Remove unwanted elements
    $(
      "script, style, noscript, nav, footer, .menu, .navigation, header, .header, .sidebar, .ads, .advertisement",
    ).remove()

    // Extract main content with topic-specific selectors
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
      ".faculty-list",
      ".faculty-profile",
      ".director-profile",
      ".placement-info",
      ".fee-structure",
      ".course-list",
      ".contact-info",
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
          console.error(`Targeted Scraper - Invalid image URL: ${actualSrc} from ${url}`)
        }
      }
    })

    console.log(
      `Targeted Scraper - Extracted ${textContent.length} characters and ${images.length} images from ${topic}`,
    )

    // Ensure we have meaningful content
    if (!textContent.trim() || textContent.length < 50) {
      throw new Error(`Insufficient content extracted from ${topic} page`)
    }

    return {
      content: textContent.substring(0, 3000), // Limit content to avoid token limits
      images: images.slice(0, 5), // Limit images
      sourceUrl: url,
      topic: topic,
      success: true,
    }
  } catch (error) {
    console.error(`Targeted Scraper - Failed to scrape ${topic} from ${url}:`, error.message)

    return {
      content: "",
      images: [],
      sourceUrl: url,
      topic: topic,
      success: false,
    }
  }
}

export async function getTargetedCollegeData(question: string): Promise<TargetedScrapedData | null> {
  const targetInfo = identifyTargetTopic(question)

  if (!targetInfo) {
    return null
  }

  const scrapedData = await scrapeTargetedUrl(targetInfo.url, targetInfo.topic)
  return scrapedData
}

// Fallback data for when targeted scraping fails
export function getTopicFallbackData(topic: string): TargetedScrapedData {
  const fallbackContent = {
    Faculty: `CMR Technical Campus Faculty Information

The college has experienced faculty members across various departments including Computer Science Engineering, Electronics and Communication Engineering, Mechanical Engineering, Civil Engineering, and Information Technology.

Faculty members hold advanced degrees and have industry experience. The college emphasizes quality education through qualified teaching staff.

For detailed faculty profiles, contact information, and department-wise faculty lists, please visit the official website or contact the college directly.`,

    Director: `CMR Technical Campus Director Information

The college is led by an experienced Director who oversees academic and administrative operations.

The Director's office handles strategic planning, policy implementation, and overall institutional governance.

For specific information about the current Director, their background, and contact details, please visit the official website or contact the college administration.`,

    Placements: `CMR Technical Campus Placement Information

The Training and Placement Cell (T&P Cell) facilitates campus recruitment and career development for students.

Services include:
- Campus recruitment drives
- Industry interaction programs
- Skill development training
- Interview preparation
- Career guidance and counseling

The college maintains relationships with various companies for student placements across different engineering disciplines.`,

    Companies: `CMR Technical Campus Recruiting Companies

Various companies visit the campus for recruitment drives across different engineering branches.

The college maintains partnerships with companies in IT, manufacturing, consulting, and other sectors.

For current placement statistics, company lists, and recruitment schedules, please contact the Training and Placement Cell directly.`,

    "Fee Structure": `CMR Technical Campus Fee Information

The college offers various undergraduate and postgraduate programs with competitive fee structures.

Fee components typically include:
- Tuition fees
- Laboratory fees
- Library fees
- Development fees
- Examination fees

Payment options and scholarship opportunities may be available for eligible students.

For current fee details, payment schedules, and financial assistance information, please visit the official website or contact the accounts department.`,

    Courses: `CMR Technical Campus Academic Programs

The college offers undergraduate and postgraduate programs in various engineering disciplines:

- Computer Science Engineering
- Electronics and Communication Engineering
- Electrical and Electronics Engineering
- Mechanical Engineering
- Civil Engineering
- Information Technology
- Artificial Intelligence and Data Science
- Cyber Security

Each program includes comprehensive curriculum, practical training, and industry exposure.

For detailed course information, eligibility criteria, and admission requirements, please visit the official website.`,

    Contact: `CMR Technical Campus Contact Information

The college is located in Hyderabad and can be reached through various communication channels.

For specific contact details including:
- Phone numbers
- Email addresses
- Physical address
- Department-wise contacts

Please visit the official website at https://cmrtc.ac.in/contact/ or contact the college directly during working hours.`,

    "About College": `CMR Technical Campus Overview

CMR Technical Campus is a premier engineering institution offering quality education in various engineering disciplines.

The college focuses on:
- Academic excellence
- Industry-relevant curriculum
- Modern infrastructure
- Experienced faculty
- Student development programs
- Research and innovation

The institution is committed to providing comprehensive education and preparing students for successful careers in engineering and technology.`,
  }

  return {
    content:
      fallbackContent[topic] ||
      `Information about ${topic} is currently unavailable. Please visit https://cmrtc.ac.in/ for the latest updates.`,
    images: [],
    sourceUrl: "https://cmrtc.ac.in/",
    topic: topic,
    success: false,
  }
}
