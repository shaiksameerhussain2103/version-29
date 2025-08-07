// Enhanced NLP utilities for query normalization and similarity matching

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "will",
  "with",
  "what",
  "when",
  "where",
  "who",
  "how",
  "can",
  "could",
  "should",
  "would",
  "do",
  "does",
  "did",
  "have",
  "had",
  "i",
  "you",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "our",
  "their",
  "this",
  "these",
  "those",
  "am",
  "been",
  "being",
  "but",
  "if",
  "or",
  "because",
  "as",
  "until",
  "while",
  "about",
  "against",
  "between",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "up",
  "down",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
])

const COLLEGE_SYNONYMS = new Map([
  ["college", ["university", "institution", "campus", "school"]],
  ["course", ["program", "degree", "branch", "stream", "curriculum"]],
  ["fee", ["cost", "tuition", "charges", "payment", "amount"]],
  ["admission", ["enrollment", "application", "entry", "joining"]],
  ["placement", ["job", "career", "recruitment", "employment"]],
  ["faculty", ["teacher", "professor", "staff", "instructor"]],
  ["hostel", ["accommodation", "residence", "dormitory", "housing"]],
  ["exam", ["test", "assessment", "evaluation", "examination"]],
])

export function normalizeQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return ""
  }

  const normalized = query
    .toLowerCase()
    .trim()
    // Remove special characters but keep spaces
    .replace(/[^\w\s]/g, " ")
    // Replace multiple spaces with single space
    .replace(/\s+/g, " ")
    .trim()

  // Split into words and process
  let words = normalized.split(" ")

  // Remove stop words
  words = words.filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  // Expand synonyms
  const expandedWords = []
  for (const word of words) {
    expandedWords.push(word)
    // Add synonyms if available
    for (const [key, synonyms] of COLLEGE_SYNONYMS.entries()) {
      if (synonyms.includes(word)) {
        expandedWords.push(key)
      } else if (key === word) {
        expandedWords.push(...synonyms)
      }
    }
  }

  // Remove duplicates and sort for consistent comparison
  const uniqueWords = [...new Set(expandedWords)].sort()

  return uniqueWords.join(" ")
}

export function calculateSimilarity(query1: string, query2: string): number {
  if (!query1 || !query2) {
    return 0
  }

  const words1 = new Set(query1.split(" ").filter((word) => word.length > 0))
  const words2 = new Set(query2.split(" ").filter((word) => word.length > 0))

  if (words1.size === 0 || words2.size === 0) {
    return 0
  }

  // Calculate Jaccard similarity (intersection over union)
  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  const jaccardSimilarity = intersection.size / union.size

  // Calculate cosine similarity for additional accuracy
  const allWords = [...union]
  const vector1 = allWords.map((word) => (words1.has(word) ? 1 : 0))
  const vector2 = allWords.map((word) => (words2.has(word) ? 1 : 0))

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0)
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0))
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0))

  const cosineSimilarity = magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0

  // Return weighted average of both similarities
  return jaccardSimilarity * 0.6 + cosineSimilarity * 0.4
}

export function extractKeywords(text: string): string[] {
  if (!text || typeof text !== "string") {
    return []
  }

  const normalized = normalizeQuery(text)
  const words = normalized.split(" ").filter((word) => word.length > 3)

  // Count word frequency
  const wordCount = new Map<string, number>()
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

export function isCollegeRelated(query: string): boolean {
  const normalized = normalizeQuery(query)
  const collegeKeywords = [
    "college",
    "university",
    "campus",
    "admission",
    "course",
    "fee",
    "placement",
    "faculty",
    "hostel",
    "exam",
    "degree",
    "engineering",
    "cmr",
    "technical",
    "student",
    "academic",
    "department",
    "branch",
    "program",
    "curriculum",
  ]

  return collegeKeywords.some((keyword) => normalized.includes(keyword))
}

export function categorizeQuery(query: string): string {
  const normalized = normalizeQuery(query)

  if (normalized.includes("admission") || normalized.includes("application") || normalized.includes("eligibility")) {
    return "admissions"
  }
  if (normalized.includes("fee") || normalized.includes("cost") || normalized.includes("tuition")) {
    return "fees"
  }
  if (normalized.includes("course") || normalized.includes("program") || normalized.includes("curriculum")) {
    return "academics"
  }
  if (normalized.includes("placement") || normalized.includes("job") || normalized.includes("career")) {
    return "placements"
  }
  if (normalized.includes("hostel") || normalized.includes("accommodation") || normalized.includes("residence")) {
    return "facilities"
  }
  if (normalized.includes("contact") || normalized.includes("phone") || normalized.includes("email")) {
    return "contact"
  }

  return "general"
}
