import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from "firebase/app-check";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// State to keep track of App Check instance
export let appCheck: any = null;

// Initialize App Check if in browser environment
if (typeof window !== "undefined") {
  try {
    const isDev = window.location.hostname === "localhost" || 
                  window.location.hostname === "127.0.0.1" || 
                  window.location.hostname.includes("ais-dev-") ||
                  window.location.hostname.includes("ais-pre-");
    
    // In local dev/sandbox, configure App Check debug token prior to initialization
    if (isDev) {
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    // Use default reCAPTCHA v3 sitekey. The customer can configure a custom one in import.meta.env if needed.
    const customSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY;
    const siteKey = customSiteKey || "6LeaPCYtAAAAAEJFosfUOWKgLL0g89O_AjWKyqys";

    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("[Firebase App Check] Initialized successfully with siteKey:", siteKey);
  } catch (err) {
    console.error("[Firebase App Check] Initialization failed:", err);
  }
}

// Helper to retrieve the current token on demand
export async function getAppCheckToken(): Promise<string | null> {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch (err) {
    console.warn("[App Check] Error getting token:", err);
    return null;
  }
}

// Global fetch wrapper/interceptor to automatically inject the token in all client-side /api/ requests
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlString = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);
    
    // Check if targeting our own server API endpoints
    const isLocalApi = urlString.includes("/api/") && 
                       !urlString.includes("/api/opay/webhook") && 
                       !urlString.includes("/api/instagram/callback");
                       
    if (isLocalApi) {
      try {
        const token = await getAppCheckToken();
        if (token) {
          const headers = new Headers(init?.headers || {});
          headers.set("X-Firebase-AppCheck", token);
          init = { ...init, headers };
        }
      } catch (err) {
        console.warn("[App Check Interceptor] Failed to attach App Check token:", err);
      }
    }
    return originalFetch(input, init);
  };
}

// The exact high-fidelity representative brand image URL wrapped in a responsive block element
export const DEFAULT_LOGO_SVG = `<img src="https://res.cloudinary.com/dgc6ootad/image/upload/v1780044707/upside_logo_1_swnvtf.jpg" alt="UPSIDE LOGO" style="width: 100%; height: 100%; object-fit: contain; display: block;" />`;

export const DEFAULT_BRANDING = {
  logoSvg: DEFAULT_LOGO_SVG,
  brandName: "UPSIDE",
  tagline: "RESTAURANT & CAFÉ",
  subText: "A Brand of Mopheth",
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Function to fetch the branding config from the Firebase Firestore DB, with automatic setup/seeding
export async function getBranding() {
  const docRef = doc(db, "settings", "branding");
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure the DB branding has the updated high-fidelity SVG representation
      if (!data.logoSvg || data.logoSvg !== DEFAULT_LOGO_SVG) {
        try {
          await setDoc(docRef, {
            ...DEFAULT_BRANDING,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          return DEFAULT_BRANDING;
        } catch (dbErr) {
          console.warn("Failed to update branding in Firestore DB:", dbErr);
        }
      }
      return data;
    } else {
      // Seed default branding if not present in DB
      try {
        await setDoc(docRef, {
          ...DEFAULT_BRANDING,
          updatedAt: new Date().toISOString(),
        });
      } catch (writeErr) {
        console.warn("Failed to seed branding in Firestore DB:", writeErr);
      }
      return DEFAULT_BRANDING;
    }
  } catch (error) {
    console.error("DB connection fallback. Using default branding:", error);
    return DEFAULT_BRANDING;
  }
}
