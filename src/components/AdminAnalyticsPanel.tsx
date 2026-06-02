import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import { BarChart3, Users, CalendarSync, ShoppingBag, Eye, TrendingUp, RefreshCw, Layers } from "lucide-react";

interface AnalyticsLog {
  id: string;
  eventType: string;
  pathName: string;
  sessionUid: string;
  timestamp: string;
  metadata?: {
    guests?: number | string;
    occasion?: string;
    seating?: string;
    itemsCount?: number;
    totalPrice?: number;
    price?: number;
    userAgent?: string;
    screenResolution?: string;
    method?: string;
    type?: string;
  };
}

export default function AdminAnalyticsPanel() {
  const [logs, setLogs] = useState<AnalyticsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchSession, setSearchSession] = useState("");

  useEffect(() => {
    // Read up to 1000 latest events for real-time live performance mapping
    const q = query(
      collection(db, "analytics_events"),
      orderBy("timestamp", "desc"),
      limit(1000)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AnalyticsLog[] = [];
        snapshot.forEach((snapDoc) => {
          list.push({ id: snapDoc.id, ...snapDoc.data() } as AnalyticsLog);
        });
        setLogs(list);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Analytics stream failure:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Compute stats metrics dynamically
  const totalVisits = logs.filter((l) => l.eventType === "page_view").length;
  const menuExploration = logs.filter((l) => l.eventType === "menu_view").length;
  
  // Reservations
  const reservationAttempts = logs.filter((l) => l.eventType === "reservation_attempt").length;
  const reservationSuccesses = logs.filter((l) => l.eventType === "reservation_success").length;
  const reservationRate =
    reservationAttempts > 0
      ? ((reservationSuccesses / reservationAttempts) * 100).toFixed(1)
      : "0.0";

  // Checkouts
  const checkoutAttempts = logs.filter((l) => l.eventType === "checkout_attempt").length;
  const checkoutSuccesses = logs.filter((l) => l.eventType === "checkout_success").length;
  const checkoutRate =
    checkoutAttempts > 0
      ? ((checkoutSuccesses / checkoutAttempts) * 100).toFixed(1)
      : "0.0";

  // Unique Visitors (Sessions)
  const uniqueSessions = new Set(logs.map((l) => l.sessionUid)).size;

  // Most visited paths
  const pathCounts: Record<string, number> = {};
  logs.forEach((log) => {
    if (log.eventType === "page_view") {
      const p = log.pathName || "/";
      pathCounts[p] = (pathCounts[p] || 0) + 1;
    }
  });

  const sortedPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Filter logs for table display
  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === "all" || log.eventType === filterType;
    const matchesSession =
      searchSession === "" ||
      log.sessionUid.toLowerCase().includes(searchSession.toLowerCase());
    return matchesType && matchesSession;
  });

  return (
    <div className="space-y-6 w-full text-left font-mono text-neutral-300" id="admin-analytics-view">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] text-amber-500 uppercase tracking-widest block font-bold">
            Live Intelligence Engine
          </span>
          <h2 className="text-xl md:text-2xl text-white font-serif font-light">
            Engagement & <span className="font-serif italic text-amber-500">Conversions</span>
          </h2>
          <p className="text-[10px] text-neutral-400 font-sans max-w-xl">
            Analyze visitor acquisition paths, menu exploration activity, and checkout conversion stats in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-bold text-neural-400">
            Live Stream Feed Active
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-4 text-neutral-500">
          <RefreshCw className="w-8 h-8 animate-spin stroke-1" />
          <p className="text-xs">Connecting to firestore telemetry pipeline...</p>
        </div>
      ) : (
        <>
          {/* Main Multi-Metric Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CARD 1: Total Footfall */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Users className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase font-black tracking-widest">
                  Unique Sessions
                </span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-sans font-black text-white">
                  {uniqueSessions.toLocaleString()}
                </h3>
                <p className="text-[9px] text-neutral-500 leading-none">
                  From {totalVisits.toLocaleString()} screen hits
                </p>
              </div>
            </div>

            {/* CARD 2: Menu Views */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Eye className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase font-black tracking-widest">
                  Menu Explorers
                </span>
                <Eye className="w-4 h-4 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-sans font-black text-white">
                  {menuExploration.toLocaleString()}
                </h3>
                <p className="text-[9px] text-neutral-500 leading-none">
                  {totalVisits > 0 ? ((menuExploration / totalVisits) * 100).toFixed(1) : 0}% click-through intensity
                </p>
              </div>
            </div>

            {/* CARD 3: Table Booking conversion */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <CalendarSync className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase font-black tracking-widest">
                  Booking Conversions
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-sans font-black text-white">
                  {reservationRate}%
                </h3>
                <p className="text-[9px] text-neutral-500 leading-none">
                  {reservationSuccesses} confirmed out of {reservationAttempts}
                </p>
              </div>
            </div>

            {/* CARD 4: Checkout conversions */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-3 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShoppingBag className="w-16 h-16 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase font-black tracking-widest">
                  Sales Conversions
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-sans font-black text-white">
                  {checkoutRate}%
                </h3>
                <p className="text-[9px] text-neutral-500 leading-none">
                  {checkoutSuccesses} paid out of {checkoutAttempts} attempts
                </p>
              </div>
            </div>

          </div>

          {/* Sub-layout: Path Analytics & Charts Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
            
            {/* Visual Conversion Funnel Chart */}
            <div className="lg:col-span-7 bg-[#121212] border border-neutral-850 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Interactive Conversion Pipeline Funnel</span>
                </h4>
              </div>

              <div className="space-y-4 font-sans text-xs pt-2">
                {/* Level 1: Page Hits */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-mono text-neutral-400">
                    <span>1. Landed Clients (All Page Views)</span>
                    <span className="text-white font-bold">{totalVisits} views (100%)</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-none border border-neutral-800">
                    <div className="bg-amber-600/45 h-full transition-all duration-500" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Level 2: Menu Views */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-mono text-neutral-400">
                    <span>2. Viewed Menus / Offers</span>
                    <span className="text-white font-bold">
                      {menuExploration} ({totalVisits > 0 ? ((menuExploration / totalVisits) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-none border border-neutral-800">
                    <div 
                      className="bg-amber-600/65 h-full transition-all duration-500" 
                      style={{ width: `${totalVisits > 0 ? (menuExploration / totalVisits) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                {/* Level 3: Booking Attempts */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-mono text-neutral-400">
                    <span>3. Reservation Bookings Initiated</span>
                    <span className="text-white font-bold">{reservationAttempts} clicks</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-none border border-neutral-800">
                    <div 
                      className="bg-neutral-700 h-full transition-all duration-500" 
                      style={{ width: `${totalVisits > 0 ? Math.min(100, (reservationAttempts / totalVisits) * 100) : 0}%` }} 
                    />
                  </div>
                </div>

                {/* Level 4: Checkout Completed */}
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between font-mono text-neutral-400">
                    <span>4. Final Payment / Conversion Secured</span>
                    <span className="text-emerald-400 font-bold">
                      {checkoutSuccesses + reservationSuccesses} total checkouts
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 h-2.5 rounded-none border border-neutral-800">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${totalVisits > 0 ? Math.min(100, ((checkoutSuccesses + reservationSuccesses) / totalVisits) * 100) : 0}%` }} 
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Popular Acquisition Landing Pages */}
            <div className="lg:col-span-5 bg-[#121212] border border-neutral-850 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Top Destination Clicks</span>
              </h4>

              <div className="space-y-3 font-sans text-xs pt-1">
                {sortedPaths.length > 0 ? (
                  sortedPaths.map(([path, qty], idx) => (
                    <div key={path} className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-4 h-4 bg-neutral-900 text-neutral-400 flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-[11px] text-neutral-200 font-mono tracking-tight">{path}</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-500 font-bold">{qty} views</span>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-500 text-[10px] py-10 text-center font-mono">
                    No directory hits logged yet.
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Interactive Logs Feed section */}
          <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6">
            
            {/* Filter and search parameters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Secure Auditing Logs Feed
                </h4>
                <p className="text-[9px] text-neutral-500 font-sans">
                  List of raw system interactions. Only accessible to system administrators.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-neutral-950 px-3 py-1.5 border border-neutral-850">
                  <span className="text-[9px] text-neutral-500 uppercase font-black">Event:</span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-transparent text-white focus:outline-none text-[10px] pr-2 cursor-pointer"
                  >
                    <option value="all" className="bg-[#121212]">ALL EVENTS</option>
                    <option value="page_view" className="bg-[#121212]">PAGE VIEWS</option>
                    <option value="menu_view" className="bg-[#121212]">MENU VIEWS</option>
                    <option value="reservation_attempt" className="bg-[#121212]">BOOKING ATTEMPT</option>
                    <option value="reservation_success" className="bg-[#121212]">BOOKING SUCCESS</option>
                    <option value="cart_view" className="bg-[#121212]">BASKET VIEWED</option>
                    <option value="checkout_attempt" className="bg-[#121212]">CHECKOUT INITIATE</option>
                    <option value="checkout_success" className="bg-[#121212]">PAID SUCCESS</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Filter by Session UID..."
                  value={searchSession}
                  onChange={(e) => setSearchSession(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 text-white p-1.5 text-[10px] w-full max-w-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-neutral-850 text-[9px] text-neutral-400 uppercase tracking-widest bg-neutral-950/20">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Action</th>
                    <th className="py-2.5 px-3">Path / Location</th>
                    <th className="py-2.5 px-3">Session UID</th>
                    <th className="py-2.5 px-3">Payload Details / Meta Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      let tagBg = "bg-neutral-900 border-neutral-800 text-neutral-400";
                      if (log.eventType === "page_view") tagBg = "bg-blue-950/20 border-blue-900/30 text-blue-400";
                      if (log.eventType === "menu_view") tagBg = "bg-sky-950/20 border-sky-900/30 text-sky-400";
                      if (log.eventType === "reservation_attempt" || log.eventType === "checkout_attempt") {
                        tagBg = "bg-amber-950/20 border-amber-900/40 text-amber-500";
                      }
                      if (log.eventType === "reservation_success" || log.eventType === "checkout_success") {
                        tagBg = "bg-emerald-950/20 border-emerald-900/40 text-emerald-400 font-bold";
                      }

                      // Format metadata print helper
                      const metadataString = log.metadata
                        ? Object.entries(log.metadata)
                            .filter(([k]) => k !== "userAgent" && k !== "screenResolution")
                            .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
                            .join(", ")
                        : "";

                      return (
                        <tr key={log.id} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="py-2.5 px-3 text-[10px] text-neutral-500">
                            {new Date(log.timestamp).toLocaleString("en-GB")}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider font-extrabold block w-fit ${tagBg}`}>
                              {log.eventType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400">{log.pathName}</td>
                          <td className="py-2.5 px-3 text-neutral-400 text-[10px]">
                            {log.sessionUid.startsWith("anon_") ? (
                              <span className="text-neutral-500 italic">Anon ({log.sessionUid.substring(5, 12)})</span>
                            ) : (
                              <span className="text-amber-500/80 font-bold">User ({log.sessionUid.substring(0, 8)})</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-500 text-[10px] max-w-xs overflow-hidden text-ellipsis">
                            {metadataString || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-500 text-xs">
                        No events found matching current criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
