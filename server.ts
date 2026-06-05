import express from "express";
import path from "path";
import dotenv from "dotenv";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Diagnostic route to check env vars
app.get("/api/debug-env", (req, res) => {
  const safeEnv: Record<string, string> = {};
  for (const key of Object.keys(process.env)) {
    const val = process.env[key] || "";
    if (key.match(/firebase|google|gcloud|cred|key|secret/i)) {
      safeEnv[key] = val.substring(0, 10) + "... (len: " + val.length + ")";
    } else {
      safeEnv[key] = "Present (len: " + val.length + ")";
    }
  }
  res.json({ keys: Object.keys(process.env), safeEnv });
});

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

// ==========================================
// SECURE OPAY GATEWAY DISCOVERY SYSTEM
// ==========================================

let dbAdmin: any = null;
try {
  let projectId = "gen-lang-client-0332471137";
  let databaseId = "";
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (config.projectId) {
      projectId = config.projectId;
    }
    if (config.firestoreDatabaseId) {
      databaseId = config.firestoreDatabaseId;
    }
  }

  let appInstance: any;
  try {
    appInstance = admin.apps.length === 0 
      ? admin.initializeApp({
          projectId: projectId,
          credential: admin.credential.applicationDefault()
        })
      : admin.apps[0];
  } catch (credErr) {
    console.warn("[FIREBASE ADMIN] applicationDefault() credentials failed, falling back to basic initialization...", credErr);
    appInstance = admin.apps.length === 0 
      ? admin.initializeApp({
          projectId: projectId
        })
      : admin.apps[0];
  }

  if (databaseId) {
    dbAdmin = getFirestore(appInstance, databaseId);
  } else {
    dbAdmin = appInstance.firestore();
  }
  console.log("[FIREBASE ADMIN] App initialized successfully for project:", projectId, "database:", databaseId || "default");
} catch (firebaseErr) {
  console.error("[FIREBASE ADMIN] Initialization failed:", firebaseErr);
}

