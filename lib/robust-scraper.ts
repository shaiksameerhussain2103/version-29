import axios from "axios"
import * as cheerio from "cheerio"

interface ScrapedTableData {
  headers: string[]
  rows: string[][]
  rawData: string[]
}

interface RobustScrapedData {
  url: string
  topic: string
  tables: ScrapedTableData[]
  lists: string[]
  links: { text: string; url: string }[]
  paragraphs: string[]
  rawHtml: string
  success: boolean
  errorMessage?: string
  scrapingTimestamp: Date
  contentLength: number
}

export async function robustScrapeUrl(url: string, topic: string): Promise<RobustScrapedData> {
  console.log(`🔍 ROBUST SCRAPER - Starting scrape for ${topic}: ${url}`)

  const result: RobustScrapedData = {
    url,
    topic,
    tables: [],
    lists: [],
    links: [],
    paragraphs: [],
    rawHtml: "",
    success: false,
    scrapingTimestamp: new Date(),
    contentLength: 0,
  }

  try {
    console.log(`📡 ROBUST SCRAPER - Fetching URL: ${url}`)

    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 5,
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
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        DNT: "1",
      },
    })

    console.log(`✅ ROBUST SCRAPER - Successfully fetched ${url}`)
    console.log(`📊 ROBUST SCRAPER - Response status: ${response.status}`)
    console.log(`📏 ROBUST SCRAPER - Content length: ${response.data.length} characters`)

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const $ = cheerio.load(response.data)
    result.rawHtml = response.data
    result.contentLength = response.data.length

    // Log the raw HTML structure for debugging
    console.log(`🔍 ROBUST SCRAPER - Page title: "${$("title").text().trim()}"`)
    console.log(`🔍 ROBUST SCRAPER - Found ${$("table").length} tables`)
    console.log(`🔍 ROBUST SCRAPER - Found ${$("ul, ol").length} lists`)
    console.log(`🔍 ROBUST SCRAPER - Found ${$("a").length} links`)

    // Remove unwanted elements but keep the content structure
    $("script, style, noscript").remove()

    // 1. EXTRACT TABLES (CRITICAL FOR COMPANIES DATA)
    console.log(`📋 ROBUST SCRAPER - Extracting tables...`)
    $("table").each((tableIndex, tableElement) => {
      const $table = $(tableElement)
      console.log(`📋 ROBUST SCRAPER - Processing table ${tableIndex + 1}`)

      const tableData: ScrapedTableData = {
        headers: [],
        rows: [],
        rawData: [],
      }

      // Extract headers
      const $headers = $table.find("thead tr th, tr:first-child th, tr:first-child td")
      if ($headers.length > 0) {
        $headers.each((_, headerElement) => {
          const headerText = $(headerElement).text().trim()
          if (headerText) {
            tableData.headers.push(headerText)
          }
        })
        console.log(`📋 ROBUST SCRAPER - Table ${tableIndex + 1} headers:`, tableData.headers)
      }

      // Extract all rows
      const $rows = $table.find("tbody tr, tr")
      console.log(`📋 ROBUST SCRAPER - Table ${tableIndex + 1} has ${$rows.length} rows`)

      $rows.each((rowIndex, rowElement) => {
        const $row = $(rowElement)
        const rowData: string[] = []
        const $cells = $row.find("td, th")

        $cells.each((_, cellElement) => {
          const cellText = $(cellElement).text().trim()
          rowData.push(cellText)
        })

        if (rowData.length > 0 && rowData.some((cell) => cell.length > 0)) {
          tableData.rows.push(rowData)
          // Also add to raw data for easier processing
          const rowText = rowData.join(" | ")
          if (rowText.trim()) {
            tableData.rawData.push(rowText)
          }
        }
      })

      console.log(`📋 ROBUST SCRAPER - Table ${tableIndex + 1} extracted ${tableData.rows.length} data rows`)

      if (tableData.rows.length > 0 || tableData.headers.length > 0) {
        result.tables.push(tableData)
        console.log(`✅ ROBUST SCRAPER - Table ${tableIndex + 1} added to results`)
      }
    })

    // 2. EXTRACT LISTS
    console.log(`📝 ROBUST SCRAPER - Extracting lists...`)
    $("ul li, ol li").each((_, listItem) => {
      const text = $(listItem).text().trim()
      if (text && text.length > 2 && text.length < 500) {
        result.lists.push(text)
      }
    })
    console.log(`📝 ROBUST SCRAPER - Extracted ${result.lists.length} list items`)

    // 3. EXTRACT LINKS (especially PDFs and important pages)
    console.log(`🔗 ROBUST SCRAPER - Extracting links...`)
    $("a").each((_, linkElement) => {
      const $link = $(linkElement)
      const href = $link.attr("href")
      const text = $link.text().trim()

      if (href && text && text.length > 1) {
        let fullUrl = href
        if (href.startsWith("/")) {
          fullUrl = new URL(href, url).href
        } else if (!href.startsWith("http")) {
          try {
            fullUrl = new URL(href, url).href
          } catch {
            fullUrl = href
          }
        }

        result.links.push({ text, url: fullUrl })
      }
    })
    console.log(`🔗 ROBUST SCRAPER - Extracted ${result.links.length} links`)

    // 4. EXTRACT PARAGRAPHS
    console.log(`📄 ROBUST SCRAPER - Extracting paragraphs...`)
    $("p, div.content, div.text, .description").each((_, element) => {
      const text = $(element).text().trim()
      if (text && text.length > 20 && text.length < 1000) {
        result.paragraphs.push(text)
      }
    })
    console.log(`📄 ROBUST SCRAPER - Extracted ${result.paragraphs.length} paragraphs`)

    // Determine success based on extracted content
    const hasContent =
      result.tables.length > 0 || result.lists.length > 0 || result.links.length > 0 || result.paragraphs.length > 0

    result.success = hasContent

    console.log(`🎯 ROBUST SCRAPER - Scraping ${result.success ? "SUCCESSFUL" : "FAILED"} for ${url}`)
    console.log(
      `📊 ROBUST SCRAPER - Final stats: ${result.tables.length} tables, ${result.lists.length} lists, ${result.links.length} links, ${result.paragraphs.length} paragraphs`,
    )

    return result
  } catch (error) {
    console.error(`❌ ROBUST SCRAPER - Error scraping ${url}:`, error.message)
    result.success = false
    result.errorMessage = error.message
    return result
  }
}

