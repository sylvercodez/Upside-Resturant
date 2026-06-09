import React, { useState, useEffect } from "react";
import { ChefHat, Flame, Truck, CheckCircle2, RefreshCw, Clock, MapPin } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface OrderTrackerProps {
  onBackToCart?: () => void;
  orderId?: string | null;
}

export default function OrderTracker({ onBackToCart, orderId }: OrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Read and bind real-time Firestore database updates
  useEffect(() => {
    let targetDocId = orderId;

    if (!targetDocId) {
      const saved = localStorage.getItem("upside_active_order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          targetDocId = parsed.id || null;
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    if (!targetDocId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Subscribe to the order document in Firestore
    const unsubscribe = onSnapshot(
      doc(db, "orders", targetDocId),
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Check local storage for basic fallback copy
          const saved = localStorage.getItem("upside_active_order");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.id === targetDocId || !targetDocId) {
                setActiveOrder(parsed);
              }
            } catch (_) {}
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore OrderTracker connection error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const resetTracking = () => {
    localStorage.removeItem("upside_active_order");
    setActiveOrder(null);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Prepping":
        return "PREPPING IN KITCHEN";
      case "In Oven":
        return "BAKING / GRILLED IN OVEN";
      case "Out for Delivery":
        return "RIDER OUT FOR DELIVERY";
      case "Delivered":
        return "DELIVERED TO SANCTUARY MASTER";
      default:
        return (status || "PREPPING IN KITCHEN").toUpperCase();
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "Prepping":
        return 22;
      case "In Oven":
        return 55;
      case "Out for Delivery":
        return 82;
      case "Delivered":
        return 100;
      default:
        return 22;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3" id="order-tracker-loading">
        <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Syncing with sanctuary kitchen...</p>
      </div>
    );
  }

  const currentStage = activeOrder?.status || "Prepping";

  return (
    <div className="space-y-6 text-left" id="order-tracker-flow">
      {/* Styles for advanced pulsing loops inside the component */}
      <style>{`
        @keyframes steamPulse {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-4px) scale(1.1); opacity: 0.8; }
          100% { transform: translateY(0) scale(1); opacity: 0.3; }
        }
        @keyframes customPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-steam {
          animation: steamPulse 2s ease-in-out infinite;
        }
        .animate-heartbeat {
          animation: customPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Hero Header Area */}
      <div className="bg-neutral-900 border-l-4 border-amber-500 p-5 rounded-none space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-24 h-24 stroke-[1] text-amber-500" />
        </div>
        <span className="text-[10px] tracking-widest text-amber-500 font-mono font-bold uppercase block">
          Lagos Luxury Food Service
        </span>
        <h4 className="text-sm font-semibold tracking-wider font-mono text-white uppercase">
          {activeOrder ? `TRACKING ORDER: #${activeOrder.id?.slice(-8).toUpperCase()}` : "REAL-TIME TRACKING SYSTEM"}
        </h4>
        <p className="text-[11px] text-neutral-400 font-sans normal-case leading-relaxed">
          Watch our gourmet chefs and logistics dispatch officers update your luxury dining status in real-time.
        </p>
      </div>

      {activeOrder ? (
        <div className="space-y-6" id="active-tracker-status-box">
          {/* Main Status Header */}
          <div className="bg-[#121212] border border-neutral-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">
                  Current Status
                </span>
                <span className="text-xs uppercase font-mono font-black text-amber-500 tracking-wide flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  {getStatusText(currentStage)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">
                  Movement Source
                </span>
                <span className="text-[11px] font-mono text-neutral-300 font-bold uppercase block mt-1">
                  {currentStage === "Prepping" ? "🧑‍🍳 Gourmet Kitchen" : 
                   currentStage === "In Oven" ? "🔥 Searing Station" : 
                   currentStage === "Out for Delivery" ? "🏍️ express rider" : "🎉 delivered"}
                </span>
              </div>
            </div>

            {/* Custom Interactive Animated Progress Bar */}
            <div className="relative pt-4">
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-amber-500 transition-all duration-1000 ease-out relative"
                  style={{ width: `${getProgressPercentage(currentStage)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full animate-pulse h-full" />
                </div>
              </div>

              {/* Slider Milestones Icons */}
              <div className="flex justify-between items-center mt-4">
                {/* Milestone 1: Prepping */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      currentStage === "Prepping"
                        ? "bg-amber-600 border-amber-500 text-white animate-heartbeat shadow-md"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <ChefHat className={`w-4 h-4 ${currentStage === "Prepping" ? "animate-steam" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-tighter mt-1 font-bold">
                    PREP
                  </span>
                </div>

                {/* Milestone 2: Oven */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      currentStage === "In Oven"
                        ? "bg-amber-600 border-amber-500 text-white animate-heartbeat shadow-md"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${currentStage === "In Oven" ? "animate-bounce" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-tighter mt-1 font-bold">
                    OVEN
                  </span>
                </div>

                {/* Milestone 3: Route */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      currentStage === "Out for Delivery"
                        ? "bg-amber-600 border-amber-500 text-white animate-heartbeat shadow-md"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <Truck className={`w-4 h-4 ${currentStage === "Out for Delivery" ? "animate-bounce" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-tighter mt-1 font-bold">
                    ROUTE
                  </span>
                </div>

                {/* Milestone 4: Done */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${
                      currentStage === "Delivered"
                        ? "bg-emerald-600 border-emerald-500 text-white shadow-md"
                        : "bg-neutral-900 border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-400 tracking-tighter mt-1 font-bold">
                    DONE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Stage Details explanation Box */}
          <div className="bg-[#121212] border border-neutral-800 p-4 space-y-3">
            <h5 className="text-[10px] tracking-widest text-[#d97706] font-mono uppercase font-black">
              LIVE KITCHEN TIMELINE:
            </h5>
            
            <div className="space-y-2 border-l-2 border-amber-500 pl-3">
              {currentStage === "Prepping" && (
                <div>
                  <p className="text-[11px] text-white font-bold uppercase">
                    👨‍🍳 SELECTING FRESH INGREDIENTS
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium lowercase">
                    Our master chefs are currently working in the luxury kitchen. Your meal's ingredients are being select and prepped with precision.
                  </p>
                </div>
              )}

              {currentStage === "In Oven" && (
                <div>
                  <p className="text-[11px] text-white font-bold uppercase">
                    🔥 HIGH-TEMP BAKING &amp; CHARCOAL SEARING
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium lowercase">
                    Meals have been moved into our high-performance searing ovens by our chef teams. Aromas and charcoal luxury flavors in lock.
                  </p>
                </div>
              )}

              {currentStage === "Out for Delivery" && (
                <div>
                  <p className="text-[11px] text-white font-bold uppercase">
                    🏍️ DISPATCHED VIA EXCLUSIVE LAGOS EXPRESS
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium lowercase">
                    Lagos Luxury Express rider has received your insulation packet and is traveling to your venue sanctuary.
                  </p>
                </div>
              )}

              {currentStage === "Delivered" && (
                <div>
                  <p className="text-[11px] text-emerald-400 font-bold uppercase text-left">
                    🎉 BON APPÉTIT
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium lowercase text-left">
                    Your gourmet feast has been delivered successfully. Have an exquisite meal experience!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Specifics */}
          <div className="bg-neutral-900 border border-neutral-800 p-4 space-y-3 text-left shadow-sm">
            <span className="text-[10px] tracking-widest text-neutral-400 font-bold font-mono uppercase block border-b border-neutral-800 pb-1.5">
              ORDER OVERVIEW
            </span>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-white">{activeOrder.customerName || "Vanguard Guest"}</p>
              {activeOrder.address && (
                <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>{activeOrder.address}</span>
                </p>
              )}
            </div>

            {/* order item summary lines */}
            <div className="bg-neutral-950 p-2.5 space-y-1.5">
              {(() => {
                const items = activeOrder.items;
                let itemsArray: any[] = [];
                if (items) {
                  if (Array.isArray(items)) {
                    itemsArray = items;
                  } else if (typeof items === "string") {
                    try {
                      const parsed = JSON.parse(items);
                      if (Array.isArray(parsed)) {
                        itemsArray = parsed;
                      } else if (parsed && typeof parsed === "object") {
                        itemsArray = Object.values(parsed);
                      }
                    } catch (_) {}
                  } else if (typeof items === "object") {
                    itemsArray = Object.values(items);
                  }
                }
                return itemsArray.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-neutral-300">
                    <span className="font-mono">{item?.name || "Gourmet Dish"} <strong className="text-amber-500">×{item?.quantity || 1}</strong></span>
                    <span className="font-mono">₦{((item?.price || 5000) * (item?.quantity || 1)).toLocaleString()}</span>
                  </div>
                ));
              })()}
              <div className="border-t border-neutral-850 mt-2 pt-1.5 flex justify-between items-center text-[11px] font-mono text-amber-500 uppercase">
                <span>Total Package:</span>
                <span>₦{activeOrder.totalPrice?.toLocaleString() || "12,000"}</span>
              </div>
            </div>

            {/* Delivery Contact Information */}
            <div className="flex items-center gap-2 border-t border-neutral-850 pt-3 mt-1.5">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-neutral-300">
                🚚
              </div>
              <div className="flex-grow">
                <p className="text-[10px] text-neutral-500 font-bold uppercase">Assigned Rider Line</p>
                <p className="text-[11px] font-mono text-amber-500 font-bold">+234 (91) 464-6767</p>
              </div>
              <a
                href="tel:+2349114646767"
                className="px-3 py-1.5 border border-neutral-800 hover:border-neutral-700 text-[10px] bg-neutral-950 text-neutral-300 font-mono uppercase font-bold transition-all"
              >
                Call Rider
              </a>
            </div>
          </div>

          <button
            onClick={resetTracking}
            className="w-full py-3 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-semibold text-xs font-mono uppercase tracking-widest cursor-pointer text-center bg-[#121212] transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Untrack / Clear Current Panel</span>
          </button>
        </div>
      ) : (
        <div className="py-16 text-center space-y-4" id="tracker-idle-mode">
          <Clock className="w-12 h-12 text-neutral-700 mx-auto stroke-1" />
          <p className="text-sm font-mono text-neutral-500 font-bold uppercase">No Active Order Selected</p>
          <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-normal font-sans">
            Please purchase an experience from the checkout, or select "Track Order Progress" on any order inside your order histories list below.
          </p>
        </div>
      )}
    </div>
  );
}
