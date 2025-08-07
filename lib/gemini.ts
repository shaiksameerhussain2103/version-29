import { GoogleGenerativeAI } from "@google/generative-ai"

const API_KEY = "AIzaSyCusXYVpZVoY-NqEebHpdp061yzBOHRGGs"

if (!API_KEY) {
  console.error("Gemini API key is missing!")
}

const genAI = new GoogleGenerativeAI(API_KEY)

interface ScrapedData {
  content: string
  images: string[]
  sources: string[]
}

interface GeminiResponse {
  answer: string
}

export async function generateGeminiResponse(question: string, scrapedData: ScrapedData): Promise<GeminiResponse> {
  try {
    console.log("Gemini - Generating response for question:", question)
    console.log("Gemini - Using scraped data length:", scrapedData.content.length)
    console.log("Gemini - Available sources:", scrapedData.sources.length)

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `You are CollegeGPT, the official AI assistant for CMR Technical Campus. Your role is to answer students' academic and general queries strictly using the provided institutional content.

IMPORTANT GUIDELINES:
- Only use information from the scraped college website data provided
- Be helpful, accurate, and professional in your responses
- Format responses with clear headings, bullet points, and structure using markdown
- If you don't have specific information in the provided data, say so clearly and direct users to official sources
- Include relevant details like contact information, deadlines, or procedures when available
- Keep responses comprehensive but concise (aim for 200-500 words)
- Always maintain a helpful and encouraging tone
- Use emojis sparingly and appropriately
- If the scraped data is limited or doesn't contain relevant information, acknowledge this and provide general guidance

RESPONSE FORMAT:
- Use markdown formatting for better readability
- Structure with clear headings (##, ###)
- Use bullet points for lists
- Include relevant contact information when available
- End with helpful next steps or official website reference

Do not hallucinate or make up information not present in the provided data. If information is missing, be honest about it and guide users to official sources.`,
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    })

    // Prepare the prompt with scraped data
    const prompt = `
User Question: "${question}"

Scraped College Website Data:
${scrapedData.content || "Limited data available from college website."}

Available Image URLs: ${scrapedData.images.join(", ")}
Source URLs: ${scrapedData.sources.join(", ")}

Please provide a comprehensive, well-formatted answer based strictly on the provided college website information. Use markdown formatting for better readability. If the information is limited or doesn't directly answer the question, acknowledge this and provide helpful guidance on where to find more details.

Focus on being helpful while staying within the bounds of the provided information.
`

    console.log("Gemini - Sending request to API...")

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log("Gemini - Received response, length:", text.length)

    if (!text || text.trim().length === 0) {
      throw new Error("Empty response from Gemini API")
    }

    // Clean up the response text
    const cleanedText = text.trim()

    return {
      answer: cleanedText,
    }
  } catch (error) {
    console.error("Gemini - API Error:", error)

    // Check for specific error types and provide appropriate fallbacks
    if (error.message?.includes("API_KEY") || error.message?.includes("authentication")) {
      console.error("Gemini - API Key authentication issue")
      return generateFallbackResponse(question, "authentication")
    } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
      console.error("Gemini - API quota exceeded")
      return generateFallbackResponse(question, "quota")
    } else if (error.message?.includes("timeout") || error.message?.includes("network")) {
      console.error("Gemini - Network timeout or connectivity issue")
      return generateFallbackResponse(question, "network")
    } else {
      console.error("Gemini - General API error")
      return generateFallbackResponse(question, "general")
    }
  }
}

