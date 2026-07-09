import express from "express";
import { GoogleGenAI } from "@google/genai";
import { querySql } from "../_utils/mysqlDb.js";

export const chatbotRouter = express.Router();

// Fallback static data if MySQL is not configured or empty
const STATIC_CATEGORIES = [
  { id: "starters", name: "Starters", description: "Appetizers and quick bites" },
  { id: "main-dishes", name: "Main Dishes", description: "Hearty, filling main courses" },
  { id: "drinks", name: "Drinks", description: "Chilled drinks and beverages" }
];

const STATIC_MENU_ITEMS = [
  { id: "jof-rice", name: "Jollof Rice Special", description: "Smoky party-style Jollof rice with fried plantain and savory beef", price: 3500, category: "main-dishes" },
  { id: "pepper-soup", name: "Goat Meat Pepper Soup", description: "Traditional spicy, aromatic goat meat broth loaded with herbs", price: 2800, category: "starters" },
  { id: "chapman", name: "Classic Chapman", description: "Signature Nigerian mocktail with Angostura bitters, Fanta, Sprite and cucumber garnish", price: 1500, category: "drinks" }
];

const STATIC_SHIPPING_AREAS = [
  { id: "vi", name: "Victoria Island", fee: 2000 },
  { id: "lekki-1", name: "Lekki Phase 1", fee: 2000 },
  { id: "ikeja", name: "Ikeja", fee: 3500 },
  { id: "surulere", name: "Surulere", fee: 3000 }
];

let aiClient: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not configured in the Settings > Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// Helper to race a promise with a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout"));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Thread-safe in-memory cache for database queries to prevent adding 1.2s roundtrip latency on every message
interface DbCache {
  categories: any[];
  menuItems: any[];
  shippingAreas: any[];
  lastFetched: number;
}

const dbCache: DbCache = {
  categories: STATIC_CATEGORIES,
  menuItems: STATIC_MENU_ITEMS,
  shippingAreas: STATIC_SHIPPING_AREAS,
  lastFetched: 0
};

let isFetching = false;

async function refreshDbCache(): Promise<void> {
  if (isFetching) return;
  isFetching = true;
  try {
    const [dbCategoriesRes, dbMenusRes, dbShippingRes] = await Promise.allSettled([
      withTimeout(querySql("SELECT id, name, description FROM categories WHERE deleted = 0 OR deleted IS NULL"), 2000),
      withTimeout(querySql("SELECT id, name, description, price, category, available FROM menus WHERE deleted = 0 OR deleted IS NULL"), 2000),
      withTimeout(querySql("SELECT id, name, fee FROM shipping_areas WHERE deleted = 0 OR deleted IS NULL"), 2000)
    ]);

    if (dbCategoriesRes.status === "fulfilled" && dbCategoriesRes.value && dbCategoriesRes.value.length > 0) {
      dbCache.categories = dbCategoriesRes.value;
    }
    if (dbMenusRes.status === "fulfilled" && dbMenusRes.value && dbMenusRes.value.length > 0) {
      dbCache.menuItems = dbMenusRes.value;
    }
    if (dbShippingRes.status === "fulfilled" && dbShippingRes.value && dbShippingRes.value.length > 0) {
      dbCache.shippingAreas = dbShippingRes.value;
    }
    dbCache.lastFetched = Date.now();
    console.log("[CHATBOT CACHE] Successfully updated database cache. Items:", dbCache.menuItems.length);
  } catch (err) {
    console.warn("[CHATBOT CACHE] Error updating cache:", err);
  } finally {
    isFetching = false;
  }
}

chatbotRouter.post("/", async (req: any, res: any) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing required 'message' parameter." });
    }

    // Determine cache status and fetch if needed
    const now = Date.now();
    const cacheAge = now - dbCache.lastFetched;

    if (dbCache.lastFetched === 0) {
      // Blocking fetch on first-time boot with tight timeout to avoid waiting too long
      console.log("[CHATBOT] Initializing database cache on first request...");
      await refreshDbCache();
    } else if (cacheAge > 120000) { // 2 minutes cache TTL
      // Background non-blocking refresh if cache is stale
      console.log("[CHATBOT] Database cache is stale. Triggering background refresh...");
      refreshDbCache().catch((err) => console.error("Error in background cache refresh:", err));
    }

    // Format database arrays into compact, token-minimized lists to save prompt size & speed up Gemini processing
    const formattedCategories = dbCache.categories
      .map((c: any) => `- ${c.name} (id: ${c.id})`)
      .join("\n");

    const formattedMenuItems = dbCache.menuItems
      .map((item: any) => `- ${item.name} | Price: ₦${item.price} | Category: ${item.category} | Available: ${item.available ? "Yes" : "No"} | Description: ${item.description || "N/A"}`)
      .join("\n");

    const formattedShipping = dbCache.shippingAreas
      .map((a: any) => `- ${a.name} | Delivery Fee: ₦${a.fee}`)
      .join("\n");

    // 2. Prepare System Instructions with real-time context
    const systemInstruction = `You are "Upside Smart Assistant" — a highly intelligent, warm, polite, and fully automated AI chatbot for Upside Restaurant & Café.

Your job is to assist users with:
1. Our current menus, descriptions, prices, and food availability.
2. Our delivery coverage and prices across Lagos.
3. Simple reservation inquiries, working hours, and general helpdesk support.

=== RESTAURANT DATABASE ===
CATEGORIES:
${formattedCategories}

MENU ITEMS:
${formattedMenuItems}

DELIVERY COVERAGE AREAS & FEES:
${formattedShipping}

=== KEY RULES ===
- ALWAYS check item prices and availability in Lagos Naira (₦) from the database above before answering.
- Be extremely polite, welcoming, and concise. Don't invent food items that aren't listed in the database.
- If a user inquires about an item or area that is not listed, suggest checking our menu page or contacting live staff.
- Keep answers formatted in clean, highly readable Markdown (using bold, lists, and spacing) but keep explanations compact and easy to scan.
- Our physical address: "Upside Restaurant & Café, Victoria Island, Lagos, Nigeria".
- Opening hours: 8:00 AM - 11:00 PM daily.

=== DIRECT ADD-TO-CART ORDERING RULE ===
Our chatbot interface contains an automatic item matching system. When you recommend, mention, or describe menu items, you MUST write the EXACT name of the item from our MENU ITEMS database in **bold** (for example: "**Beef Burger**", "**Classic Mopheth Burger**", "**Southern-Style Coleslaw Burger**", "**Smoky Party Jollof Rice**", etc.). 
Doing this will automatically generate a native, clickable "🛒 Add [Item Name] to Cart" button directly below your reply inside the user's chat panel! 
Always encourage users to order directly by stating they can click the custom Add-to-Cart button that appears right below your response to place their order instantly!`;

    // 3. Setup Gemini Chat with History
    const ai = getGemini();

    // Map history to the format expected by the @google/genai SDK
    // SDK expects: { role: "user" | "model", parts: [{ text: string }] }
    const formattedHistory = Array.isArray(history)
      ? history.map((item: any) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.text || item.content || "" }]
        }))
      : [];

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7
      },
      history: formattedHistory
    });

    // 4. Send message to model
    const response = await chat.sendMessage({ message });
    const replyText = response.text || "I'm having trouble retrieving details right now. Please try again.";

    return res.json({ reply: replyText });

  } catch (err: any) {
    console.error("Chatbot generation error:", err);
    return res.status(500).json({
      error: "AI Chatbot Service is currently offline or unconfigured.",
      details: err.message
    });
  }
});
