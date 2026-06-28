import React, { useState, useEffect, useRef } from "react";
import { ChefHat, Flame, Truck, CheckCircle2, RefreshCw, Clock, MapPin, MessageSquare } from "lucide-react";
import { doc, onSnapshot, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import LiveChat from "./LiveChat";


interface CustomerOrderMapProps {
  activeOrder: any;
  leafletLoaded: boolean;
  getStableCoords: (address: string, id: string) => { lat: number; lng: number };
}

function CustomerGoogleOrderMap({ activeOrder, getStableCoords }: { activeOrder: any; getStableCoords: any }) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const orderLat = activeOrder.latitude ?? activeOrder.lat ?? activeOrder.deliveryLatitude ?? getStableCoords(activeOrder.address, activeOrder.id).lat;
  const orderLng = activeOrder.longitude ?? activeOrder.lng ?? activeOrder.deliveryLongitude ?? getStableCoords(activeOrder.address, activeOrder.id).lng;

  const rLat = activeOrder.riderLatitude;
  const rLng = activeOrder.riderLongitude;

  // Let's model the baseline restaurant position
  const kitchenLat = 6.4527;
  const kitchenLng = 3.3932;

  // 1. Smooth interpolation states
  const [visualRiderPos, setVisualRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [visualHeading, setVisualHeading] = useState<number>(0);
  const prevRiderPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (rLat === undefined || rLng === undefined || rLat === null || rLng === null) {
      setVisualRiderPos(null);
      prevRiderPosRef.current = null;
      return;
    }

    const targetPos = { lat: rLat, lng: rLng };

    if (!prevRiderPosRef.current) {
      // Initial state
      setVisualRiderPos(targetPos);
      prevRiderPosRef.current = targetPos;
      return;
    }

    // Cancel active animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startPos = prevRiderPosRef.current;
    const startTime = performance.now();
    const duration = 4000; // interpolate over 4 seconds

    // Calculate heading/bearing
    const dy = targetPos.lat - startPos.lat;
    const dx = targetPos.lng - startPos.lng;
    if (Math.abs(dy) > 1e-6 || Math.abs(dx) > 1e-6) {
      // Convert to degrees (90 - angle to make 0 deg point North)
      const angle = Math.atan2(dx, dy) * (180 / Math.PI);
      setVisualHeading(angle);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = startPos.lat + (targetPos.lat - startPos.lat) * progress;
      const currentLng = startPos.lng + (targetPos.lng - startPos.lng) * progress;

      const currentPos = { lat: currentLat, lng: currentLng };
      setVisualRiderPos(currentPos);
      prevRiderPosRef.current = currentPos;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [rLat, rLng]);

  // 2. Fetch routes and draw beautifully
  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const startLat = (visualRiderPos?.lat !== undefined) ? visualRiderPos.lat : kitchenLat;
    const startLng = (visualRiderPos?.lng !== undefined) ? visualRiderPos.lng : kitchenLng;

    routesLib.Route.computeRoutes({
      origin: { lat: startLat, lng: startLng },
      destination: { lat: orderLat, lng: orderLng },
      travelMode: "DRIVING",
      fields: ["path", "viewport"],
    })
      .then(({ routes }) => {
        if (routes?.[0]) {
          const newPolylines = routes[0].createPolylines();
          newPolylines.forEach((p) => {
            p.setOptions({
              strokeColor: "#3b82f6", // Uber-like neon blue
              strokeWeight: 6,
              strokeOpacity: 0.9,
            });
            p.setMap(map);
          });
          polylinesRef.current = newPolylines;

          if (routes[0].viewport) {
            map.fitBounds(routes[0].viewport);
          }
        }
      })
      .catch((err) => {
        console.warn("Google Routes API compute failed, using standard straight-line fallback:", err);
        const flightPoly = new google.maps.Polyline({
          path: [
            { lat: startLat, lng: startLng },
            { lat: orderLat, lng: orderLng },
          ],
          strokeColor: "#d97706",
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });
        flightPoly.setMap(map);
        polylinesRef.current = [flightPoly];

        // Zoom map to cover points
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: startLat, lng: startLng });
        bounds.extend({ lat: orderLat, lng: orderLng });
        map.fitBounds(bounds);
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [routesLib, map, orderLat, orderLng, visualRiderPos]);

  return (
    <>
      {/* 1. Kitchen Location */}
      <AdvancedMarker position={{ lat: kitchenLat, lng: kitchenLng }} title="Upside Sanctuary Kitchen">
        <div className="bg-black text-amber-500 rounded-full p-1 border-2 border-amber-500 shadow-md flex items-center justify-center font-bold text-[11px] animate-pulse" style={{ width: "28px", height: "28px", boxShadow: "0 0 12px rgba(245, 158, 11, 0.55)" }}>
          🍳
        </div>
      </AdvancedMarker>

      {/* 2. Customer Destination */}
      <AdvancedMarker position={{ lat: orderLat, lng: orderLng }} title="Your Sanctuary Venue">
        <div className="bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-md flex items-center justify-center font-bold text-xs" style={{ width: "28px", height: "28px" }}>
          📍
        </div>
      </AdvancedMarker>

      {/* 3. Smooth animated Rider Location */}
      {visualRiderPos && (
        <AdvancedMarker position={visualRiderPos} title="Upside Express Rider">
          <div style={{ width: "40px", height: "40px" }} className="flex items-center justify-center">
            <div
              style={{
                transform: `rotate(${visualHeading}deg)`,
                transition: "transform 0.3s ease-out",
                boxShadow: "0 0 14px rgba(59, 130, 246, 0.85)",
              }}
              className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white text-base animate-pulse"
            >
              🏍️
            </div>
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}

function CustomerOrderMap({ activeOrder, leafletLoaded, getStableCoords }: CustomerOrderMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);

  const orderLat = activeOrder.latitude ?? activeOrder.lat ?? activeOrder.deliveryLatitude ?? getStableCoords(activeOrder.address, activeOrder.id).lat;
  const orderLng = activeOrder.longitude ?? activeOrder.lng ?? activeOrder.deliveryLongitude ?? getStableCoords(activeOrder.address, activeOrder.id).lng;

  const rLat = activeOrder.riderLatitude;
  const rLng = activeOrder.riderLongitude;

  // Let's model the baseline restaurant position
  const kitchenLat = 6.4527;
  const kitchenLng = 3.3932;

  // Detect Google Maps API Key
  const GOOGLE_MAPS_KEY =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    "";
  const hasGoogleKey = Boolean(GOOGLE_MAPS_KEY) && GOOGLE_MAPS_KEY !== "YOUR_API_KEY" && GOOGLE_MAPS_KEY !== "";

  // Dynamic state for free OSRM road coordinates
  const [roadCoords, setRoadCoords] = React.useState<[number, number][]>([]);

  React.useEffect(() => {
    if (hasGoogleKey) return;
    
    let isMounted = true;
    const fetchOSRMRoute = async () => {
      try {
        const startLat = (rLat !== undefined && rLat !== null) ? rLat : kitchenLat;
        const startLng = (rLng !== undefined && rLng !== null) ? rLng : kitchenLng;
        const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${orderLng},${orderLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM routing failed");
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.geometry?.coordinates && isMounted) {
          const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          setRoadCoords(coords);
        }
      } catch (err) {
        console.warn("OSRM routing query failed, falling back to street grid:", err);
      }
    };

    fetchOSRMRoute();
    return () => {
      isMounted = false;
    };
  }, [orderLat, orderLng, rLat, rLng, hasGoogleKey]);

  // Generates a descriptive street grid representation for high fidelity aesthetics
  const getStreetPath = (p1: [number, number], p2: [number, number], seed: string) => {
    const [lat1, lng1] = p1;
    const [lat2, lng2] = p2;
    
    let hash = 0;
    const key = String(seed || "upside");
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const factor = (Math.abs(hash) % 10) / 10;

    // Build a realistic multi-segment grid turn fitting actual Lagos layout
    const latMid = lat1 + (lat2 - lat1) * (0.35 + factor * 0.3);
    const lngMid = lng1 + (lng2 - lng1) * (0.4 + (1 - factor) * 0.35);

    return [
      [lat1, lng1],
      [latMid, lng1],
      [latMid, lngMid],
      [lat2, lngMid],
      [lat2, lng2]
    ];
  };

  React.useEffect(() => {
    if (hasGoogleKey) return; // Skip Leaflet setup if Google Maps is active
    if (!leafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (mapRef.current) {
      mapRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([orderLat, orderLng], 14);

    mapRef.current = map;

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors © CARTO"
    }).addTo(map);

    // 1. Kitchen (Origin) Pin setup
    const kitchenIcon = L.divIcon({
      html: `<div class="bg-black text-amber-500 rounded-full p-1 border-2 border-amber-500 shadow-md flex items-center justify-center font-bold text-[11px] animate-pulse" style="width:28px;height:28px;box-shadow: 0 0 12px rgba(245, 158, 11, 0.55);">🍳</div>`,
      className: "custom-icon-kitchen",
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    L.marker([kitchenLat, kitchenLng], { icon: kitchenIcon })
      .addTo(map)
      .bindPopup("<b>Upside Sanctuary Kitchen</b><br/>IKATE LEKKI (Origin of Hot Plate Gastronomy)");

    // 2. Customer Location Pin
    const customerIcon = L.divIcon({
      html: `<div class="bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-md flex items-center justify-center font-bold text-[11px]" style="width:28px;height:28px;">📍</div>`,
      className: "custom-icon-pin",
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    L.marker([orderLat, orderLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>Your Venue</b><br/>${activeOrder.address || "Delivery destination"}`);

    if (rLat !== undefined && rLng !== undefined && rLat !== null && rLng !== null) {
      // 3. Rider active Location Pin
      const riderIcon = L.divIcon({
        html: `<div class="bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-md flex items-center justify-center font-bold text-xs animate-bounce" style="width:28px;height:28px;box-shadow: 0 0 10px rgba(59, 130, 246, 0.75);">🏍️</div>`,
        className: "custom-icon-rider",
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      L.marker([rLat, rLng], { icon: riderIcon })
        .addTo(map)
        .bindPopup("<b>Express Rider</b><br/>En route with your hot meal!")
        .openPopup();

      // Subtle covered transit corridor (Kitchen to Rider position)
      const pathKitchenToRider = getStreetPath([kitchenLat, kitchenLng], [rLat, rLng], (activeOrder.id || "rider") + "_covered");
      L.polyline(pathKitchenToRider, {
        color: "#6b7280", // Slate gray trail for completed leg
        weight: 3,
        dashArray: "4, 6",
        opacity: 0.5,
        lineCap: "round"
      }).addTo(map);

      // Active dispatch delivery route (Rider position to Customer)
      // We use the high-fidelity street grid path starting precisely at the rider's live coordinate
      // to ensure the active blue route line is always perfectly aligned and updated in real-time.
      const pathRiderToCustomer = getStreetPath([rLat, rLng], [orderLat, orderLng], (activeOrder.id || "customer") + "_active");
      
      // Deep blue outline glow
      L.polyline(pathRiderToCustomer, {
        color: "#3b82f6",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Light blue neon core
      L.polyline(pathRiderToCustomer, {
        color: "#60a5fa",
        weight: 2,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Focus bounds specifically on the Rider's current position and the Customer's destination
      const bounds = L.latLngBounds([[rLat, rLng], [orderLat, orderLng]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // No dispatched rider live yet - draw predicted route line from Kitchen directly to customer
      const pathKitchenToCustomer = roadCoords.length > 0
        ? roadCoords
        : getStreetPath([kitchenLat, kitchenLng], [orderLat, orderLng], (activeOrder.id || "direct") + "_predicted");
      
      // Warm gold planning route
      L.polyline(pathKitchenToCustomer, {
        color: "#d97706",
        weight: 4.5,
        dashArray: "8, 8",
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Light glow core
      L.polyline(pathKitchenToCustomer, {
        color: "#fbbf24",
        weight: 1.5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Show Kitchen and Destination bounds
      const bounds = L.latLngBounds([[kitchenLat, kitchenLng], [orderLat, orderLng]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, orderLat, orderLng, rLat, rLng, hasGoogleKey, roadCoords]);

  if (hasGoogleKey) {
    return (
      <div className="bg-[#121212] border border-neutral-800 p-2 relative overflow-hidden" id="customer-tracker-map-box">
        <div className="p-2 border-b border-neutral-850 flex justify-between items-center bg-neutral-950">
          <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-black flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Live Uber-Style GPS Radar (Google Maps)
          </span>
          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-neutral-900 px-2 py-0.5 font-bold border border-neutral-800">
            📡 Live Road Tracking Active
          </span>
        </div>

        <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
          <div className="w-full h-64 bg-neutral-900 border border-neutral-850 relative" style={{ minHeight: "280px" }}>
            <Map
              defaultCenter={{ lat: orderLat, lng: orderLng }}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              style={{ width: "100%", height: "100%" }}
              disableDefaultUI={true}
              zoomControl={true}
            >
              <CustomerGoogleOrderMap activeOrder={activeOrder} getStableCoords={getStableCoords} />
            </Map>
          </div>
        </APIProvider>

        <div className="mt-2 bg-neutral-950 p-2.5 border border-neutral-850 grid grid-cols-2 md:grid-cols-3 gap-2 text-[9px] font-mono tracking-wider uppercase text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-2 bg-amber-500 rounded" />
            <span>🍳 Kitchen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-2 bg-blue-500 rounded" />
            <span>🏍️ Rider (Gliding Roads)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4.5 h-4.5 text-center leading-none text-xs">📍</span>
            <span>Venue Sanctuary</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212] border border-neutral-800 p-2 relative overflow-hidden" id="customer-tracker-map-box">
      <div className="p-2 border-b border-neutral-850 flex justify-between items-center bg-neutral-950">
        <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-black flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          {roadCoords.length > 0 ? "Live Courier GPS Dispatch (Free OSRM Road Router)" : "Live Courier GPS Dispatch (Voyager Fallback)"}
        </span>
        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest bg-neutral-900 px-2 py-0.5 font-bold border border-neutral-800">
          {rLat !== undefined && rLng !== undefined && rLat !== null && rLng !== null
            ? "📡 Signals Live & Active"
            : (activeOrder?.status === "Out for Delivery" || activeOrder?.status === "Delivered")
            ? "🏍️ Trip Started (Connecting GPS...)"
            : "⏱️ Awaiting Dispatch Signal"}
        </span>
      </div>
      <div ref={mapContainerRef} className="w-full h-64 bg-neutral-900 border border-neutral-850 relative" style={{ minHeight: "280px", zIndex: 1 }} />
      
      {/* Dynamic interactive legend overlay summarizing the paths */}
      <div className="mt-2 bg-neutral-950 p-2.5 border border-neutral-850 grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono tracking-wider uppercase text-neutral-400 border-b-0">
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-2 bg-amber-500 rounded" />
          <span>🍳 Kitchen → Venue</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-2 border-t-2 border-dashed border-[#6b7280]" />
          <span>Covered Transit path</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-2 bg-blue-500 rounded" />
          <span>🏍️ Rider → You (Live Route)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-2 border-t-2 border-dashed border-[#d97706]" />
          <span>Planned/Preparing Leg</span>
        </div>
      </div>


    </div>
  );
}

// Custom hook to fetch updated real-time coordinates for the rider every 5 seconds to ensure smooth map movement
function useRiderCoordinates(orderId: string | null, setActiveOrder: React.Dispatch<React.SetStateAction<any>>) {
  useEffect(() => {
    if (!orderId) return;

    const fetchCoords = async () => {
      // Fetch live coordinates, rider details, and status from Firestore (primary real-time source of truth)
      try {
        const docRef = doc(db, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setActiveOrder((prev: any) => {
            if (!prev) return { id: orderId, ...data };
            return {
              ...prev,
              ...data, // merge all real-time fields from Firestore (riderLatitude, riderLongitude, riderName, riderPhone, status, etc.)
            };
          });
        }
      } catch (err) {
        console.warn("[useRiderCoordinates] Firestore coordinate polling check bypassed/failed:", err);
      }
    };

    // Poll every 5 seconds to guarantee fresh coordinates update
    const intervalId = setInterval(fetchCoords, 5000);
    return () => clearInterval(intervalId);
  }, [orderId, setActiveOrder]);
}

interface OrderTrackerProps {
  onBackToCart?: () => void;
  orderId?: string | null;
  userRole?: string;
}

export default function OrderTracker({ onBackToCart, orderId, userRole = "user" }: OrderTrackerProps) {
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // State to hold resolved order ID for the custom hook
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(orderId || null);

  useEffect(() => {
    if (orderId) {
      setResolvedOrderId(orderId);
    } else {
      const saved = localStorage.getItem("upside_active_order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.id) {
            setResolvedOrderId(parsed.id);
          }
        } catch (_) {}
      }
    }
  }, [orderId]);

  // Hook to fetch updated real-time coordinates for the rider every 5 seconds to keep map movement smooth
  useRiderCoordinates(resolvedOrderId, setActiveOrder);

  // Dynamic Leaflet Resources Loader
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Inject Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    
    // Inject Leaflet JS
    if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => {
        setLeafletLoaded(true);
      };
      document.head.appendChild(script);
    } else {
      setLeafletLoaded(true);
    }
  }, []);

  const getStableCoords = (address: string = "", id: string = "") => {
    let hashVal = 0;
    const str = (address + id) || "Lagos";
    for (let i = 0; i < str.length; i++) {
      hashVal = str.charCodeAt(i) + ((hashVal << 5) - hashVal);
    }
    const deltaLat = ((Math.abs(hashVal) % 100) / 1500) - 0.03; // spreads within a 0.06 deg block in Lagos
    const deltaLng = (((Math.abs(hashVal) >> 8) % 100) / 1500) - 0.03;
    return {
      lat: 6.4527 + deltaLat,
      lng: 3.3932 + deltaLng
    };
  };

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

    let unsubscribeFirestore: (() => void) | null = null;
    let pollIntervalId: any = null;

    // Helper to fetch from MySQL Router API and merge real-time coordinates & details from Firestore
    const fetchMySQLOrder = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/mysql/orders/${targetDocId}`));
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            // Merge actual live tracking, status, and rider metadata from Firestore
            try {
              const docRef = doc(db, "orders", targetDocId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const fsData = docSnap.data();
                setActiveOrder({
                  ...data,
                  ...fsData, // Firestore live values overwrite stale SQL static values
                });
                return true;
              }
            } catch (fsErr) {
              console.warn("[OrderTracker] Firestore side-car merge bypassed:", fsErr);
            }
            setActiveOrder(data);
            return true;
          }
        }
      } catch (err) {
        console.warn("[OrderTracker] MySQL order fetch request bypassed/failed:", err);
      }
      return false;
    };

    const initializeSynchronizer = async () => {
      // First, check if the order exists in MySQL
      const existsInMySQL = await fetchMySQLOrder();
      
      if (existsInMySQL) {
        // Set up real-time polling updates (every 5 seconds) to simulate real-time sockets
        pollIntervalId = setInterval(async () => {
          await fetchMySQLOrder();
        }, 5000);
        setLoading(false);
      } else {
        // Fallback: Bind real-time Firestore listener
        try {
          unsubscribeFirestore = onSnapshot(
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
        } catch (snapshotErr) {
          console.error("Failed to execute fallback Firestore snapshot:", snapshotErr);
          setLoading(false);
        }
      }
    };

    initializeSynchronizer();

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
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
        userRole === "user" && currentStage === "Prepping" ? (
          <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-center shadow-lg font-mono rounded-none" id="tracker-prepping-locked">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto rounded-full">
              <ChefHat className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            <div className="space-y-2.5 max-w-sm mx-auto">
              <h5 className="text-[11px] uppercase tracking-widest font-black text-amber-500 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Awaiting Kitchen Acceptance
              </h5>
              <p className="text-[11px] text-white font-bold uppercase">
                Order Registered &amp; Paid
              </p>
              <p className="text-[10px] text-neutral-400 normal-case leading-relaxed font-sans mt-1 text-center">
                Your premium gourmand order has been successfully recorded and paid. Our boutique culinary kitchen crew is presently verifying the order coordinates and fresh ingredients.
              </p>
              <p className="text-[9px] text-[#d97706] font-bold border-t border-neutral-850/60 pt-3 uppercase tracking-tighter text-center">
                Real-time active step tracking will commence immediately when our cooking team places your gourmet dinner in the oven.
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-850 p-4 text-left shadow-sm space-y-3">
              <span className="text-[9px] tracking-widest text-neutral-400 font-extrabold uppercase block border-b border-neutral-800 pb-1">
                Pending Verification Details:
              </span>
              <div className="text-[10px] space-y-1.5 text-neutral-400">
                <p className="font-sans text-neutral-200">Customer: {activeOrder.customerName || "Gourmet Client"}</p>
                <p className="font-sans">Order Ref ID: <span className="font-mono text-amber-500 font-bold">#{activeOrder.id?.slice(-8).toUpperCase()}</span></p>
                <p className="font-sans">Billing Total: <span className="font-mono">₦{activeOrder.totalPrice?.toLocaleString()}</span></p>
                {activeOrder.verificationCode && (
                  <div className="mt-2.5 bg-neutral-950 p-2.5 border border-amber-600/30">
                    <span className="text-[8px] font-mono tracking-widest text-[#d97706] uppercase block font-bold">Secure Pickup/Verification Code:</span>
                    <span className="text-xs font-mono text-white font-bold tracking-widest mt-0.5 block select-all">{activeOrder.verificationCode}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={resetTracking}
              className="w-full py-2.5 border border-neutral-850 hover:border-neutral-750 text-neutral-500 hover:text-white font-semibold text-[10px] font-mono uppercase tracking-widest cursor-pointer text-center bg-transparent transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Untrack / Clear Tracker Session</span>
            </button>
          </div>
        ) : (
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

            {/* Live Interactive Tracking Map */}
            <CustomerOrderMap
              activeOrder={activeOrder}
              leafletLoaded={leafletLoaded}
              getStableCoords={getStableCoords}
            />

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
                {activeOrder.verificationCode && (
                  <div className="mt-2.5 bg-neutral-950 p-3 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-mono tracking-widest text-neutral-500 uppercase font-black">Secure Pickup Code</p>
                      <p className="text-sm font-mono text-amber-500 font-black tracking-widest mt-0.5 select-all">{activeOrder.verificationCode}</p>
                    </div>
                    <div className="text-[8px] font-mono text-neutral-400 uppercase leading-snug sm:text-right max-w-xs">
                      Provide code upon delivery or pickup to verify
                    </div>
                  </div>
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
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">
                    {activeOrder.riderName ? `Rider: ${activeOrder.riderName}` : "Assigned Rider Line"}
                  </p>
                  <p className="text-[11px] font-mono text-amber-500 font-bold">
                    {activeOrder.riderPhone || activeOrder.rider_phone || "+234 (91) 464-6767"}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`px-2.5 py-1.5 border text-[10px] font-mono uppercase font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      showChat 
                        ? "bg-amber-500 text-black border-amber-600 hover:bg-amber-400" 
                        : "bg-neutral-950 text-amber-500 border-amber-500/20 hover:border-amber-500/40"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Chat</span>
                  </button>
                  <a
                    href={`tel:${(activeOrder.riderPhone || activeOrder.rider_phone || "+2349114646767").replace(/\s+/g, "").replace(/[()]/g, "")}`}
                    className="px-2.5 py-1.5 border border-neutral-800 hover:border-neutral-700 text-[10px] bg-neutral-950 text-neutral-300 font-mono uppercase font-bold transition-all"
                  >
                    Call Rider
                  </a>
                </div>
              </div>

              {showChat && (
                <div className="mt-3 border-t border-neutral-800 pt-3 animate-fadeIn">
                  <LiveChat
                    orderId={activeOrder.id}
                    senderId={activeOrder.userId || "anonymous_customer"}
                    senderName={activeOrder.customerName || "Customer"}
                    recipientName={activeOrder.riderName || "Courier Rider"}
                    onClose={() => setShowChat(false)}
                    theme="dark"
                  />
                </div>
              )}
            </div>

            {activeOrder.status === "Delivered" && (
              <div className="flex gap-2.5">
                <button
                  onClick={async () => {
                    if (window.confirm("Are you absolutely sure you want to delete this delivered order? This action is permanent and cannot be undone.")) {
                      try {
                        await deleteDoc(doc(db, "orders", activeOrder.id));
                        resetTracking();
                        alert("Order deleted successfully!");
                      } catch (e: any) {
                        alert(`Error deleting order: ${e.message}`);
                      }
                    }
                  }}
                  className="flex-1 py-3 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-500 text-xs font-bold font-mono uppercase tracking-widest cursor-pointer text-center transition-all"
                >
                  Delete Order
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, "orders", activeOrder.id), { isArchived: true });
                      resetTracking();
                      alert("Order archived successfully!");
                    } catch (e: any) {
                      alert(`Error archiving order: ${e.message}`);
                    }
                  }}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold font-mono uppercase tracking-widest cursor-pointer text-center transition-all"
                >
                  Archive Order
                </button>
              </div>
            )}

            <button
              onClick={resetTracking}
              className="w-full py-3 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-semibold text-xs font-mono uppercase tracking-widest cursor-pointer text-center bg-[#121212] transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Untrack / Clear Current Panel</span>
            </button>
          </div>
        )
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
