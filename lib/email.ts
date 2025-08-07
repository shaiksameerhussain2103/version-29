import nodemailer from "nodemailer"

const EMAIL_CONFIG = {
  service: "gmail",
  auth: {
    user: process.env.PLATFORM_EMAIL || "cmr.collegegpt@gmail.com",
    pass: process.env.PLATFORM_EMAIL_PASS || "mfor zyjo alds tayf",
  },
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: EMAIL_CONFIG.service,
      auth: EMAIL_CONFIG.auth,
      secure: false,
      port: 587,
    })
  }
  return transporter
}

export async function sendOtpEmail(email: string, otp: string) {
  const transporter = getTransporter()

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CollegeGPT Verification</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #d97706 100%); padding: 30px; text-align: center; }
            .logo { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #374151; margin-bottom: 20px; }
            .message { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 30px; }
            .otp-container { background: linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-label { font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
            .otp-code { font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
            .disclaimer { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .disclaimer-text { color: #dc2626; font-size: 14px; margin: 0; }
            .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { color: #6b7280; font-size: 14px; margin: 5px 0; }
            .contact { color: #1e40af; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎓</div>
                <h1>CollegeGPT</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">CMR Technical Campus</p>
            </div>
            
            <div class="content">
                <div class="greeting">Dear Faculty Member,</div>
                
                <div class="message">
                    Welcome to CollegeGPT! To complete your faculty registration and secure your account, please use the verification code below:
                </div>
                
                <div class="otp-container">
                    <div class="otp-label">Your Verification Code</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="disclaimer">
                    <p class="disclaimer-text">
                        🔒 <strong>Security Notice:</strong> This verification code is valid for 10 minutes only. Please do not share this code with anyone. If you didn't request this verification, please ignore this email.
                    </p>
                </div>
                
                <div class="message">
                    Once verified, you'll have access to the secure faculty dashboard with AI-powered tools designed specifically for CMR Technical Campus faculty members.
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-text"><strong>CollegeGPT Support Team</strong></div>
                <div class="footer-text">CMR Technical Campus</div>
                <div class="footer-text">
                    <a href="mailto:cmr.collegegpt@gmail.com" class="contact">cmr.collegegpt@gmail.com</a>
                </div>
                <div class="footer-text" style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                    This is an automated message. Please do not reply to this email.
                </div>
            </div>
        </div>
    </body>
    </html>
  `

  const mailOptions = {
    from: `"CollegeGPT - CMR Technical Campus" <${EMAIL_CONFIG.auth.user}>`,
    to: email,
    subject: "🛡️ CollegeGPT Verification Code – CMR Technical Campus",
    html: htmlTemplate,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error }
  }
}
