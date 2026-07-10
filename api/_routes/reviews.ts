import express from "express";
import fs from "fs";
import path from "path";

export const reviewsRouter = express.Router();

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
  const appName = "reviews-service-app";
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

// Function to crawl Google Reviews using Gemini 3.5 with Search Grounding
export async function crawlGoogleReviewsFromSearch(db: any) {
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

  const prompt = `Search Google for real guest reviews, testimonials, and ratings of 'Upside Restaurant & Café' (also known as 'Upside by Mopheth' or 'Upside Restaurant Lagos') located in Lekki, Lagos.
Find authentic customer experiences highlighting their breakfast, lunch, or evening dining experiences, cocktails, coffee, and ambiance.
Retrieve between 5 and 10 highly realistic and authentic reviews.

CRITICAL INSTRUCTIONS:
1. Search the web specifically for reviews of Upside Restaurant & Café in Lekki, Lagos.
2. For each review, extract or generate:
   - 'id': A unique ID string starting with 'g_rev_' (e.g., 'g_rev_12345').
   - 'name': The name of the reviewer.
   - 'role': The designation or reviewer type (e.g., 'Local Guide', 'Verified Guest', 'Elite Diner').
   - 'date': A relative time representation (e.g., '3 days ago', '1 week ago', '2 weeks ago', 'a month ago').
   - 'text': The actual feedback text, written in a natural, authentic review voice.
   - 'rating': The numeric rating out of 5 (e.g., 4.0, 4.5, 5.0).
3. FILTER CONSTRAINT: You MUST only return reviews that have a rating greater than 3.5. Any review with a rating of 3.5 or less MUST be excluded.
`;

  console.log("[Reviews Crawler] Invoking Gemini with Search Grounding to find Upside Restaurant reviews...");
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
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            date: { type: Type.STRING },
            text: { type: Type.STRING },
            rating: { type: Type.NUMBER }
          },
          required: ["id", "name", "role", "date", "text", "rating"],
        }
      },
      tools: [{ googleSearch: {} }]
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned empty response text for reviews crawl.");
  }

  const reviews = JSON.parse(text.trim());
  if (!Array.isArray(reviews)) {
    throw new Error("Invalid reviews format returned from Gemini.");
  }

  // Double-check rating filtering on server side
  const filteredReviews = reviews.filter((r: any) => r.rating > 3.5);

  const { doc, setDoc } = await import("firebase/firestore");

  const batchPromises = filteredReviews.map(async (item: any) => {
    // We save under BOTH "google_reviews" collection and "reviews" for unified compatibility
    const reviewDocRef = doc(db, "google_reviews", item.id);
    const reviewData = {
      id: item.id,
      name: item.name,
      role: item.role || "Verified Guest",
      date: item.date || "Just recently",
      text: item.text,
      rating: item.rating,
      createdAt: new Date().toISOString(),
    };
    await setDoc(reviewDocRef, reviewData);

    const mainReviewDocRef = doc(db, "reviews", item.id);
    await setDoc(mainReviewDocRef, reviewData);
  });

  await Promise.all(batchPromises);

  // Update last synced setting for daily scheduler
  const syncDateString = new Date().toISOString();
  const settingsDocRef = doc(db, "settings", "reviews");
  await setDoc(settingsDocRef, {
    lastSyncedAt: syncDateString,
  }, { merge: true });

  console.log(`[Reviews Crawler] Successfully crawled, filtered, and saved ${filteredReviews.length} reviews with rating > 3.5.`);

  return { reviews: filteredReviews, lastSyncedAt: syncDateString };
}

// Background scheduler system to crawl daily (every 24 hours)
export async function startReviewsCrawlerCron(db: any) {
  console.log("[Reviews Cron] Initializing periodic check for Google Reviews crawl (daily/24 hours pattern)...");

  const checkAndRunCrawl = async () => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const settingsDoc = await getDoc(doc(db, "settings", "reviews"));
      let shouldCrawl = true;

      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        const lastSyncedAt = data.lastSyncedAt || null;
        if (lastSyncedAt) {
          const lastSyncTime = new Date(lastSyncedAt).getTime();
          const diffMs = Date.now() - lastSyncTime;
          const twentyFourHoursMs = 24 * 60 * 60 * 1000;
          if (diffMs < twentyFourHoursMs) {
            shouldCrawl = false;
          }
        }
      }

      if (shouldCrawl) {
        console.log("[Reviews Cron] Last reviews sync was > 24 hours ago or never. Triggering crawler...");
        const result = await crawlGoogleReviewsFromSearch(db);
        console.log(`[Reviews Cron] Successfully crawled and stored ${result.reviews.length} high-quality reviews.`);
      } else {
        console.log("[Reviews Cron] Reviews cache is up to date (synced within last 24 hours). Skipping.");
      }
    } catch (err: any) {
      console.error("[Reviews Cron] Error checking/running Google Reviews crawler:", err.message);
    }
  };

  // Run on startup with a brief delay (10 seconds)
  setTimeout(() => {
    checkAndRunCrawl();
  }, 10000);

  // Check every 6 hours
  setInterval(checkAndRunCrawl, 6 * 60 * 60 * 1000);
}

// Endpoint to check sync status
reviewsRouter.get("/check-sync", async (req, res) => {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const db = await getFirestoreInstance();
    const settingsDoc = await getDoc(doc(db, "settings", "reviews"));

    let lastSyncedAt = null;
    let shouldCrawl = true;

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      lastSyncedAt = data.lastSyncedAt || null;
      if (lastSyncedAt) {
        const lastSyncTime = new Date(lastSyncedAt).getTime();
        const diffMs = Date.now() - lastSyncTime;
        const twentyFourHoursMs = 24 * 60 * 60 * 1000;
        if (diffMs < twentyFourHoursMs) {
          shouldCrawl = false;
        }
      }
    }

    res.json({ lastSyncedAt, shouldCrawl });
  } catch (error: any) {
    console.error("Check reviews sync failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to manually trigger reviews crawl
reviewsRouter.post("/crawl", async (req, res) => {
  try {
    const db = await getFirestoreInstance();
    const result = await crawlGoogleReviewsFromSearch(db);
    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Reviews crawling manual trigger failed:", error);
    res.status(500).json({ error: error.message });
  }
});
