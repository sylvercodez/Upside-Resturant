import React, { useEffect } from "react";

interface SupportChatWidgetProps {
  currentUser?: any;
}

export default function SupportChatWidget({ currentUser }: SupportChatWidgetProps) {
  // Load Tawk.to script on mount
  useEffect(() => {
    // Check if the script is already appended
    const existingScript = document.getElementById("tawk-to-script");
    if (existingScript) return;

    const s1 = document.createElement("script");
    s1.id = "tawk-to-script";
    s1.async = true;
    s1.src = "https://embed.tawk.to/6a466b60c5bc5d1d491794f3/1jshh6ssq";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");

    // Set up Tawk_API and Tawk_LoadStart global variables
    const win = window as any;
    win.Tawk_API = win.Tawk_API || {};
    win.Tawk_LoadStart = new Date();

    const s0 = document.getElementsByTagName("script")[0];
    if (s0 && s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    } else {
      document.head.appendChild(s1);
    }

    // Optional: Clean up on component unmount
    return () => {
      const script = document.getElementById("tawk-to-script");
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (win.Tawk_API && typeof win.Tawk_API.hide === "function") {
        try {
          win.Tawk_API.hide();
        } catch (e) {
          console.warn("Tawk clean-up warning:", e);
        }
      }
    };
  }, []);

  // Sync visitor details with Tawk.to when currentUser changes
  useEffect(() => {
    const win = window as any;
    if (!win.Tawk_API) return;

    const syncVisitorAttributes = () => {
      if (currentUser && typeof win.Tawk_API.setAttributes === "function") {
        const displayName = currentUser.displayName || currentUser.fullName || currentUser.email?.split("@")[0] || "Guest";
        const email = currentUser.email || "";
        
        win.Tawk_API.setAttributes(
          {
            name: displayName,
            email: email,
          },
          (error: any) => {
            if (error) {
              console.warn("Error setting Tawk.to attributes:", error);
            }
          }
        );
      }
    };

    // If Tawk.to is already loaded, update attributes immediately
    if (win.Tawk_API && typeof win.Tawk_API.setAttributes === "function") {
      syncVisitorAttributes();
    } else {
      // Otherwise, register onLoad callback to update attributes once loaded
      win.Tawk_API.onLoad = () => {
        syncVisitorAttributes();
      };
    }
  }, [currentUser]);

  // Tawk.to has its own beautiful floating launcher UI and does not require rendering local elements
  return null;
}
