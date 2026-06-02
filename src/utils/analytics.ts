import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import { collection, doc, setDoc } from "firebase/firestore";
import { app, db, auth } from "../firebase";

let analyticsInstance: any = null;

// Safely initialize Firebase Analytics only if supported inside target browser/sandbox
isSupported()
  .then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  })
  .catch((err) => {
    console.warn("Firebase Analytics initialization skipped or restricted in this environment:", err);
  });

export type AnalyticsEventType =
  | "page_view"
  | "menu_view"
  | "reservation_attempt"
  | "reservation_success"
  | "cart_view"
  | "checkout_attempt"
  | "checkout_success";

/**
 * Tracks and pushes user engagement metrics and reservation conversion ratios.
 * Events are sent to public Google Analytics streams (if active) and stored permanently in Firestore for Admin view options.
 */
export async function logCustomEvent(
  eventType: AnalyticsEventType,
  metadata: Record<string, any> = {}
) {
  // 1. Try Native Firebase Analytics Send
  try {
    if (analyticsInstance) {
      logEvent(analyticsInstance, eventType as any, metadata);
    }
  } catch (faErr) {
    // Suppress console spam for iframe sandbox cookies rejection
  }

  // 2. Client & Admin DB Metrics Backplane
  try {
    let sessionUid = localStorage.getItem("upside_analytics_session_uid");
    const currentUid = auth.currentUser?.uid;

    if (!sessionUid) {
      sessionUid = currentUid || "anon_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("upside_analytics_session_uid", sessionUid);
    } else if (currentUid && sessionUid.startsWith("anon_")) {
      // Transition from anonymous tracking to logged-in tracking
      sessionUid = currentUid;
      localStorage.setItem("upside_analytics_session_uid", sessionUid);
    }

    // Standard high-integrity randomized valid ID matching isValidId requirements
    const eventId = "evt_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    const eventData = {
      eventType,
      pathName: window.location.pathname || "/",
      sessionUid,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent.substring(0, 150),
        screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Store securely under collections
    const docRef = doc(db, "analytics_events", eventId);
    await setDoc(docRef, eventData);
    
    return eventId;
  } catch (err) {
    console.warn("Local analytics buffer write skipped:", err);
  }
}
