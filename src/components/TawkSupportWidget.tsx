import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function TawkSupportWidget() {
  const [enabled, setEnabled] = useState(false);
  const [propertyId, setPropertyId] = useState("");
  const [widgetId, setWidgetId] = useState("");

  // Listen to live support config settings
  useEffect(() => {
    const docRef = doc(db, "settings", "support_config");
    
    const isRealTawkId = (propId?: string, widId?: string) => {
      if (!propId || !widId) return false;
      const cleanProp = propId.trim();
      const cleanWid = widId.trim();
      // Ignore placeholder/mock IDs
      if (cleanProp === "6a466b60c5bc5d1d491794f3" || cleanProp === "" || cleanWid === "") return false;
      return cleanProp.length > 5 && cleanWid.length > 3;
    };

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const isValid = (data.tawkEnabled === true) && isRealTawkId(data.tawkPropertyId, data.tawkWidgetId);
        setEnabled(isValid);
        if (isValid) {
          setPropertyId(data.tawkPropertyId.trim());
          setWidgetId(data.tawkWidgetId.trim());
        }
      }
    }, (err) => {
      console.warn("Failed to subscribe to Tawk config, trying single fetch:", err);
      // Fallback to single fetch
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const isValid = (data.tawkEnabled === true) && isRealTawkId(data.tawkPropertyId, data.tawkWidgetId);
          setEnabled(isValid);
          if (isValid) {
            setPropertyId(data.tawkPropertyId.trim());
            setWidgetId(data.tawkWidgetId.trim());
          }
        }
      }).catch(() => {});
    });

    return () => unsubscribe();
  }, []);

  // Injects the live chat widget directly into the document body only if valid real credentials exist
  useEffect(() => {
    if (!enabled || !propertyId || !widgetId) return;

    let s1: HTMLScriptElement | null = null;
    try {
      s1 = document.createElement("script");
      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
      s1.charset = "UTF-8";
      s1.setAttribute("crossorigin", "*");
      s1.onerror = () => {
        console.warn("[TawkSupportWidget] Third-party Tawk script failed to load, falling back to native support chat.");
      };
      document.body.appendChild(s1);

      // Initial Tawk_API settings
      const tawkApi = (window as any).Tawk_API || {};
      tawkApi.onLoad = function() {
        if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === "function") {
          (window as any).Tawk_API.hideWidget();
        }
      };
      tawkApi.onChatMinimized = function() {
        if ((window as any).Tawk_API && typeof (window as any).Tawk_API.hideWidget === "function") {
          (window as any).Tawk_API.hideWidget();
        }
      };
      (window as any).Tawk_API = tawkApi;
    } catch (e) {
      console.warn("[TawkSupportWidget] Script creation error suppressed:", e);
    }

    const handleOpenLiveSupport = () => {
      if (
        (window as any).Tawk_API &&
        typeof (window as any).Tawk_API.showWidget === "function" &&
        typeof (window as any).Tawk_API.maximize === "function"
      ) {
        (window as any).Tawk_API.showWidget();
        (window as any).Tawk_API.maximize();
      } else {
        const directLink = `https://tawk.to/chat/${propertyId}/${widgetId}`;
        window.open(directLink, "_blank", "noopener,noreferrer");
      }
    };

    window.addEventListener("open-upside-live-support", handleOpenLiveSupport);

    return () => {
      if (s1 && s1.parentNode) {
        try {
          s1.parentNode.removeChild(s1);
        } catch (_) {}
      }
      window.removeEventListener("open-upside-live-support", handleOpenLiveSupport);
    };
  }, [enabled, propertyId, widgetId]);

  return null;
}
