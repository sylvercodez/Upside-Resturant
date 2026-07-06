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

  // Inject Tawk.to script dynamically if enabled and valid credentials exist
  useEffect(() => {
    if (!enabled || !propertyId || !widgetId) {
      // If disabled or empty, try to remove any existing Tawk.to widgets and windows
      try {
        const existingScript = document.getElementById("tawk-script-element");
        if (existingScript) {
          existingScript.remove();
        }
        // Remove global objects
        if ((window as any).Tawk_API) {
          if (typeof (window as any).Tawk_API.hideWidget === "function") {
            (window as any).Tawk_API.hideWidget();
          }
          if (typeof (window as any).Tawk_API.shutdown === "function") {
            (window as any).Tawk_API.shutdown();
          }
          delete (window as any).Tawk_API;
        }
        // Remove direct iframe elements created by Tawk
        const tawkContainers = document.querySelectorAll('div[id^="tawk-"], iframe[id^="tawk-"], div[class^="tawk-"]');
        tawkContainers.forEach((el) => el.remove());
      } catch (e) {
        console.error("Failed to clean up Tawk.to widget:", e);
      }
      return;
    }

    console.log(`[TAWK.TO WIDGET] Loading active Property ID: ${propertyId}, Widget ID: ${widgetId}`);

    // Pre-configure Tawk_API to ensure callbacks are bound immediately upon script load
    const tawkApi = (window as any).Tawk_API || {};
    
    // Auto-hide the widget as soon as it loads to prevent floating bubble overlap
    tawkApi.onLoad = function () {
      try {
        if (typeof tawkApi.hideWidget === "function") {
          tawkApi.hideWidget();
        }
      } catch (e) {
        console.warn("Tawk onLoad hideWidget failed:", e);
      }
    };

    // Auto-hide the widget again if the user minimizes or closes it
    tawkApi.onChatMinimized = function () {
      try {
        if (typeof tawkApi.hideWidget === "function") {
          tawkApi.hideWidget();
        }
      } catch (e) {
        console.warn("Tawk onChatMinimized hideWidget failed:", e);
      }
    };

    (window as any).Tawk_API = tawkApi;
    (window as any).Tawk_LoadStart = new Date();

    // Create script
    const s1 = document.createElement("script");
    s1.id = "tawk-script-element";
    s1.async = true;
    s1.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    // Inject before first script tag
    const s0 = document.getElementsByTagName("script")[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }

    // Listen to custom show/maximize trigger event
    const handleOpenLiveSupport = () => {
      const tawk = (window as any).Tawk_API;
      if (tawk) {
        try {
          if (typeof tawk.showWidget === "function") {
            tawk.showWidget();
          }
          if (typeof tawk.maximize === "function") {
            tawk.maximize();
          }
        } catch (err) {
          console.warn("Failed to show or maximize Tawk widget:", err);
        }
      }
    };

    window.addEventListener("open-upside-live-support", handleOpenLiveSupport);

    return () => {
      // Cleanup on unmount/re-run
      window.removeEventListener("open-upside-live-support", handleOpenLiveSupport);
      try {
        const existingScript = document.getElementById("tawk-script-element");
        if (existingScript) {
          existingScript.remove();
        }
        if ((window as any).Tawk_API) {
          if (typeof (window as any).Tawk_API.shutdown === "function") {
            (window as any).Tawk_API.shutdown();
          }
          delete (window as any).Tawk_API;
        }
        const tawkContainers = document.querySelectorAll('div[id^="tawk-"], iframe[id^="tawk-"], div[class^="tawk-"]');
        tawkContainers.forEach((el) => el.remove());
      } catch (e) {
        console.error("Tawk.to unmount cleanup failed:", e);
      }
    };
  }, [enabled, propertyId, widgetId]);

  return null; // Tawk.to is injected directly as a global widget, no local markup required
}
