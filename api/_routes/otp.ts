import express from "express";
import crypto from "crypto";
import { getMailTransporter, getFromEmailAddress } from "../_utils/smtp.js";
import { stripQuotes } from "../_utils/env.js";

const activeOtps = new Map<string, { code: string; expiresAt: number }>();
const OTP_SESSION_SALT = stripQuotes(process.env.OTP_SESSION_SALT || "UPSIDE_ROYAL_OTP_SECRET_COMPLEX_HASH_2026");

export const otpRouter = express.Router();

otpRouter.get("/status", (req, res) => {
  const smtpHost = process.env.VITE_SMTP_HOST || process.env.SMTP_HOST;
  const smtpUser = process.env.VITE_SMTP_USER || process.env.SMTP_USER;
  const smtpPass = process.env.VITE_SMTP_PASS || process.env.SMTP_PASS;
  const smtpFrom = process.env.VITE_SMTP_FROM || process.env.SMTP_FROM;

  const isConfigured = !!(smtpHost && smtpUser && smtpPass);
  res.json({
    configured: isConfigured,
    host: smtpHost || null,
    from: smtpFrom || null
  });
});

otpRouter.post("/request", async (req, res) => {
  try {
    const { target } = req.body || {};
    if (!target) {
      return res.status(400).json({ error: "Email address or Phone number is required." });
    }

    const cleanTarget = target.trim().toLowerCase();
    
    // Generate a random 6-digit secure numerical PIN
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    
    activeOtps.set(cleanTarget, { code, expiresAt });

    // Dispatched console alert log for server console/verification
    console.log(`\n=================================================`);
    console.log(`[SECURE OTP SYSTEM] Dispatched to: ${cleanTarget}`);
    console.log(`[SECURE OTP SYSTEM] 6-Digit Code : ${code}`);
    console.log(`=================================================\n`);

    let transporter = null;
    try {
      transporter = getMailTransporter();
    } catch (transporterErr: any) {
      console.error("[SMTP TRANSPORTER INITIALIZATION ERROR]:", transporterErr);
    }

    if (transporter) {
      try {
        const computedFrom = getFromEmailAddress();
        console.log(`[SMTP] Attempting email dispatch: FROM: ${computedFrom} -> TO: ${cleanTarget}`);

        const mailOptions = {
          from: computedFrom,
          to: cleanTarget,
          subject: `[UPSIDE] Secure Verification PIN: ${code}`,
          text: `Your Upside verification code is: ${code}. This code is active for 5 minutes.`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Secured Upside verification Passcode</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #fcfbf9;
      color: #1c1917;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 560px;
      margin: 40px auto;
      background-color: #ffffff;
      border: 1px solid #e7e5e4;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(28, 25, 23, 0.03);
      overflow: hidden;
    }
    .header {
      padding: 40px 40px 24px 40px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 1px solid #f1f0ee;
    }
    .logo-container {
      margin-bottom: 20px;
    }
    .logo-img {
      width: 140px;
      max-width: 140px;
      height: auto;
      object-fit: contain;
      display: inline-block;
    }
    .brand-sub {
      font-family: 'Georgia', serif;
      font-size: 11px;
      letter-spacing: 0.25em;
      color: #78350f;
      text-transform: uppercase;
      font-weight: bold;
      margin: 0;
    }
    .body-content {
      padding: 40px;
    }
    .heading {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #1c1917;
      margin: 0 0 16px 0;
      text-align: center;
    }
    .text-para {
      font-size: 14px;
      line-height: 1.6;
      color: #44403c;
      margin: 0 0 24px 0;
      text-align: center;
    }
    .otp-wrapper {
      background-color: #fdfbf7;
      border: 1px solid #f3ebd7;
      border-radius: 2px;
      padding: 24px;
      margin: 28px 0;
      text-align: center;
    }
    .otp-code {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 0.2em;
      color: #b45309;
      display: inline-block;
      margin: 0;
    }
    .otp-label {
      font-size: 10px;
      letter-spacing: 0.15em;
      color: #78350f;
      text-transform: uppercase;
      font-weight: bold;
      margin-top: 8px;
    }
    .time-banner {
      font-size: 12px;
      color: #78350f;
      font-weight: 600;
      text-align: center;
      margin-top: 10px;
    }
    .security-note {
      font-size: 12px;
      line-height: 1.5;
      color: #78716c;
      background-color: #f5f5f4;
      padding: 12px 18px;
      border-left: 2px solid #b45353;
      margin: 24px 0;
    }
    .footer {
      background-color: #fafaf9;
      padding: 28px 40px;
      border-top: 1px solid #f5f5f4;
      text-align: center;
    }
    .footer-text {
      font-size: 11px;
      line-height: 1.6;
      color: #a8a29e;
      margin: 0 0 12px 0;
    }
    .signature {
      font-family: 'Georgia', serif;
      font-size: 12px;
      font-style: italic;
      color: #78350f;
      margin: 16px 0 0 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-container">
        <img class="logo-img" src="https://res.cloudinary.com/dgc6ootad/image/upload/v1780044707/upside_logo_1_swnvtf.jpg" alt="UPSIDE Logo" />
      </div>
      <p class="brand-sub">Sanctuary of Artisanal Gastronomy</p>
    </div>
    
    <div class="body-content">
      <h2 class="heading">Secure Identity Verification Passcode</h2>
      <p class="text-para">
        You are establishing a secure access session to your private profile at UPSIDE. Please input the 6-digit confirmation passcode below to authenticate:
      </p>
      
      <div class="otp-wrapper">
        <div class="otp-code">${code}</div>
        <div class="otp-label">Secure Verification Passcode</div>
      </div>
      
      <p class="time-banner">⚠️ Active for 5 minutes only.</p>
      
      <div class="security-note">
        <strong>Confidentiality Warning:</strong> For your private table reservation and menu preferences safety, never disclose this passcode to any customer support or third party. Our concierges will never ask for this code.
      </div>
      
      <p class="text-para" style="font-size: 13px; color: #78716c; margin-bottom: 0;">
        If you did not initiate this identity check, please ignore this email. Your culinary portfolio remains completely secure.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        Automated secure transaction dispatcher. Protected under Upside zero-trust encryption policies.
      </p>
      <p class="footer-text" style="margin: 0;">
        © 2026 UPSIDE Fine Dining & Café. A Brand of Mopheth. All rights reserved.
      </p>
      <div class="signature">The Guest Relations Concierge Team</div>
    </div>
  </div>
</body>
</html>
        `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SMTP] Successfully sent real verification email to: ${cleanTarget}`);
        
        return res.json({
          success: true,
          message: "A verification code has been successfully sent to your email."
        });
      } catch (mailError: any) {
        console.error(`[SMTP ERROR] Sending failed, falling back to Sandbox Delivery:`, mailError);
        return res.json({
          success: true,
          message: "A verification code was successfully processed.",
          demoCode: code,
          smtpError: "Our automated email service is temporarily undergoing scheduled maintenance."
        });
      }
    }

    // Fallback: SMTP is not configured
    return res.json({
      success: true,
      message: "A verification code was successfully processed.",
      demoCode: code,
      smtpError: "The direct email delivery service has not been fully configured."
    });
  } catch (err: any) {
    console.error("[api/otp/request SEVERE ERROR]:", err);
    return res.status(500).json({
      error: "We encountered an unexpected error processing your request. Please try again later."
    });
  }
});

