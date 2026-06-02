import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Create email transporter dynamically based on configured environment variables
function getMailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

// Generate the fully valid header "from" address
function getFromEmailAddress(): string {
  let rawFrom = process.env.SMTP_FROM || "";
  let rawUser = process.env.SMTP_USER || "";
  const rawHost = (process.env.SMTP_HOST || "").toLowerCase();

  // Helper to strip any leading or trailing single/double quotes from secrets config
  const stripQuotes = (str: string) => {
    let s = str.trim();
    while ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.substring(1, s.length - 1).trim();
    }
    return s;
  };

  rawFrom = stripQuotes(rawFrom);
  rawUser = stripQuotes(rawUser);

  // Simple email matcher
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  // Validate rawFrom
  if (rawFrom && emailRegex.test(rawFrom)) {
    // If it has a clean pattern with no < >, wrap it properly
    if (!rawFrom.includes("<") && !rawFrom.includes(">")) {
      return `"Upside Fine Dining" <${rawFrom}>`;
    }
    return rawFrom;
  }

  // Validate SMTP_USER if it is a valid email
  if (rawUser && emailRegex.test(rawUser)) {
    return `"Upside Fine Dining" <${rawUser}>`;
  }

  // If using Resend SMTP and no valid custom verified SMTP_FROM is specified,
  // we must fallback to the official "onboarding@resend.dev" address, as Resend
  // blocks all unverified custom domains.
  if (rawHost.includes("resend")) {
    return `"Upside Fine Dining" <onboarding@resend.dev>`;
  }

  // Pure generic fallback that meets standard syntactical formatting requirements
  return `"Upside Fine Dining" <noreply@upside-restaurant-cafe.com>`;
}

// In-memory registry for highly secure simulated 6-digit OTP codes
const activeOtps = new Map<string, { code: string; expiresAt: number }>();
const OTP_SESSION_SALT = process.env.OTP_SESSION_SALT || "UPSIDE_ROYAL_OTP_SECRET_COMPLEX_HASH_2026";

// Dynamic routing controller to detect preferred domains
function getAppUrl(req: any): string {
  const host = req.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `http://${host}`;
  }
  // The live site custom domain requested by the user
  return "https://upside-restaurant-cafe.com";
}

// REST endpoints for OTP dispatch
app.get("/api/otp/status", (req, res) => {
  const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  res.json({
    configured: isConfigured,
    host: process.env.SMTP_HOST || null,
    from: process.env.SMTP_FROM || null
  });
});

app.post("/api/otp/request", async (req, res) => {
  const { target } = req.body;
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

  const transporter = getMailTransporter();
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
        message: "Verification code sent to your email!"
      });
    } catch (mailError: any) {
      console.error(`[SMTP ERROR] Sending failed:`, mailError);
      return res.status(400).json({ 
        error: `Failed to send email: ${mailError?.message || "Unknown SMTP transport error"}`
      });
    }
  }

  // Fallback: SMTP is not configured
  res.json({
    success: true,
    message: "Verification code sent! (Sandbox Mode)",
    demoCode: code
  });
});

app.post("/api/otp/verify", (req, res) => {
  const { target, code } = req.body;
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

  res.json({
    success: true,
    message: "Identity verified successfully. Linking secure credential session.",
    email: sessionEmail,
    firebasePassword: passwordHash,
    displayName: isPhoneMode ? `Phone User (${target})` : target.split("@")[0]
  });
});

