import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function TawkSupportWidget() {
  const [enabled, setEnabled] = useState(true);
  const [propertyId, setPropertyId] = useState("6a466b60c5bc5d1d491794f3");
  const [widgetId, setWidgetId] = useState("1jshh6ssq");

  // Listen to live support config settings
  useEffect(() => {
    const docRef = doc(db, "settings", "support_config");
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEnabled(data.tawkEnabled ?? true);
        setPropertyId(data.tawkPropertyId || "6a466b60c5bc5d1d491794f3");
        setWidgetId(data.tawkWidgetId || "1jshh6ssq");
      }
    }, (err) => {
      console.warn("Failed to subscribe to Tawk config, trying single fetch:", err);
      // Fallback to single fetch
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEnabled(data.tawkEnabled ?? true);
          setPropertyId(data.tawkPropertyId || "6a466b60c5bc5d1d491794f3");
          setWidgetId(data.tawkWidgetId || "1jshh6ssq");
        }
      }).catch(e => console.error("Tawk config fetch failed completely:", e));
    });

    return () => unsubscribe();
  }, []);

  // Instead of opening a new tab/window, we inject the live chat widget directly into the document body
  // which lets customers chat normally directly inside the landing page.
  useEffect(() => {
    if (!enabled || !propertyId || !widgetId) return;

    // Standard Tawk.to script injection
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    document.body.appendChild(s1);

    // Initial Tawk_API settings
    const tawkApi = (window as any).Tawk_API || {};
    tawkApi.onLoad = function() {
      if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === "function") {
        console.log("[TawkSupportWidget] onLoad: Hiding standard Tawk.to bubble...");
        (window as any).Tawk_API.hideWidget();
      }
    };
    tawkApi.onChatMinimized = function() {
      if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === "function") {
        console.log("[TawkSupportWidget] onChatMinimized: Hiding standard Tawk.to bubble...");
        (window as any).Tawk_API.hideWidget();
      }
    };
    (window as any).Tawk_API = tawkApi;

    // If Tawk_API is already initialized/cached, hide it immediately
    if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === "function") {
      console.log("[TawkSupportWidget] Tawk already loaded: Hiding standard Tawk.to bubble...");
      (window as any).Tawk_API.hideWidget();
    }

    const handleOpenLiveSupport = () => {
      if (
        (window as any).Tawk_API &&
        typeof (window as any).Tawk_API.showWidget === "function" &&
        typeof (window as any).Tawk_API.maximize === "function"
      ) {
        console.log("[TawkSupportWidget] Showing and maximizing standard inline live support widget...");
        (window as any).Tawk_API.showWidget();
        (window as any).Tawk_API.maximize();
      } else {
        console.warn("[TawkSupportWidget] Tawk_API not loaded yet, falling back to direct link...");
        const directLink = `https://tawk.to/chat/${propertyId}/${widgetId}`;
        window.open(directLink, "_blank", "noopener,noreferrer");
      }
    };

    window.addEventListener("open-upside-live-support", handleOpenLiveSupport);

    return () => {
      try {
        document.body.removeChild(s1);
      } catch (e) {}
      window.removeEventListener("open-upside-live-support", handleOpenLiveSupport);
    };
  }, [enabled, propertyId, widgetId]);

  return null;
}
