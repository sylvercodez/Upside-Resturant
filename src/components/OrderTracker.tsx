import React, { useState, useEffect } from "react";
import { ChefHat, Flame, Truck, CheckCircle2, RefreshCw, Clock, Sparkles, MapPin, Phone } from "lucide-react";

interface OrderTrackerProps {
  onBackToCart?: () => void;
}

export default function OrderTracker({ onBackToCart }: OrderTrackerProps) {
  // Try to load any active order from localStorage
  const [activeOrder, setActiveOrder] = useState(() => {
    const saved = localStorage.getItem("upside_active_order");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [currentStage, setCurrentStage] = useState<"Prepping" | "In Oven" | "Out for Delivery" | "Delivered">("Prepping");
  const [timeRemaining, setTimeRemaining] = useState(1500); // 25 mins in seconds
  const [isSimulating, setIsSimulating] = useState(true);

  // Load / initialize order
  useEffect(() => {
    if (activeOrder) {
      const elapsedSeconds = Math.floor((Date.now() - activeOrder.timestamp) / 1000);
      
      // We simulate each stage to take 45 seconds for a complete and fast-paced live demo (total 185s)
      if (elapsedSeconds < 45) {
        setCurrentStage("Prepping");
        setTimeRemaining(Math.max(1200 - elapsedSeconds * 5, 0)); // Countdown simulates downward progress
      } else if (elapsedSeconds < 90) {
        setCurrentStage("In Oven");
        setTimeRemaining(Math.max(800 - (elapsedSeconds - 45) * 8, 0));
      } else if (elapsedSeconds < 135) {
        setCurrentStage("Out for Delivery");
        setTimeRemaining(Math.max(300 - (elapsedSeconds - 90) * 6, 0));
      } else {
        setCurrentStage("Delivered");
        setTimeRemaining(0);
      }
    } else {
      // Default fallback demo state if no active order exists in localStorage
      setCurrentStage("Prepping");
      setTimeRemaining(1485);
    }
  }, [activeOrder]);

  // Handle active countdown simulation ticking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        if (activeOrder) {
          const elapsedSeconds = Math.floor((Date.now() - activeOrder.timestamp) / 1000);
          
          if (elapsedSeconds < 45) {
            setCurrentStage("Prepping");
            setTimeRemaining(Math.max(1200 - elapsedSeconds * 5, 0));
          } else if (elapsedSeconds < 90) {
            setCurrentStage("In Oven");
            setTimeRemaining(Math.max(800 - (elapsedSeconds - 45) * 8, 0));
          } else if (elapsedSeconds < 135) {
            setCurrentStage("Out for Delivery");
            setTimeRemaining(Math.max(300 - (elapsedSeconds - 90) * 6, 0));
          } else {
            setCurrentStage("Delivered");
            setTimeRemaining(0);
          }
        } else {
          // If in Demo Mode (without active checkout), auto-advance stages every 15s
          setTimeRemaining((prev) => (prev > 10 ? prev - 1 : 1480));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, activeOrder]);

  // Manual Demo Trigger
  const startDemoOrder = () => {
    const demoPayload = {
      customerName: "Tosin Otenaike (Demo)",
      timestamp: Date.now(),
      totalPrice: 18500,
      items: [
        { name: "Upside Signature Charcoal Steak", quantity: 1, price: 14500 },
        { name: "Artisanal Mint Cold Brew", quantity: 1, price: 4000 }
      ],
      address: "Admiralty Way, Lekki Phase 1, Lagos"
    };
    localStorage.setItem("upside_active_order", JSON.stringify(demoPayload));
    setActiveOrder(demoPayload);
  };

  // Reset order tracking to place a new check or start demo
  const resetTracking = () => {
    localStorage.removeItem("upside_active_order");
    setActiveOrder(null);
    setCurrentStage("Prepping");
    setTimeRemaining(1500);
  };

  // Helper values for Progress Bar
  const getProgressPercentage = () => {
    switch (currentStage) {
      case "Prepping":
        return 22;
      case "In Oven":
        return 55;
      case "Out for Delivery":
        return 82;
      case "Delivered":
        return 100;
      default:
        return 0;
    }
  };

  // Formatter for countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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
        @keyframes borderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-steam {
          animation: steamPulse 2s ease-in-out infinite;
        }
        .animate-heartbeat {
          animation: customPulse 1.5s ease-in-out infinite;
        }
        .spinning-ring {
          animation: borderSpin 6s linear infinite;
        }
      `}</style>

      {/* Hero Header Area */}
      <div className="bg-neutral-900 text-white p-5 border-l-4 border-amber-500 rounded-none space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-24 h-24 stroke-[1]" />
        </div>
        <span className="text-[10px] tracking-widest text-amber-500 font-mono font-bold uppercase block">
          Live Sanctuary Food Service
        </span>
        <h4 className="text-sm font-semibold tracking-wider font-mono text-white uppercase">
          {activeOrder ? "TRACKING YOUR LUXURY ORDER" : "REAL-TIME TRACKING SYSTEM"}
        </h4>
        <p className="text-[12px] text-neutral-400 font-medium normal-case leading-relaxed">
          Watch our gourmet chefs and logistics dispatch officers handcraft and deliver your premium feast step-by-step.
        </p>
      </div>

      {activeOrder ? (
        <div className="space-y-6" id="active-tracker-status-box">
          {/* Main Time Counter & Status Bubble */}
          <div className="bg-neutral-55 border border-neutral-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">
                  Current Status
                </span>
                <span className="text-sm uppercase font-mono font-black text-amber-600 tracking-wide flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  {currentStage === "Prepping" && "PREPPING IN KITCHEN"}
                  {currentStage === "In Oven" && "BAKING / GRILLED IN OVEN"}
                  {currentStage === "Out for Delivery" && "RIDER OUT FOR DELIVERY"}
                  {currentStage === "Delivered" && "DELIVERED TO SANCTUARY MASTER"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold block">
                  Est. Delivery Time
                </span>
                <span className="text-lg font-mono font-black text-black">
                  {currentStage === "Delivered" ? "ARRIVED" : formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Custom Interactive Animated Progress Bar */}
            <div className="relative pt-4">
              <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-amber-500 transition-all duration-1000 ease-out relative"
                  style={{ width: `${getProgressPercentage()}%` }}
                >
                  {/* Glowing moving light effect inside the progress bar */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full animate-pulse h-full" />
                </div>
              </div>

              {/* Slider Milestones Icons */}
              <div className="flex justify-between items-center mt-4">
                {/* Milestone 1: Prepping */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      currentStage === "Prepping"
                        ? "bg-amber-500 border-amber-600 text-white animate-heartbeat shadow-md"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    <ChefHat className={`w-4 h-4 ${currentStage === "Prepping" ? "animate-steam" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-tighter mt-1 font-bold">
                    PREP
                  </span>
                </div>

                {/* Milestone 2: Oven */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      currentStage === "In Oven"
                        ? "bg-amber-500 border-amber-600 text-white animate-heartbeat shadow-md"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${currentStage === "In Oven" ? "animate-bounce" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-tighter mt-1 font-bold">
                    OVEN
                  </span>
                </div>

                {/* Milestone 3: Route */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      currentStage === "Out for Delivery"
                        ? "bg-amber-500 border-amber-600 text-white animate-heartbeat shadow-md"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    <Truck className={`w-4 h-4 ${currentStage === "Out for Delivery" ? "animate-bounce" : ""}`} />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-tighter mt-1 font-bold">
                    ROUTE
                  </span>
                </div>

                {/* Milestone 4: Done */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      currentStage === "Delivered"
                        ? "bg-emerald-600 border-emerald-700 text-white shadow-md animate-pulse"
                        : "bg-white border-neutral-300 text-neutral-400"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-mono uppercase text-neutral-500 tracking-tighter mt-1 font-bold">
                    DONE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Stage Details explanation Box */}
          <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-3">
            <h5 className="text-[10px] tracking-widest text-neutral-500 font-mono uppercase font-black">
              LIVE PREPARE LOGS:
            </h5>
            
            <div className="space-y-2 border-l-2 border-amber-400 pl-3">
              {currentStage === "Prepping" && (
                <div className="animate-fadeIn">
                  <p className="text-[11px] text-neutral-800 font-bold uppercase">
                    👨‍🍳 SELECTING FRESH INGREDIENTS
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium lowercase">
                    Our sanctuary master chefs are handcrafting gourmet items from raw organic stores. All custom meal requests are flagged.
                  </p>
                </div>
              )}

              {currentStage === "In Oven" && (
                <div className="animate-fadeIn">
                  <p className="text-[11px] text-neutral-800 font-bold uppercase">
                    🔥 HIGH-TEMP BAKING &amp; CHARCOAL SEARING
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium lowercase">
                    Meals have been routed into the volcanic temperature ovens. Hot pastries, juicy brioche patties, and single-origins are undergoing thermal luxury.
                  </p>
                </div>
              )}

              {currentStage === "Out for Delivery" && (
                <div className="animate-fadeIn">
                  <p className="text-[11px] text-neutral-800 font-bold uppercase">
                    🏍️ DISPATCHED VIA LAGOS EXPRESS
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium lowercase">
                    Lagos Luxury Express rider has securely stored items inside dynamic insulated hot-service packs. Rider path tracking active.
                  </p>
                </div>
              )}

              {currentStage === "Delivered" && (
                <div className="animate-fadeIn">
                  <p className="text-[11px] text-emerald-700 font-bold uppercase text-left">
                    🎉 BON APPÉTIT
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium lowercase text-left">
                    Your luxury gourmet feast has been delivered to your destination sanctuary successfully. Have a marvelous meal!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Specifics */}
          <div className="bg-white border border-neutral-200 p-4 space-y-3 text-left shadow-sm">
            <span className="text-[10px] tracking-widest text-neutral-500 font-bold font-mono uppercase block border-b border-neutral-100 pb-1.5">
              ORDER OVERVIEW
            </span>
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase text-neutral-900">{activeOrder.customerName || "Vanguard Guest"}</p>
              {activeOrder.address && (
                <p className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  <span>{activeOrder.address}</span>
                </p>
              )}
            </div>

            {/* Simulated order item summary lines */}
            <div className="bg-neutral-50 p-2.5 space-y-1.5">
              {activeOrder.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-[11px] text-neutral-700">
                  <span className="font-mono font-bold">{item.name} <strong className="text-amber-600 font-mono font-black">×{item.quantity}</strong></span>
                  <span className="font-mono font-bold">₦{((item.price || 5000) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-neutral-200 mt-2 pt-1.5 flex justify-between items-center text-[11px] text-black font-extrabold text-[#d97706] uppercase animate-pulse">
                <span>Total Package:</span>
                <span>₦{activeOrder.totalPrice?.toLocaleString() || "12,000"}</span>
              </div>
            </div>

            {/* Delivery Contact Information */}
            <div className="flex items-center gap-2 border-t border-neutral-100 pt-3 mt-1.5">
              <div className="w-8 h-8 rounded-full bg-neutral-150 flex items-center justify-center p-1 font-mono text-neutral-700 font-bold">
                🚚
              </div>
              <div className="flex-grow">
                <p className="text-[10px] text-neutral-400 font-bold uppercase">Assigned Rider Line</p>
                <p className="text-[11px] font-mono text-black font-bold">+234 (91) 464-6767</p>
              </div>
              <a
                href="tel:+2349114646767"
                className="px-3 py-1.5 border border-neutral-200 hover:border-black text-[10px] bg-white text-black font-mono font-bold uppercase hover:bg-neutral-50 transition-colors"
              >
                Call Rider
              </a>
            </div>
          </div>

          {/* Interactive Simulation Helper Tools */}
          <div className="bg-amber-500/5 border border-amber-500/20 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-widest text-[#d97706] font-mono uppercase font-black">
                Demo simulation tools
              </span>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className="text-[9px] underline text-[#d97706] uppercase font-bold hover:text-amber-800 transition-colors cursor-pointer"
              >
                {isSimulating ? "[Pause Timeline]" : "[Play Timeline]"}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
              <button
                onClick={() => {
                  setCurrentStage("Prepping");
                  setTimeRemaining(1200);
                }}
                className={`py-2 border transition-all ${
                  currentStage === "Prepping"
                    ? "bg-amber-500 text-white border-amber-600 font-black"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                Prepping
              </button>
              <button
                onClick={() => {
                  setCurrentStage("In Oven");
                  setTimeRemaining(800);
                }}
                className={`py-2 border transition-all ${
                  currentStage === "In Oven"
                    ? "bg-amber-500 text-white border-amber-600 font-black"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                In Oven
              </button>
              <button
                onClick={() => {
                  setCurrentStage("Out for Delivery");
                  setTimeRemaining(300);
                }}
                className={`py-2 border transition-all ${
                  currentStage === "Out for Delivery"
                    ? "bg-amber-500 text-white border-amber-600 font-black"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                }`}
              >
                Traveling
              </button>
              <button
                onClick={() => {
                  setCurrentStage("Delivered");
                  setTimeRemaining(0);
                }}
                className={`py-2 border transition-all ${
                  currentStage === "Delivered"
                    ? "bg-emerald-600 text-white border-emerald-700 font-black"
                    : "bg-white text-neutral-600 border-neutral-500 hover:border-neutral-300"
                }`}
              >
                Meal Arrived
              </button>
            </div>
            
            <p className="text-[9px] text-neutral-500 text-center leading-normal italic">
              * Click any stage above to test how the UI adapts, or allow the auto-simulation to tick live.
            </p>
          </div>

          {/* Reset button to clear simulation */}
          <div className="flex gap-2.5">
            <button
              onClick={resetTracking}
              className="w-full py-3.5 border border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:text-black font-semibold text-xs font-mono uppercase tracking-widest cursor-pointer text-center bg-white shadow-sm font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset &amp; Clear Tracker</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-4" id="tracker-idle-mode">
          <Clock className="w-12 h-12 text-neutral-300 mx-auto stroke-1" />
          <p className="text-sm font-mono text-neutral-500 font-bold uppercase">No Active Orders Yet</p>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-normal font-medium normal-case">
            You don't have any active food preparation orders in progress right now. Place a gourmet order at checkout, or test the live simulator instantly below!
          </p>
          
          <button
            onClick={startDemoOrder}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono uppercase tracking-widest font-bold transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>Launch Simulation Order</span>
          </button>
        </div>
      )}
    </div>
  );
}
