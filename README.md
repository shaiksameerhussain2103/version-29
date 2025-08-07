# CollegeGPT – AI Assistant for CMR Technical Campus

**Developed by:** Shaik Sameer Hussain  
**Email:** shaiksameerhussain@gmail.com  
**Version:** 1.0.0  
**License:** MIT

## Overview

CollegeGPT is a dual-mode AI assistant that serves both students and faculty at CMR Technical Campus by providing instant answers to institutional queries, accessing uploaded documents, and automating academic workflows using advanced GPT-based responses.

## Features

### 🎓 Student Mode (Public Access)
- **No Login Required** - Instant access to public information
- **Academic Calendar** - Exam dates, schedules, and important events
- **Official Announcements** - Latest circulars and notifications
- **Campus Information** - Facilities, services, and general queries
- **Real-time Updates** - Always current information

### 🔐 Faculty Mode (Authenticated Access)
- **Secure Authentication** - Email OTP verification system
- **Document Management** - Upload and analyze academic documents
- **AI-Powered Analysis** - GPT-based document processing
- **Administrative Tools** - Faculty-specific resources and workflows
- **Collaborative Features** - Secure workspace for faculty members

## Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Framer Motion
- **UI Components:** Radix UI, shadcn/ui
- **Backend:** Next.js API Routes, Node.js
- **Database:** Firebase Firestore
- **Authentication:** Custom OTP system with bcrypt
- **Email Service:** Nodemailer with Gmail SMTP
- **Deployment:** Vercel

## Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/shaiksameerhussain/collegegpt-cmr.git
   cd collegegpt-cmr
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   yarn install
   # or
   bun install
   \`\`\`

3. **Environment Setup:**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   PLATFORM_EMAIL=your-email@gmail.com
   PLATFORM_EMAIL_PASS=your-app-password
   \`\`\`

4. **Firebase Configuration:**
   Update the Firebase config in `lib/firebase.ts` with your project credentials.

5. **Run the development server:**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   \`\`\`

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
collegegpt-cmr/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── auth/          # Authentication endpoints
│   ├── signup/            # Faculty registration page
│   ├── signin/            # Faculty login page
│   ├── faculty-dashboard/ # Faculty dashboard
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── email.ts          # Email service
│   └── otp-store.ts      # OTP management
├── hooks/                # Custom React hooks
└── public/               # Static assets
\`\`\`

## Key Features Implementation

### Authentication System
- **Email OTP Verification** - Secure faculty registration
- **Password Hashing** - bcrypt for secure password storage
- **Session Management** - Persistent login state
- **Input Validation** - Client and server-side validation

### Email Service
- **Professional Templates** - HTML email templates with CMR branding
- **OTP Delivery** - Reliable email delivery system
- **Error Handling** - Comprehensive error management

### User Interface
- **Responsive Design** - Mobile-first approach
- **Professional Styling** - Royal blue and gold CMR branding
- **Smooth Animations** - Framer Motion for enhanced UX
- **Accessibility** - WCAG compliant design

## Deployment

The application is optimized for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployment on push to main branch

## Contributing

This project is developed and maintained by Shaik Sameer Hussain for CMR Technical Campus. For any issues or feature requests, please contact the developer directly.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

**Developer:** Shaik Sameer Hussain  
**Email:** shaiksameerhussain@gmail.com  
**Institution:** CMR Technical Campus  
**Project:** CollegeGPT AI Assistant  

---

© 2024 CollegeGPT - CMR Technical Campus. All rights reserved.