function generateFallbackResponse(question: string, errorType: string): GeminiResponse {
  const lowerQuestion = question.toLowerCase()

  // Context-aware responses based on question content
  if (lowerQuestion.includes("admission") || lowerQuestion.includes("apply") || lowerQuestion.includes("eligibility")) {
    return {
      answer: `## 📚 Admissions Information

I'm currently unable to access the latest admission details, but here's how to get accurate information:

### For Current Admission Information:
• **Official Website**: https://cmrtc.ac.in/
• **Admissions Section**: Check the dedicated admissions page
• **Direct Contact**: Call the admissions office

### General Admission Process:
• Online application submission
• Eligibility verification based on entrance exams
• Document submission and verification
• Merit-based selection process
• Fee payment and seat confirmation

### Important Documents Usually Required:
• Entrance exam scorecard
• Academic transcripts
• Identity proof
• Category certificates (if applicable)
• Passport-size photographs

### Contact for Admissions:
Visit the official website contact section for phone numbers and email addresses.

**💡 Tip**: Check the website regularly for admission notifications and important dates!`,
    }
  }

  if (lowerQuestion.includes("fee") || lowerQuestion.includes("cost") || lowerQuestion.includes("tuition")) {
    return {
      answer: `## 💰 Fee Structure Information

I'm currently unable to access the specific fee details, but here's how to get accurate information:

### For Current Fee Structure:
• **Fee Structure Page**: https://cmrtc.ac.in/academics/fee-structure/
• **Download**: Official fee structure document
• **Contact**: Accounts department for clarifications

### What Fees Typically Include:
• **Tuition Fees**: Course-specific charges
• **Laboratory Fees**: Practical and lab usage
• **Library Fees**: Access to library resources
• **Development Fees**: Infrastructure and facilities
• **Examination Fees**: Assessment and certification

### Payment Information:
• Multiple payment methods accepted
• Installment options may be available
• Scholarship opportunities for eligible students
• Fee refund policies as per college rules

### For Exact Amounts:
Contact the college directly or visit the official website for the most current fee structure.

**💡 Tip**: Ask about scholarship programs and financial assistance options!`,
    }
  }

  if (
    lowerQuestion.includes("course") ||
    lowerQuestion.includes("program") ||
    lowerQuestion.includes("branch") ||
    lowerQuestion.includes("department")
  ) {
    return {
      answer: `## 🎓 Courses & Programs

I'm having difficulty accessing the current course catalog, but here's how to find detailed information:

### For Course Information:
• **Courses Page**: https://cmrtc.ac.in/academics/courses-offered/
• **Department Pages**: Browse individual department details
• **Curriculum**: Check syllabus and course structure

### Popular Engineering Branches:
• **Computer Science Engineering** - Software development, AI, data science
• **Electronics & Communication** - VLSI, embedded systems, telecommunications
• **Mechanical Engineering** - Design, manufacturing, automation
• **Civil Engineering** - Construction, infrastructure, environmental
• **Information Technology** - Software engineering, cybersecurity
• **Electrical & Electronics** - Power systems, control systems

### Program Details Available:
• Course duration and structure
• Eligibility requirements and prerequisites
• Career prospects and opportunities
• Faculty profiles and expertise
• Laboratory facilities and equipment

### For Detailed Information:
Visit the official website or contact specific departments directly.

**💡 Tip**: Explore department pages for faculty details and research areas!`,
    }
  }

  if (
    lowerQuestion.includes("placement") ||
    lowerQuestion.includes("job") ||
    lowerQuestion.includes("career") ||
    lowerQuestion.includes("company")
  ) {
    return {
      answer: `## 🚀 Placements & Career Opportunities

I'm currently unable to access the latest placement data, but here's how to get current information:

### For Placement Information:
• **T&P Cell Page**: https://cmrtc.ac.in/t-p-cell/about-t-p-cell/
• **Companies Visited**: https://cmrtc.ac.in/t-p-cell/companies-visited/
• **Placement Statistics**: Check annual placement reports

### What T&P Cell Typically Offers:
• **Campus Recruitment**: Regular placement drives
• **Training Programs**: Skill development and interview preparation
• **Industry Interaction**: Guest lectures and workshops
• **Internship Opportunities**: Summer and winter internships
• **Career Guidance**: Resume building and career counseling

### Placement Process:
• Registration with T&P cell
• Skill assessment and training
• Company-specific preparation
• Interview rounds and selection
• Offer letter and joining formalities

### For Current Statistics:
Contact the Training & Placement cell directly for the latest placement data and company list.

**💡 Tip**: Start preparing early and participate in all training programs offered!`,
    }
  }

  if (
    lowerQuestion.includes("contact") ||
    lowerQuestion.includes("phone") ||
    lowerQuestion.includes("email") ||
    lowerQuestion.includes("address")
  ) {
    return {
      answer: `## 📞 Contact Information

I'm currently unable to access the specific contact details, but here's how to reach CMR Technical Campus:

### Official Contact Sources:
• **Contact Page**: https://cmrtc.ac.in/contact/
• **Official Website**: https://cmrtc.ac.in/
• **Department Pages**: Individual department contact details

### General Contact Methods:
• **Phone**: Check the official contact page
• **Email**: Available on the website
• **Address**: CMR Technical Campus, Hyderabad
• **Campus Visit**: Direct visit during working hours

### Department-Specific Contacts:
• **Admissions Office**: For admission-related queries
• **Accounts Department**: For fee and financial matters
• **Academic Office**: For course and academic queries
• **T&P Cell**: For placement and training information
• **Hostel Office**: For accommodation queries

### Best Times to Contact:
• Working days: Monday to Friday
• Office hours: Typically 9:00 AM to 5:00 PM
• Avoid calling during lunch hours

**💡 Tip**: Visit the official website contact page for the most current phone numbers and email addresses!`,
    }
  }

  // Generic fallback for any other questions
  return {
    answer: `## 🤖 Service Temporarily Unavailable

I'm experiencing technical difficulties accessing the latest information about "${question}".

### What You Can Do:
• **Visit Official Website**: https://cmrtc.ac.in/
• **Contact Directly**: Call or email the college
• **Try Again Later**: Service may be restored shortly
• **Rephrase Question**: Try asking in different words

### For Immediate Assistance:
• **Phone**: Check the contact page on the website
• **Email**: Available on the official website  
• **Visit Campus**: Direct visit during working hours
• **Social Media**: Check official social media pages

### Common Information Sources:
• **Admissions**: Application process and eligibility
• **Academics**: Courses, fee structure, and curriculum
• **Placements**: Career opportunities and company visits
• **Facilities**: Campus amenities and infrastructure
• **Contact**: Phone numbers and email addresses

### Error Details:
${
  errorType === "quota"
    ? "API usage limit reached - service will resume shortly"
    : errorType === "network"
      ? "Network connectivity issues - please try again"
      : errorType === "authentication"
        ? "Service authentication issue - technical team notified"
        : "Temporary technical issue - our team is working on it"
}

**💡 I apologize for the inconvenience and will be back to help you soon!**`,
  }
}
