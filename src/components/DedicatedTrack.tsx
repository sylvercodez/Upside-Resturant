import React, { useState } from "react";
import { ArrowLeft, Search, Eye, Clipboard, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";
import OrderTracker from "./OrderTracker";

interface DedicatedTrackProps {
  onBackToLobby: () => void;
}

export default function DedicatedTrack({ onBackToLobby }: DedicatedTrackProps) {
  const [orderInput, setOrderInput] = useState("");
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get("orderId") || params.get("id");
    if (orderIdParam) {
      setOrderInput(orderIdParam);
      setActiveOrderId(orderIdParam);
    }
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = orderInput.trim();
    if (!cleanId) {
      setSearchError("Please enter a valid Order ID reference.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      // 1. Try Firestore Lookup First
      try {
        const orderRef = doc(db, "orders", cleanId);
        const snap = await getDoc(orderRef);
        if (snap.exists()) {
          setActiveOrderId(cleanId);
          setSearching(false);
          return;
        }
      } catch (fErr) {
        console.warn("[Tracking] Firestore primary query bypassed:", fErr);
      }

      // 2. Try MySQL Lookup fallback
      try {
        const res = await fetch(getApiUrl(`/api/mysql/orders/${cleanId}`));
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setActiveOrderId(data.id);
            setSearching(false);
            return;
          }
        }
      } catch (mErr) {
        console.warn("[Tracking] MySQL primary query bypassed:", mErr);
      }

      // 3. Robust uppercase checking secondary fallback (just in case they copied lowercase variant)
      const upperId = cleanId.toUpperCase();
      try {
        const upperRef = doc(db, "orders", upperId);
        const upperSnap = await getDoc(upperRef);
        if (upperSnap.exists()) {
          setActiveOrderId(upperId);
          setSearching(false);
          return;
        }
      } catch (_) {}

      try {
        const upperRes = await fetch(getApiUrl(`/api/mysql/orders/${upperId}`));
        if (upperRes.ok) {
          const upperData = await upperRes.json();
          if (upperData && upperData.id) {
            setActiveOrderId(upperData.id);
            setSearching(false);
            return;
          }
        }
      } catch (_) {}

      setSearchError("No active order was located matching this ID. Please double check the ID from your receipt or email receipt.");
    } catch (err: any) {
      console.error("Order lookup error:", err);
      setSearchError("A database look-up constraint occurred. Please verify your connection or receipt reference number.");
    } finally {
      setSearching(false);
    }
  };

  const clearTracking = () => {
    setActiveOrderId(null);
    setOrderInput("");
    setSearchError(null);
  };

  return (
    <div className="bg-neutral-50 min-h-screen pt-28 pb-16 px-4 text-neutral-900 font-sans" id="dedicated-tracking-page">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn text-left">
        
        {/* Navigation Breadcrumb / Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <button
            onClick={activeOrderId ? clearTracking : onBackToLobby}
            className="group flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer self-start"
            id="tracking-back-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{activeOrderId ? "Track another order" : "Return to Sanctuary Lobby"}</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>UPSIDE RESTAURANT</span>
            <span>/</span>
            <span className="text-amber-600">UNAUTHENTICATED ORDER ACCESS</span>
          </div>
        </div>

        {/* Dynamic Inner Panel */}
        {!activeOrderId ? (
          <div className="max-w-md mx-auto py-12 space-y-8">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-white border border-neutral-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Search className="w-6 h-6 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-sans font-light tracking-tight text-neutral-900 uppercase">
                  Track Your Feast
                </h1>
                <p className="text-xs text-neutral-500 font-mono tracking-wider max-w-sm mx-auto uppercase leading-relaxed">
                  Real-time status tracking for boutique luxury deliveries & gourmet table orders.
                </p>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleTrack} className="bg-white border border-neutral-200 p-6 md:p-8 space-y-6 shadow-sm rounded-none" id="guest-tracking-form">
              <div className="space-y-2">
                <label className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block font-bold">
                  Order ID Reference Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={orderInput}
                    onChange={(e) => setOrderInput(e.target.value)}
                    placeholder="e.g. order_12345678"
                    className="w-full text-sm font-mono p-3 px-4 bg-neutral-50 border border-neutral-200 rounded-none focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-300 font-medium"
                    id="guest-tracking-input"
                    disabled={searching}
                  />
                  {searching ? (
                    <div className="absolute right-3 top-3.5">
                      <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin block" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const clipboardText = await navigator.clipboard.readText();
                          if (clipboardText && clipboardText.trim()) {
                            setOrderInput(clipboardText.trim());
                          }
                        } catch (_) {
                          // Fail silently if clipboard permission is not granted
                        }
                      }}
                      className="absolute right-3 top-2.5 p-1 text-neutral-400 hover:text-amber-500 text-[10px] uppercase font-mono font-bold tracking-wider"
                      title="Paste from clipboard"
                    >
                      Paste
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                  Enter the unique uppercase ID reference received upon check-out or in your digital receipt/email notification.
                </p>
              </div>

              {searchError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded flex gap-2 items-start animate-shake">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{searchError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={searching}
                className="w-full py-3.5 bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 hover:border-neutral-800 text-white font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                id="guest-track-submit-btn"
              >
                <span>{searching ? "Searching Records..." : "Establish Real-Time Connection"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="bg-neutral-100 p-4 border border-neutral-200 space-y-2.5">
              <h5 className="text-[10px] font-mono tracking-widest text-neutral-500 font-bold uppercase flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                Frequently Asked Questions
              </h5>
              <div className="text-[11px] font-sans text-neutral-500 leading-relaxed space-y-1.5">
                <p>
                  <strong>Where can I find my Order ID?</strong> The Order ID is displayed on the screen immediately after paying via OPay, and is sent inside the order confirmation email.
                </p>
                <p>
                  <strong>Do I need an account?</strong> No. Standard guest checkouts can be fully monitored without logging into our core platform.
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Embedded OrderTracker Component */}
            <div className="bg-white border border-neutral-200 p-6 md:p-8 shadow-sm">
              <OrderTracker
                orderId={activeOrderId}
                userRole="user"
                onBackToCart={clearTracking}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