export function formatRobustScrapedData(scrapedData: RobustScrapedData[]): string {
  if (!scrapedData || scrapedData.length === 0) {
    return ""
  }

  let formattedContent = ""

  scrapedData.forEach((data, index) => {
    if (data.success) {
      formattedContent += `\n\n=== LIVE DATA FROM ${data.url} ===\n`
      formattedContent += `Topic: ${data.topic.toUpperCase()}\n`
      formattedContent += `Scraped: ${data.scrapingTimestamp.toLocaleString()}\n`
      formattedContent += `Content Length: ${data.contentLength} characters\n\n`

      // Format tables (MOST IMPORTANT for companies data)
      if (data.tables.length > 0) {
        formattedContent += `📋 TABLES FOUND (${data.tables.length}):\n\n`
        data.tables.forEach((table, tableIndex) => {
          formattedContent += `Table ${tableIndex + 1}:\n`
          if (table.headers.length > 0) {
            formattedContent += `Headers: ${table.headers.join(" | ")}\n`
          }
          formattedContent += `Data Rows (${table.rows.length}):\n`
          table.rows.forEach((row, rowIndex) => {
            if (rowIndex < 50) {
              // Limit to first 50 rows
              formattedContent += `${rowIndex + 1}. ${row.join(" | ")}\n`
            }
          })
          formattedContent += "\n"
        })
      }

      // Format lists
      if (data.lists.length > 0) {
        formattedContent += `📝 LISTS FOUND (${data.lists.length}):\n`
        data.lists.slice(0, 30).forEach((item, itemIndex) => {
          formattedContent += `${itemIndex + 1}. ${item}\n`
        })
        formattedContent += "\n"
      }

      // Format important links
      if (data.links.length > 0) {
        const importantLinks = data.links.filter(
          (link) =>
            link.text.toLowerCase().includes("download") ||
            link.text.toLowerCase().includes("pdf") ||
            link.url.includes(".pdf") ||
            link.text.length > 5,
        )
        if (importantLinks.length > 0) {
          formattedContent += `🔗 IMPORTANT LINKS FOUND (${importantLinks.length}):\n`
          importantLinks.slice(0, 20).forEach((link, linkIndex) => {
            formattedContent += `${linkIndex + 1}. ${link.text} (${link.url})\n`
          })
          formattedContent += "\n"
        }
      }

      // Format paragraphs (if no tables found)
      if (data.tables.length === 0 && data.paragraphs.length > 0) {
        formattedContent += `📄 TEXT CONTENT FOUND (${data.paragraphs.length}):\n`
        data.paragraphs.slice(0, 10).forEach((paragraph, paragraphIndex) => {
          formattedContent += `${paragraphIndex + 1}. ${paragraph}\n\n`
        })
      }
    } else {
      formattedContent += `\n\n❌ FAILED TO SCRAPE ${data.url}\n`
      formattedContent += `Error: ${data.errorMessage || "Unknown error"}\n`
    }
  })

  return formattedContent
}

export function extractCompaniesFromScrapedData(scrapedData: RobustScrapedData[]): string[] {
  const companies: string[] = []
  const seenCompanies = new Set<string>()

  scrapedData.forEach((data) => {
    if (data.success) {
      // Extract from tables (primary source for companies)
      data.tables.forEach((table) => {
        table.rows.forEach((row) => {
          row.forEach((cell) => {
            // Look for company-like names
            if (
              cell &&
              cell.length > 2 &&
              cell.length < 100 &&
              (cell.includes("Ltd") ||
                cell.includes("Technologies") ||
                cell.includes("Systems") ||
                cell.includes("Solutions") ||
                cell.includes("Pvt") ||
                cell.includes("Inc") ||
                cell.includes("Corp") ||
                cell.includes("Software") ||
                cell.includes("Consulting") ||
                /^[A-Z][a-zA-Z\s&.-]+$/.test(cell))
            ) {
              const cleanCompany = cell.trim().replace(/^(•|\*|-|\d+\.)\s*/, "")
              if (!seenCompanies.has(cleanCompany.toLowerCase())) {
                companies.push(cleanCompany)
                seenCompanies.add(cleanCompany.toLowerCase())
              }
            }
          })
        })
      })

      // Extract from lists as fallback
      data.lists.forEach((item) => {
        if (
          item &&
          item.length > 2 &&
          item.length < 100 &&
          (item.includes("Ltd") ||
            item.includes("Technologies") ||
            item.includes("Systems") ||
            item.includes("Solutions") ||
            item.includes("Pvt"))
        ) {
          const cleanCompany = item.trim().replace(/^(•|\*|-|\d+\.)\s*/, "")
          if (!seenCompanies.has(cleanCompany.toLowerCase())) {
            companies.push(cleanCompany)
            seenCompanies.add(cleanCompany.toLowerCase())
          }
        }
      })
    }
  })

  return companies.slice(0, 50) // Limit to 50 companies
}