// API Endpoints for Instagram
app.get("/api/instagram/auth-url", (req, res) => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID || "";
  const appUrl = getAppUrl(req);
  const redirectUri = `${appUrl}/api/instagram/callback`;

  if (!clientId) {
    return res.status(400).json({ 
      error: "INSTAGRAM_CLIENT_ID is not configured in the server environment secrets." 
    });
  }

  const scope = "user_profile,user_media";
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`;
  
  res.json({ url: authUrl, redirectUri });
});

app.get("/api/instagram/callback", async (req: any, res: any) => {
  const { code, error, error_reason, error_description } = req.query;

  if (error || !code) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Instagram Authorization Failed</title>
        <style>
          body {
            background-color: #0c0a09;
            color: #f5f5f4;
            font-family: ui-sans-serif, system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background-color: #1c1917;
            border: 1px solid #444;
            padding: 32px;
            max-width: 450px;
            text-align: center;
          }
          h1 { color: #ef4444; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
          button {
            background-color: #ef4444;
            color: #fff;
            border: none;
            padding: 10px 20px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.1em;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Authorization Canceled or Failed</h1>
          <p>${error_description || error_reason || "You declined permissions or the Instagram API encountered an issue."}</p>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `);
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || "";
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || "";
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/instagram/callback`;

  if (!clientId || !clientSecret) {
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Configuration Required</title>
        <style>
          body { background-color: #0c0a09; color: #f5f5f4; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #1c1917; border: 1px solid #444; padding: 32px; max-width: 450px; text-align: center; }
          h1 { color: #f59e0b; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Keys Not Found</h1>
          <p>Please add INSTAGRAM_CLIENT_ID and INSTAGRAM_CLIENT_SECRET to the environment variables in your AI Studio panel to support token exchanges.</p>
          <button onclick="window.close()" style="background-color: #d97706; color: white; border: none; padding: 10px 20px; font-size: 11px; text-transform: uppercase; font-weight: bold; cursor: pointer; margin-top: 20px;">Dismiss</button>
        </div>
      </body>
      </html>
    `);
  }

  try {
    // 2. Exchange short-lived token
    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", clientId);
    tokenForm.append("client_secret", clientSecret);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", redirectUri);
    tokenForm.append("code", String(code));

    const shortTokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: tokenForm,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    if (!shortTokenRes.ok) {
      const errBody = await shortTokenRes.json().catch(() => ({}));
      throw new Error(errBody.error_message || `Short-lived token response status ${shortTokenRes.status}`);
    }

    const shortTokenData = await shortTokenRes.json();
    const shortLivedToken = shortTokenData.access_token;
    const userId = shortTokenData.user_id;

    // 3. Exchange for long-lived access token
    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    
    if (!longTokenRes.ok) {
      const errBody = await longTokenRes.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Long-lived token response status ${longTokenRes.status}`);
    }

    const longTokenData = await longTokenRes.json();
    const longLivedToken = longTokenData.access_token;

    // 4. Fetch the Instagram user details
    const userProfileUrl = `https://graph.instagram.com/me?fields=username&access_token=${longLivedToken}`;
    const userProfileRes = await fetch(userProfileUrl);
    let username = "Premium User";
    
    if (userProfileRes.ok) {
      const profileData = await userProfileRes.json();
      username = profileData.username || username;
    }

    // 5. Send postMessage success notification to the administrator dashboard
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Success!</title>
        <style>
          body {
            background-color: #0c0a09;
            color: #f5f5f4;
            font-family: ui-sans-serif, system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .spinner {
            border: 3px solid rgba(255,191,0,0.1);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border-left-color: #d97706;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { color: #f59e0b; font-size: 20px; font-weight: 300; margin: 0 0 8px 0; letter-spacing: 0.05em; }
          p { color: #a8a29e; font-size: 12px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h1>Instagram Connected</h1>
        <p>Syncing details with your administrator workspace...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: "INSTAGRAM_AUTH_SUCCESS",
              accessToken: "${longLivedToken}",
              username: "${username}"
            }, "*");
            setTimeout(() => {
              window.close();
            }, 1000);
          } else {
            document.querySelector('p').innerText = "Authorization successful. You can close this tab now.";
          }
        </script>
      </body>
      </html>
    `);

  } catch (error: any) {
    console.error("AccessToken exchange failure:", error);
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Token Exchange Failed</title>
        <style>
          body { background-color: #0c0a09; color: #f5f5f4; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background-color: #1c1917; border: 1px solid #444; padding: 32px; max-width: 450px; text-align: center; }
          h1 { color: #ef4444; font-size: 20px; margin-top: 0; }
          p { color: #a8a29e; font-size: 13px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Token Handshake Failed</h1>
          <p>${error?.message || "An error occurred while securing your authorization tokens from Facebook."}</p>
          <button onclick="window.close()" style="background-color: #ef4444; color: white; border: none; padding: 10px 20px; font-size: 11px; text-transform: uppercase; font-weight: bold; cursor: pointer; margin-top: 20px;">Dismiss</button>
        </div>
      </body>
      </html>
    `);
  }
});

// Serve frontend assets
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server executing on http://0.0.0.0:${PORT}`);
  });
}

serveApp();
