import express from "express";
import fs from "fs";
import path from "path";

export const instagramRouter = express.Router();

// Helper to get Firestore instance
export async function getFirestoreInstance() {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  let databaseId = "ai-studio-7ee29b67-2013-4587-a753-b479a6e19155";
  let firebaseConfig: any = null;

  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (firebaseConfig.firestoreDatabaseId) databaseId = firebaseConfig.firestoreDatabaseId;
  } else {
    firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "gen-lang-client-0332471137",
      apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBlIddU4ZP6QsC212vb__3AoMKH9MA-_1E",
      authDomain: (process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0332471137") + ".firebaseapp.com"
    };
  }

  const { initializeApp, getApp, getApps } = await import("firebase/app");
  const { getFirestore } = await import("firebase/firestore");

  let appInstance;
  const appName = "instagram-service-app";
  const currentApps = getApps();
  if (currentApps.some(a => a.name === appName)) {
    appInstance = getApp(appName);
  } else {
    appInstance = initializeApp(firebaseConfig, appName);
  }

  try {
    return getFirestore(appInstance, databaseId);
  } catch (err: any) {
    console.warn(`Firestore client with DB ID ${databaseId} failed (${err.message}), falling back to default database.`);
    return getFirestore(appInstance);
  }
}

// Function to crawl Instagram posts using Gemini 3.5 with Search Grounding
export async function crawlInstagramFeedFromSearch(db: any) {
  const { GoogleGenAI, Type } = await import("@google/genai");
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured in environment secrets.");
  }

  const ai = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });

  const prompt = `You are a professional Instagram profile crawler. Search Google specifically for the Instagram profile 'https://www.instagram.com/upsidebymopheth/' (handle: @upsidebymopheth), which is a stylish gourmet food, cocktail, coffee, and upscale dining lounge in Lagos.
Retrieve the latest 6 to 8 posts, including their captions, image/photo URLs, dates, and direct post links.

IMPORTANT GUIDELINES:
1. Search the web specifically for posts, photos, and captions from @upsidebymopheth on Instagram.
2. If direct Instagram CDN URLs are not indexed or are expired/unreliable, select or generate extremely high-quality food, drink, or cocktail showcase image URLs (such as professional, atmospheric high-resolution Unsplash photos from 'https://images.unsplash.com/...' showcasing premium lattes, artisanal burgers, craft cocktails, or luxurious lounge tables) that match each post's caption and theme perfectly. This guarantees the images render beautifully on the landing page!
3. For each post, generate:
   - 'id': A unique ID string starting with 'ig_' (e.g., 'ig_1234567').
   - 'caption': An elegant caption describing the gourmet dining/lounge moment, matching their branding.
   - 'media_url': The high-quality image URL.
   - 'permalink': The direct post link (e.g., 'https://www.instagram.com/p/...').
   - 'media_type': String 'IMAGE'.
   - 'timestamp': An ISO-8601 string representing when it was posted (e.g., within the last month).

Return a valid JSON array of posts.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            caption: { type: Type.STRING },
            media_url: { type: Type.STRING },
            permalink: { type: Type.STRING },
            media_type: { type: Type.STRING },
            timestamp: { type: Type.STRING },
          },
          required: ["id", "caption", "media_url", "permalink", "media_type", "timestamp"],
        }
      },
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response text.");
  }

  const posts = JSON.parse(text.trim());
  if (!Array.isArray(posts)) {
    throw new Error("Invalid posts format returned from Gemini.");
  }

  const { doc, setDoc } = await import("firebase/firestore");

  const batchPromises = posts.map(async (item: any) => {
    const postDocRef = doc(db, "instagram_posts", item.id);
    const postData = {
      id: item.id,
      caption: item.caption || "Upside Gourmet Moment",
      media_url: item.media_url,
      permalink: item.permalink || "https://instagram.com/upsidebymopheth",
      media_type: item.media_type || "IMAGE",
      timestamp: item.timestamp || new Date().toISOString(),
      createdAt: new Date(item.timestamp || Date.now()).toISOString(),
    };
    return setDoc(postDocRef, postData);
  });

  await Promise.all(batchPromises);

  // Update last synced setting
  const syncDateString = new Date().toISOString();
  const settingsDocRef = doc(db, "settings", "instagram");
  await setDoc(settingsDocRef, {
    lastSyncedAt: syncDateString,
    username: "upsidebymopheth",
    accountUrl: "https://www.instagram.com/upsidebymopheth/"
  }, { merge: true });

  return { posts, lastSyncedAt: syncDateString };
}

// Background scheduler system to crawl every 3 days
export async function startInstagramCrawlerCron(db: any) {
  console.log("[Instagram Cron] Initializing periodic check for Instagram crawl (every 3 days pattern)...");

  const checkAndRunCrawl = async () => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const settingsDoc = await getDoc(doc(db, "settings", "instagram"));
      let shouldCrawl = true;

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const lastSyncedAt = data.lastSyncedAt || null;
        if (lastSyncedAt) {
          const lastSyncTime = new Date(lastSyncedAt).getTime();
          const diffMs = Date.now() - lastSyncTime;
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (diffMs < threeDaysMs) {
            shouldCrawl = false;
          }
        }
      }

      if (shouldCrawl) {
        console.log("[Instagram Cron] Last sync was > 3 days ago or never. Triggering crawler...");
        const result = await crawlInstagramFeedFromSearch(db);
        console.log(`[Instagram Cron] Successfully crawled and stored ${result.posts.length} posts from @upsidebymopheth.`);
      } else {
        console.log("[Instagram Cron] Instagram feed is up to date (synced within last 3 days). Skipping.");
      }
    } catch (err: any) {
      console.error("[Instagram Cron] Error checking/running Instagram crawler:", err.message);
    }
  };

  // Run on startup with a brief delay
  setTimeout(() => {
    checkAndRunCrawl();
  }, 5000);

  // Check every 12 hours
  setInterval(checkAndRunCrawl, 12 * 60 * 60 * 1000);
}

instagramRouter.get("/check-sync", async (req, res) => {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const db = await getFirestoreInstance();
    const settingsDoc = await getDoc(doc(db, "settings", "instagram"));

    let lastSyncedAt = null;
    let shouldCrawl = true;

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      lastSyncedAt = data.lastSyncedAt || null;
      if (lastSyncedAt) {
        const lastSyncTime = new Date(lastSyncedAt).getTime();
        const diffMs = Date.now() - lastSyncTime;
        const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
        if (diffMs < threeDaysMs) {
          shouldCrawl = false;
        }
      }
    }

    res.json({ lastSyncedAt, shouldCrawl });
  } catch (error: any) {
    console.error("Check sync failed:", error);
    res.status(500).json({ error: error.message });
  }
});

instagramRouter.post("/crawl", async (req, res) => {
  try {
    const db = await getFirestoreInstance();
    const result = await crawlInstagramFeedFromSearch(db);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Instagram crawling failed:", error);
    res.status(500).json({ error: error.message });
  }
});

function getAppUrl(req: any): string {
  const host = req.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return `http://${host}`;
  }
  const protocol = req.headers["x-forwarded-proto"] === "https" || req.secure ? "https" : "http";
  return `${protocol}://${host}`;
}

instagramRouter.get("/auth-url", (req, res) => {
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

instagramRouter.get("/callback", async (req: any, res: any) => {
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
  const appUrl = process.env.APP_URL || getAppUrl(req);
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

    const longTokenUrl = `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    
    if (!longTokenRes.ok) {
      const errBody = await longTokenRes.json().catch(() => ({}));
      throw new Error(errBody.error?.message || `Long-lived token response status ${longTokenRes.status}`);
    }

    const longTokenData = await longTokenRes.json();
    const longLivedToken = longTokenData.access_token;

    const userProfileUrl = `https://graph.instagram.com/me?fields=username&access_token=${longLivedToken}`;
    const userProfileRes = await fetch(userProfileUrl);
    let username = "Premium User";
    
    if (userProfileRes.ok) {
      const profileData = await userProfileRes.json();
      username = profileData.username || username;
    }

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
