import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import { 
  BarChart3, 
  Users, 
  CalendarSync, 
  ShoppingBag, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  Layers, 
  Calendar, 
  Clock, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from "recharts";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 p-2.5 shadow-2xl font-mono text-left select-none text-[10px]">
        <p className="text-amber-500 font-bold text-[10px] uppercase tracking-wider">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} className="text-neutral-350 mt-1 flex justify-between gap-4">
            <span className="text-neutral-450 font-sans">{pld.name}:</span>
            <span className="font-bold text-white font-mono">
              {pld.name === "Revenue" ? `₦${Number(pld.value).toLocaleString()}` : `${pld.value} unit(s)`}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalyticsPanel() {
  const [logs, setLogs] = useState<AnalyticsLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time restaurant orders for financial intelligence charting
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Date Range Filters State
  const [dateRangePreset, setDateRangePreset] = useState<"all" | "today" | "7days" | "30days" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Feed filtration state
  const [filterType, setFilterType] = useState<string>("all");
  const [searchSession, setSearchSession] = useState("");

  // Chart grouping active tab
  const [trendTab, setTrendTab] = useState<"dayOfWeek" | "hourly" | "dailyTimeline">("dayOfWeek");

  // Subscribe to raw interaction events
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

  // Subscribe to restaurant sales orders
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((snapDoc) => {
          list.push({ id: snapDoc.id, ...snapDoc.data() });
        });
        setOrders(list);
        setLoadingOrders(false);
      },
      (err) => {
        console.error("Firestore Orders collection stream failure:", err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter logs based on date range selected by user
  const dateFilteredLogs = logs.filter((log) => {
    if (!log.timestamp) return false;
    const logTime = new Date(log.timestamp).getTime();
    const now = new Date().getTime();

    if (dateRangePreset === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return logTime >= todayStart.getTime();
    }
    if (dateRangePreset === "7days") {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return logTime >= sevenDaysAgo;
    }
    if (dateRangePreset === "30days") {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return logTime >= thirtyDaysAgo;
    }
    if (dateRangePreset === "custom") {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (logTime < start.getTime()) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (logTime > end.getTime()) return false;
      }
    }
    return true;
  });

  // Filter orders based on date range selected by user
  const dateFilteredOrders = orders.filter((ord) => {
    if (!ord.timestamp) return false;
    const orderTime = Number(ord.timestamp);
    const now = new Date().getTime();

    if (dateRangePreset === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return orderTime >= todayStart.getTime();
    }
    if (dateRangePreset === "7days") {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      return orderTime >= sevenDaysAgo;
    }
    if (dateRangePreset === "30days") {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      return orderTime >= thirtyDaysAgo;
    }
    if (dateRangePreset === "custom") {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (orderTime < start.getTime()) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (orderTime > end.getTime()) return false;
      }
    }
    return true;
  });

  // Calculate stats metrics dynamically BASED ON CHOSEN DATE FILTER
  const totalVisits = dateFilteredLogs.filter((l) => l.eventType === "page_view").length;
  const menuExploration = dateFilteredLogs.filter((l) => l.eventType === "menu_view").length;
  
  // Reservations
  const reservationAttempts = dateFilteredLogs.filter((l) => l.eventType === "reservation_attempt").length;
  const reservationSuccesses = dateFilteredLogs.filter((l) => l.eventType === "reservation_success").length;
  const reservationRate =
    reservationAttempts > 0
      ? ((reservationSuccesses / reservationAttempts) * 100).toFixed(1)
      : "0.0";

  // Checkouts
  const checkoutAttempts = dateFilteredLogs.filter((l) => l.eventType === "checkout_attempt").length;
  const checkoutSuccesses = dateFilteredLogs.filter((l) => l.eventType === "checkout_success").length;
  const checkoutRate =
    checkoutAttempts > 0
      ? ((checkoutSuccesses / checkoutAttempts) * 100).toFixed(1)
      : "0.0";

  // Unique Visitors (Sessions)
  const uniqueSessions = new Set(dateFilteredLogs.map((l) => l.sessionUid)).size;

  // Most visited paths
  const pathCounts: Record<string, number> = {};
  dateFilteredLogs.forEach((log) => {
    if (log.eventType === "page_view") {
      const p = log.pathName || "/";
      pathCounts[p] = (pathCounts[p] || 0) + 1;
    }
  });

  const sortedPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Filter logs for bottom raw table display
  const filteredTableLogs = dateFilteredLogs.filter((log) => {
    const matchesType = filterType === "all" || log.eventType === filterType;
    const matchesSession =
      searchSession === "" ||
      log.sessionUid.toLowerCase().includes(searchSession.toLowerCase());
    return matchesType && matchesSession;
  });

  // ================= RECHARTS: Daily Revenue Trend Calculation =================
  const revenueMap: Record<string, { date: string; revenue: number; ordersCount: number; timestamp: number }> = {};
  dateFilteredOrders.forEach((ord) => {
    if (!ord.timestamp) return;
    const d = new Date(Number(ord.timestamp));
    const dateKey = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short"
    });
    // Start of that day for correct sorting order
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (!revenueMap[dateKey]) {
      revenueMap[dateKey] = {
        date: dateKey,
        revenue: 0,
        ordersCount: 0,
        timestamp: dayStart
      };
    }
    revenueMap[dateKey].revenue += Number(ord.totalPrice || 0);
    revenueMap[dateKey].ordersCount += 1;
  });

  const dailyRevenueData = Object.values(revenueMap)
    .sort((a, b) => a.timestamp - b.timestamp);

  // ================= RECHARTS: Popular Food Items Sold Calculation =================
  const itemsMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  dateFilteredOrders.forEach((ord) => {
    const items = ord.items || [];
    items.forEach((it: any) => {
      const name = it.name || "Unknown Dish";
      const qty = Number(it.quantity || 0);
      const price = Number(it.price || 0);
      if (!itemsMap[name]) {
        itemsMap[name] = { name, quantity: 0, revenue: 0 };
      }
      itemsMap[name].quantity += qty;
      itemsMap[name].revenue += qty * price;
    });
  });

  const popularItemsData = Object.values(itemsMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // ================= GRAPH 1: Day of Week distribution (Weekly Trend to know when they sell more/less) =================
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekStats = daysOfWeek.map((day, idx) => {
    const dayLogs = dateFilteredLogs.filter((l) => {
      return new Date(l.timestamp).getDay() === idx;
    });
    const checkouts = dayLogs.filter((l) => l.eventType === "checkout_success").length;
    const reservations = dayLogs.filter((l) => l.eventType === "reservation_success").length;
    const views = dayLogs.filter((l) => l.eventType === "page_view").length;
    const combinedConversions = checkouts + reservations;
    return { day, checkouts, reservations, views, combinedConversions };
  });

  // Calculate peaks and lows for the Days of Week trend
  const sortedBySales = [...dayOfWeekStats].sort((a, b) => b.checkouts - a.checkouts);
  const peakSalesDay = sortedBySales[0]?.checkouts > 0 ? sortedBySales[0] : null;
  const lowestSalesDay = sortedBySales[sortedBySales.length - 1]?.checkouts >= 0 ? sortedBySales[sortedBySales.length - 1] : null;

  const sortedByBookings = [...dayOfWeekStats].sort((a, b) => b.reservations - a.reservations);
  const peakBookingsDay = sortedByBookings[0]?.reservations > 0 ? sortedByBookings[0] : null;

  // ================= GRAPH 2: Hourly Activity Slots =================
  const hourlyRanges = [
    { label: "Night (22:00 - 06:00)", hours: [22, 23, 0, 1, 2, 3, 4, 5], color: "from-purple-950 to-neutral-900" },
    { label: "Morning (06:00 - 12:00)", hours: [6, 7, 8, 9, 10, 11], color: "from-amber-950 to-neutral-900" },
    { label: "Afternoon (12:00 - 17:00)", hours: [12, 13, 14, 15, 16], color: "from-orange-950 to-neutral-900" },
    { label: "Evening (17:00 - 22:00)", hours: [17, 18, 19, 20, 21], color: "from-indigo-950 to-neutral-900" }
  ];
  const hourlyStats = hourlyRanges.map((range) => {
    const rangeLogs = dateFilteredLogs.filter((l) => {
      const h = new Date(l.timestamp).getHours();
      return range.hours.includes(h);
    });
    const checkouts = rangeLogs.filter((l) => l.eventType === "checkout_success").length;
    const reservations = rangeLogs.filter((l) => l.eventType === "reservation_success").length;
    const views = rangeLogs.filter((l) => l.eventType === "page_view").length;
    const combinedConversions = checkouts + reservations;
    return { label: range.label, checkouts, reservations, views, combinedConversions, color: range.color };
  });

  const sortedHourly = [...hourlyStats].sort((a, b) => b.combinedConversions - a.combinedConversions);
  const peakHourSlot = sortedHourly[0]?.combinedConversions > 0 ? sortedHourly[0] : null;

  // ================= GRAPH 3: Daily Timeline Trends (Chronological bar graph) =================
  const timelineMap: Record<string, { checkouts: number; reservations: number; views: number }> = {};
  dateFilteredLogs.forEach((l) => {
    const dateStr = new Date(l.timestamp).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short"
    });
    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { checkouts: 0, reservations: 0, views: 0 };
    }
    if (l.eventType === "checkout_success") timelineMap[dateStr].checkouts++;
    if (l.eventType === "reservation_success") timelineMap[dateStr].reservations++;
    if (l.eventType === "page_view") timelineMap[dateStr].views++;
  });

  const dailyTimelineStats = Object.entries(timelineMap)
    .map(([date, val]) => ({ date, ...val }))
    .reverse() // Keep Chronological left-to-right (newest at the end, so reverse from Firestore 'desc' state)
    .slice(-12); // Limit to last 12 active billing/telemetry days for layout fidelity

  return (
    <div className="space-y-6 w-full text-left font-mono text-neutral-300 animate-fadeIn" id="admin-analytics-view">
      
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
            Analyze visitor footfall, page hits, reservation checkout conversion rates and group trends by Date & Time.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] tracking-wider uppercase font-bold text-neutral-400">
            Live Stream Feed Active
          </span>
        </div>
      </div>

      {/* NEW SECTION: Master Date Range Filter Tools */}
      <div className="bg-[#121212] border border-neutral-850 p-4 space-y-3" id="admin-date-ranges-widget">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h4 className="text-xs font-bold text-amber-500 uppercase flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Time-Domain Range Filter</span>
          </h4>
          <span className="text-[10px] text-neutral-500">
            Currently tracking: <strong className="text-neutral-350">{dateFilteredLogs.length} events</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Presets Row */}
          <div className="md:col-span-7 flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "ALL TIME" },
              { id: "today", label: "TODAY" },
              { id: "7days", label: "LAST 7 DAYS" },
              { id: "30days", label: "LAST 30 DAYS" },
              { id: "custom", label: "CUSTOM RANGE" }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setDateRangePreset(preset.id as any)}
                className={`px-3 py-1.5 text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-all border ${
                  dateRangePreset === preset.id
                    ? "bg-amber-600 border-amber-600 text-white shadow"
                    : "bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-white"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Form */}
          {dateRangePreset === "custom" && (
            <div className="md:col-span-5 flex flex-row items-center gap-2" id="custom-date-inputs">
              <input
                type="date"
                title="Start Date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-neutral-950 border border-neutral-850 text-white p-1 text-[10px] w-full focus:outline-none focus:border-amber-500"
              />
              <span className="text-neutral-500 text-[9px]">TO</span>
              <input
                type="date"
                title="End Date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-neutral-950 border border-neutral-850 text-white p-1 text-[10px] w-full focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
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
                  {totalVisits > 0 ? ((menuExploration / totalVisits) * 100).toFixed(1) : 0}% click-through rate
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
                  {reservationSuccesses} confirmed / {reservationAttempts} logs
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
                  {checkoutSuccesses} sales / {checkoutAttempts} checkout intents
                </p>
              </div>
            </div>

          </div>

          {/* DYNAMIC TRENDS & PERFORMANCE HIGHLIGHTS SECTION */}
          <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6" id="engagement-trends-grouping-panel">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-850 pb-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Engagement and Conversions Trend Analyzer</span>
                </h4>
                <p className="text-[9px] text-neutral-400 font-sans">
                  Choose grouping format below to discover optimal sales peaks & high-traffic operating days.
                </p>
              </div>

              {/* Grouping Selectors */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 border border-neutral-850 self-start md:self-center">
                <button
                  onClick={() => setTrendTab("dayOfWeek")}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    trendTab === "dayOfWeek" ? "bg-amber-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  📅 Weekly Day-by-Day
                </button>
                <button
                  onClick={() => setTrendTab("hourly")}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    trendTab === "hourly" ? "bg-amber-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  🕒 Hourly Buckets
                </button>
                <button
                  onClick={() => setTrendTab("dailyTimeline")}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    trendTab === "dailyTimeline" ? "bg-amber-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  📈 Continuous Timeline
                </button>
              </div>
            </div>

            {/* Smart Insights Badge explaining Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Insight 1: Sales Peak */}
              <div className="bg-neutral-950 border border-neutral-850/50 p-3 flex items-start gap-3">
                <div className="p-2 bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 rounded-none mt-1">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-neutral-500 font-black tracking-wider uppercase block">Peak Sales Trend Spot</span>
                  <p className="text-[11px] text-neutral-250">
                    {peakSalesDay ? (
                      <>
                        <strong className="text-white font-sans">{peakSalesDay.day}</strong> generates the highest sales volume (
                        <span className="text-emerald-400 font-bold font-mono">{peakSalesDay.checkouts} paid checkouts</span>).
                      </>
                    ) : (
                      "Waiting for transaction data..."
                    )}
                  </p>
                </div>
              </div>

              {/* Insight 2: Sales Low */}
              <div className="bg-neutral-950 border border-neutral-850/50 p-3 flex items-start gap-3">
                <div className="p-2 bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-none mt-1">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-neutral-500 font-black tracking-wider uppercase block">Lowest Sales Day</span>
                  <p className="text-[11px] text-neutral-250">
                    {lowestSalesDay && lowestSalesDay.checkouts >= 0 ? (
                      <>
                        The quietest business day is <strong className="text-white font-sans">{lowestSalesDay.day}</strong> with {" "}
                        <span className="text-amber-500 font-bold font-mono">{lowestSalesDay.checkouts} paid orders</span>.
                      </>
                    ) : (
                      "Waiting for logs..."
                    )}
                  </p>
                </div>
              </div>

              {/* Insight 3: Hourly Peak */}
              <div className="bg-neutral-950 border border-neutral-850/50 p-3 flex items-start gap-3">
                <div className="p-2 bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 rounded-none mt-1">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-neutral-500 font-black tracking-wider uppercase block">Optimal Hour Distribution</span>
                  <p className="text-[11px] text-neutral-250">
                    {peakHourSlot ? (
                      <>
                        <strong className="text-white font-sans">{peakHourSlot.label}</strong> represents peak traffic intensity with {" "}
                        <span className="text-indigo-300 font-bold font-mono">{peakHourSlot.combinedConversions} successful actions</span>.
                      </>
                    ) : (
                      "Gathering hourly distributions..."
                    )}
                  </p>
                </div>
              </div>

            </div>

            {/* Render Selected Dynamic Chart visualizer */}
            {trendTab === "dayOfWeek" && (
              <div className="space-y-4" id="distribution-dayofweek-container">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Weekly conversion metrics per calendar day</span>
                  <span className="text-[9px] text-neutral-500">Includes secure checkout payment successes and booking validations</span>
                </div>

                <div className="space-y-3 pt-2">
                  {dayOfWeekStats.map((item) => {
                    const maxConversions = Math.max(...dayOfWeekStats.map(s => s.combinedConversions), 1);
                    const fillPercentage = ((item.combinedConversions / maxConversions) * 100).toFixed(0);
                    
                    const isPeak = peakSalesDay?.day === item.day && item.checkouts > 0;
                    const isQuiet = lowestSalesDay?.day === item.day && item.checkouts >= 0;

                    return (
                      <div key={item.day} className="group relative bg-[#0f0f0f] border border-neutral-900/40 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-neutral-850 transition-colors">
                        
                        {/* Day label */}
                        <div className="w-32 flex items-center gap-2">
                          <span className="text-xs font-sans font-bold text-white uppercase">{item.day}</span>
                          {isPeak && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/35 text-[8px] tracking-tight uppercase text-emerald-400 font-black leading-none">
                              Peak
                            </span>
                          )}
                          {isQuiet && !isPeak && (
                            <span className="px-1.5 py-0.5 bg-rose-500/5 border border-rose-500/20 text-[8px] tracking-tight uppercase text-rose-400 font-semibold leading-none">
                              Low
                            </span>
                          )}
                        </div>

                        {/* Relative meter line */}
                        <div className="flex-1 min-w-[200px] h-3 bg-neutral-950 border border-neutral-900 overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-700 bg-gradient-to-r ${isPeak ? "from-emerald-700 to-emerald-500" : "from-amber-700 to-amber-500"}`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>

                        {/* Conversions counters */}
                        <div className="w-64 flex items-center justify-end gap-3 font-mono text-[10px]">
                          <span className="text-neutral-400">
                            🛒 Sales: <strong className="text-white">{item.checkouts}</strong>
                          </span>
                          <span className="text-neutral-400">
                            📅 Bookings: <strong className="text-white">{item.reservations}</strong>
                          </span>
                          <span className="text-neutral-500 font-sans">
                            (Views: {item.views})
                          </span>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {trendTab === "hourly" && (
              <div className="space-y-4" id="distribution-hourly-container">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Shift pattern and operation peak intervals</span>
                  <span className="text-[9px] text-neutral-500">Displays performance mapped across diurnal quarters</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {hourlyStats.map((item) => {
                    const maxConversions = Math.max(...hourlyStats.map(s => s.combinedConversions), 1);
                    const fillPercentage = ((item.combinedConversions / maxConversions) * 100).toFixed(0);

                    return (
                      <div key={item.label} className="bg-neutral-950 border border-neutral-900 p-4 space-y-3 hover:border-neutral-850">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[11px] uppercase tracking-wider text-white font-bold">{item.label}</h5>
                          <span className="text-[10px] font-bold text-amber-500">{item.combinedConversions} conversions</span>
                        </div>

                        {/* Bar tracker */}
                        <div className="h-2 w-full bg-neutral-900 border border-neutral-850/40 relative">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.color} to-amber-500`}
                            style={{ width: `${fillPercentage}%` }}
                          />
                        </div>

                        {/* Metrics print */}
                        <div className="flex justify-between items-center text-[10px] text-neutral-450 font-mono">
                          <span>Orders: <strong className="text-neutral-200">{item.checkouts}</strong></span>
                          <span>Reservations: <strong className="text-neutral-200">{item.reservations}</strong></span>
                          <span>Screen Views: <strong className="text-neutral-200">{item.views}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {trendTab === "dailyTimeline" && (
              <div className="space-y-4" id="distribution-timeline-container">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Chronological daily performance run</span>
                  <span className="text-[9px] text-neutral-500">Limited to past 12 consecutive active logging days</span>
                </div>

                {dailyTimelineStats.length > 0 ? (
                  <div className="pt-4 pb-2">
                    {/* Main spark graph grid columns side-by-side representing days */}
                    <div className="flex flex-row items-end justify-between gap-2 h-44 bg-neutral-950 p-4 border border-neutral-850" id="visual-timeline-chart-stage">
                      {dailyTimelineStats.map((item) => {
                        const totalCombined = item.checkouts + item.reservations;
                        const maxTimelineValue = Math.max(...dailyTimelineStats.map(s => s.checkouts + s.reservations), 1);
                        const relativeHeightPct = ((totalCombined / maxTimelineValue) * 100).toFixed(0);

                        return (
                          <div key={item.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2 group/col relative">
                            
                            {/* Hover info label */}
                            <div className="absolute bottom-full mb-2 bg-neutral-900 border border-neutral-800 p-2 text-[9px] text-neutral-300 pointer-events-none opacity-0 group-hover/col:opacity-100 transition-opacity z-50 rounded-none whitespace-nowrap min-w-[100px] shadow-lg">
                              <span className="block text-amber-500 font-bold mb-0.5">{item.date}</span>
                              <span className="block text-emerald-400">Paid: {item.checkouts}</span>
                              <span className="block text-indigo-400">Booked: {item.reservations}</span>
                              <span className="block text-neutral-400">Views: {item.views}</span>
                            </div>

                            {/* Column bars */}
                            <div className="w-full flex flex-col justify-end items-center h-full relative">
                              
                              {/* Stack checkouts */}
                              {item.checkouts > 0 && (
                                <div 
                                  className="w-4 bg-emerald-500 hover:bg-emerald-400 border border-emerald-600/30 transition-all cursor-pointer"
                                  style={{ height: `${(item.checkouts / maxTimelineValue) * 100}%` }}
                                  title={`Paid Checkouts: ${item.checkouts}`}
                                />
                              )}

                              {/* Stack reservations */}
                              {item.reservations > 0 && (
                                <div 
                                  className="w-4 bg-amber-500 hover:bg-amber-400 border border-amber-600/30 transition-all cursor-pointer"
                                  style={{ height: `${(item.reservations / maxTimelineValue) * 100}%` }}
                                  title={`Reservations: ${item.reservations}`}
                                />
                              )}

                              {/* If no conversion but only views, render tiny indicator pin */}
                              {totalCombined === 0 && (
                                <div className="w-1.5 h-1.5 bg-neutral-800 rounded-none mb-1" />
                              )}
                            </div>

                            {/* Date signet */}
                            <span className="text-[8px] font-mono font-bold tracking-tighter text-neutral-500 transform group-hover/col:text-amber-500 transition-colors uppercase">
                              {item.date}
                            </span>

                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Legend key indicator */}
                    <div className="flex items-center justify-center gap-5 mt-4 text-[9px] font-bold text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 inline-block border border-emerald-600/30" />
                        <span>PAID CART CHECKOUTS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-amber-500 inline-block border border-amber-600/30" />
                        <span>TABLE RESERVATIONS</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-neutral-800 inline-block" />
                        <span>VISITS BUT NO CONVERSION</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <p className="py-12 border border-neutral-900 bg-neutral-950 text-center text-neutral-500 text-xs">
                    No data timelines mapped in selected time interval.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* RECHARTS INTEL ENGINE: Daily Revenue & Popular Dishes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4" id="recharts-financial-analytics-panel">
            
            {/* Chart 1: Daily Revenue Trends */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-4 flex flex-col justify-between" id="recharts-revenue-trend-card">
              <div>
                <span className="text-[9px] text-amber-500 uppercase tracking-widest block font-bold mb-1">
                  Financial Performance Index
                </span>
                <h4 className="text-sm font-bold text-white uppercase flex items-center gap-1.5 font-mono">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span>Daily Revenue Trends (Recharts)</span>
                </h4>
                <p className="text-[10px] text-neutral-450 font-sans mt-0.5">
                  Chronological tracking of checkout billing successes in Nigerian Naira (₦).
                </p>
              </div>

              <div className="h-72 w-full pt-4 flex items-center justify-center">
                {dailyRevenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#212121" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#737373" 
                        tick={{ fontSize: 9, fontFamily: "monospace" }} 
                      />
                      <YAxis 
                        stroke="#737373" 
                        tick={{ fontSize: 9, fontFamily: "monospace" }}
                        tickFormatter={(val) => `₦${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10 }} 
                        verticalAlign="bottom"
                        align="center"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        name="Revenue" 
                        stroke="#f59e0b" 
                        activeDot={{ r: 6 }} 
                        strokeWidth={2}
                        dot={{ r: 4, stroke: "#121212", strokeWidth: 1.5, fill: "#f59e0b" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 space-y-2 font-mono">
                    <TrendingDown className="w-8 h-8 mx-auto text-neutral-700" />
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">No Revenue Logs Found</p>
                    <p className="text-[9px] text-neutral-600 max-w-xs mx-auto">
                      Place orders using checkout options to populate Naira transaction graphs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Most Popular Food Items Sold */}
            <div className="bg-[#121212] border border-neutral-850 p-5 space-y-4 flex flex-col justify-between" id="recharts-popular-items-card">
              <div>
                <span className="text-[9px] text-amber-500 uppercase tracking-widest block font-bold mb-1">
                  Product Popularity Index
                </span>
                <h4 className="text-sm font-bold text-white uppercase flex items-center gap-1.5 font-mono">
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>Top Ordered Food Items (Recharts)</span>
                </h4>
                <p className="text-[10px] text-neutral-450 font-sans mt-0.5">
                  Distribution of dish counts purchased over the chosen time range.
                </p>
              </div>

              <div className="h-72 w-full pt-4 flex items-center justify-center">
                {popularItemsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={popularItemsData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#212121" horizontal={false} />
                      <XAxis 
                        type="number" 
                        stroke="#737373" 
                        tick={{ fontSize: 9, fontFamily: "monospace" }} 
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#737373" 
                        tick={{ fontSize: 8, fontFamily: "sans-serif" }} 
                        width={90}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10 }} 
                        verticalAlign="bottom"
                        align="center"
                      />
                      <Bar 
                        dataKey="quantity" 
                        name="Units Sold" 
                        fill="#f59e0b" 
                        radius={[0, 4, 4, 0]}
                      >
                        {popularItemsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index % 2 === 0 ? "#f59e0b" : "#d97706"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 space-y-2 font-mono">
                    <ShoppingBag className="w-8 h-8 mx-auto text-neutral-700" />
                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">No Menu Item Sales Found</p>
                    <p className="text-[9px] text-neutral-600 max-w-xs mx-auto">
                      Menu item purchase quantities will render dynamically as orders arrive.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sub-layout: Path Analytics & Funnels */}
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
                    No directory hits logged yet in filtered domains.
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
                    className="bg-transparent text-white focus:outline-none text-[10px] pr-2 cursor-pointer pr-1"
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
                  className="bg-neutral-950 border border-neutral-850 text-white p-1.5 text-[10px] w-full max-w-xs focus:outline-none focus:border-amber-500 font-mono"
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
                  {filteredTableLogs.length > 0 ? (
                    filteredTableLogs.map((log) => {
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
