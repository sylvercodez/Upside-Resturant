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

  // Instead of injecting the live chat widget directly into the document body which
  // creates overlapping widget elements, we handle the support trigger by opening
  // the official live agent chat screen in a dedicated new tab/page window.
  useEffect(() => {
    if (!enabled || !propertyId || !widgetId) return;

    const handleOpenLiveSupport = () => {
      const directLink = `https://tawk.to/chat/${propertyId}/${widgetId}`;
      console.log("[TawkSupportWidget] Opening direct support live chat page:", directLink);
      window.open(directLink, "_blank", "noopener,noreferrer");
    };

    window.addEventListener("open-upside-live-support", handleOpenLiveSupport);

    return () => {
      window.removeEventListener("open-upside-live-support", handleOpenLiveSupport);
    };
  }, [enabled, propertyId, widgetId]);

  return null;
}
