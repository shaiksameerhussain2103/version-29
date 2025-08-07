// Script to set up Firestore URL mappings
// Run this once to populate the scraper_mappings collection

const { initializeApp } = require("firebase/app")
const { getFirestore, doc, setDoc } = require("firebase/firestore")

const firebaseConfig = {
  apiKey: "AIzaSyCozSaBqERevZMcKufx0VAF4Ti_DtevacQ",
  authDomain: "cmr-gpt.firebaseapp.com",
  projectId: "cmr-gpt",
  storageBucket: "cmr-gpt.firebasestorage.app",
  messagingSenderId: "123005728705",
  appId: "1:123005728705:web:a83a78d6f35bd02adce140",
  measurementId: "G-ZXDR7JFKWH",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const urlMappings = {
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

async function setupFirestoreMappings() {
  try {
    console.log("Setting up Firestore URL mappings...")

    const docRef = doc(db, "scraper_mappings", "topic_urls")
    await setDoc(docRef, urlMappings)

    console.log("✅ Firestore URL mappings set up successfully!")
    console.log("Topics configured:", Object.keys(urlMappings).join(", "))

    // Log the total number of URLs
    const totalUrls = Object.values(urlMappings).reduce((sum, urls) => sum + urls.length, 0)
    console.log(`Total URLs configured: ${totalUrls}`)

    process.exit(0)
  } catch (error) {
    console.error("❌ Error setting up Firestore mappings:", error)
    process.exit(1)
  }
}

setupFirestoreMappings()