// Helper to retrieve OPay configurations from either env variables or local filesystem backup
function loadOpaySettingsLocal() {
  // 1. Try environment variables
  if (process.env.OPAY_MERCHANT_ID && process.env.OPAY_PUBLIC_KEY && process.env.OPAY_SECRET_KEY) {
    return {
      merchantId: process.env.OPAY_MERCHANT_ID,
      publicKey: process.env.OPAY_PUBLIC_KEY,
      secretKey: process.env.OPAY_SECRET_KEY,
      environment: process.env.OPAY_ENVIRONMENT || "sandbox"
    };
  }

  // 2. Try disk cache file
  const localPath = path.join(process.cwd(), "opay-settings-local.json");
  if (fs.existsSync(localPath)) {
    try {
      const data = fs.readFileSync(localPath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.error("[OPAY] Error reading disk credentials backup:", e);
    }
  }

  return null;
}

// 0. Cache OPay credentials locally on server-disk to circumvent Cloud Run Firestore permission deniability
app.post("/api/opay/save-settings", (req: any, res: any) => {
  try {
    const { merchantId, publicKey, secretKey, environment } = req.body;
    if (!merchantId || !publicKey || !secretKey) {
      return res.status(400).json({ error: "All credentials components are required." });
    }

    const oSettings = { merchantId, publicKey, secretKey, environment: environment || "sandbox" };
    const localPath = path.join(process.cwd(), "opay-settings-local.json");
    fs.writeFileSync(localPath, JSON.stringify(oSettings, null, 2), "utf-8");
    console.log(`[OPAY SECURE CACHE] Successfully cached credentials in local backup at ${localPath}`);
    res.json({ success: true, message: "Settings synced and backup created locally." });
  } catch (err: any) {
    console.error("[OPAY SECURE CACHE] Local credentials sync failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// 1. Create OPay cashier checkout payment instance
app.post("/api/opay/create-payment", async (req: any, res: any) => {
  try {
    const { amount, customerName, email, phone, reference, type, address, items, userId } = req.body;
    if (!amount || !customerName || !phone || !reference) {
      return res.status(400).json({ error: "Missing required booking payment parameters (amount, guest details, reference required)." });
    }

    // Try loading secure OPay credentials from either environment, local backup file or Firestore db fallback
    let opaySettings = loadOpaySettingsLocal();
    
    if (!opaySettings && dbAdmin) {
      try {
        console.log("[OPAY GATEWAY] Loading credentials from Firestore as fallback...");
        const opaySnap = await dbAdmin.collection("settings").doc("opay").get();
        if (opaySnap.exists) {
          opaySettings = opaySnap.data() || {};
        }
      } catch (dbErr) {
        console.warn("[OPAY GATEWAY] Credentials fallback database load failed:", dbErr);
      }
    }

    if (!opaySettings || !opaySettings.merchantId || !opaySettings.publicKey || !opaySettings.secretKey) {
      return res.status(400).json({ error: "OPay gateway configuration is missing. Please save standard OPay credentials in your Admin Dashboard tab first." });
    }

    const { merchantId, publicKey, secretKey, environment } = opaySettings;

    // Determine target checkout gateway environments
    const isSandbox = environment !== "production";
    const opayBaseUrl = isSandbox
      ? "https://sandbox-api.opaycheckout.com/api/v1/international/cashier/create"
      : "https://api.opaycheckout.com/api/v1/international/cashier/create";

    // Value representing local currency lowest subunit (Kobo representation)
    const koboValue = Math.round(amount * 100).toString();

    // Absolute host resolution for callback urls
    const hostUrl = getAppUrl(req);
    const returnUrl = `${hostUrl}/?opay_ref=${reference}`;
    const callbackUrl = `${hostUrl}/api/opay/callback`;

    // Construct request body structure conforming strictly to Cashier API standards
    const reqBody = {
      amount: {
        currency: "NGN",
        value: koboValue
      },
      merchantId: merchantId,
      publicKey: publicKey,
      reference: reference,
      returnUrl: returnUrl,
      callbackUrl: callbackUrl,
      productName: "Upside Culinary Banquet",
      productDesc: `Upside gourmet dining checkout. Items: ${items ? items.length : 0}`,
      userPhone: phone,
      userEmail: email || "guest@example.com",
      userClientIP: req.ip || "127.0.0.1",
      expireAt: 30
    };

    // Construct signature string from JSON representation hashed via secretKey salt
    const stringToSign = JSON.stringify(reqBody);
    const signature = crypto
      .createHmac("sha512", secretKey)
      .update(stringToSign)
      .digest("hex");

    console.log("[OPAY GATEWAY] Initializing checkout payload:", {
      reference,
      isSandbox,
      returnUrl,
      callbackUrl
    });

    const response = await fetch(opayBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${signature}`,
        "MerchantId": merchantId
      },
      body: stringToSign
    });

    const responseText = await response.text();
    let opayRes;
    try {
      opayRes = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        error: "Non-JSON error response from OPay cashier server.",
        details: responseText
      });
    }

    console.log("[OPAY GATEWAY] Payment response details:", opayRes);

    if (opayRes.code === "00000" && opayRes.data && opayRes.data.cashierUrl) {
      // Save deep copy of order queue and persist it securely to Firestore before route redirection
      try {
        await dbAdmin.collection("orders").doc(reference).set({
          id: reference,
          userId: userId || "guest",
          customerName: customerName,
          email: email || "guest@example.com",
          phone: phone,
          totalPrice: amount,
          items: items || [],
          address: address || "Boutique Self-Pickup",
          status: "Prepping",
          timestamp: Date.now(),
          type: type || "delivery",
          paymentStatus: "Pending (OPay)",
          opayOrderId: opayRes.data.orderId || null,
          gatewayEnv: isSandbox ? "sandbox" : "production"
        });
        console.log(`[OPAY GATEWAY] Logged pending order reference: ${reference}`);
      } catch (dbSaveErr) {
        console.error("[OPAY GATEWAY] Failed to store pending reference in DB:", dbSaveErr);
      }

      return res.json({
        success: true,
        cashierUrl: opayRes.data.cashierUrl,
        reference: reference,
        orderId: opayRes.data.orderId
      });
    } else {
      return res.status(400).json({
        error: opayRes.message || "OPay system failed to generate checkout token.",
        details: opayRes
      });
    }
  } catch (error: any) {
    console.error("[OPAY GATEWAY] Payment checkout block failed:", error);
    res.status(500).json({ error: error.message || "Internal network failure contact gateway." });
  }
});

// 2. OPay Callback webhooks handler
app.post("/api/opay/callback", async (req: any, res: any) => {
  try {
    console.log("[OPAY CALLBACK] Webhook received successfully:", req.body);
    const { reference, orderStatus } = req.body;
    if (reference && orderStatus === "SUCCESS" && dbAdmin) {
      try {
        await dbAdmin.collection("orders").doc(reference).update({
          paymentStatus: "Paid (OPay)",
          status: "Prepping",
          updatedAt: new Date().toISOString()
        });
        console.log(`[OPAY CALLBACK] Reference: ${reference} state auto-updated to PAID.`);
      } catch (dbErr: any) {
        console.warn("[OPAY CALLBACK] Firestore webhook write notice (will delegate to client-side callback page flow):", dbErr.message || dbErr);
      }
    }
    res.json({ code: "00000", message: "SUCCESS" });
  } catch (err: any) {
    console.error("[OPAY CALLBACK] Error parsing webhook detail:", err);
    res.json({ code: "00000", message: "SUCCESS" }); // Always return success acknowledgement to the OPay dispatch engine
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