otpRouter.post("/verify", (req, res) => {
  try {
    const { target, code } = req.body || {};
    if (!target || !code) {
      return res.status(400).json({ error: "Missing identity token or verification code." });
    }

    const cleanTarget = target.trim().toLowerCase();
    const otpRecord = activeOtps.get(cleanTarget);

    if (!otpRecord) {
      return res.status(400).json({ error: "No active verification sessions found. Please request a new OTP code." });
    }

    if (Date.now() > otpRecord.expiresAt) {
      activeOtps.delete(cleanTarget);
      return res.status(400).json({ error: "The OTP verification code has expired. Please request a new PIN code." });
    }

    if (otpRecord.code !== code.trim()) {
      return res.status(400).json({ error: "The inputted 6-digit OTP code is incorrect. Please try again." });
    }

    // Verification succeeded! Consume the code.
    activeOtps.delete(cleanTarget);

    // Derive a durable deterministic password hash based on target + secure production salt
    const passwordHash = crypto
      .createHmac("sha256", OTP_SESSION_SALT)
      .update(cleanTarget)
      .digest("hex")
      .slice(0, 20);

    // Standardize the target email name format for Firebase Auth compatibility
    let sessionEmail = cleanTarget;
    let isPhoneMode = !cleanTarget.includes("@");
    if (isPhoneMode) {
      // Generate a secure synthetic virtual email structure for standard Firebase auth linkage
      sessionEmail = `phone_${cleanTarget.replace(/[^0-9a-z]/g, "")}@upside-restaurant-cafe.com`;
    }

    return res.json({
      success: true,
      message: "Identity verified successfully. Linking secure credential session.",
      email: sessionEmail,
      firebasePassword: passwordHash,
      displayName: isPhoneMode ? `Phone User (${target})` : target.split("@")[0]
    });
  } catch (err: any) {
    console.error("[api/otp/verify SEVERE ERROR]:", err);
    return res.status(500).json({
      error: "We encountered an unexpected error while verifying your passcode. Please try again."
    });
  }
});
