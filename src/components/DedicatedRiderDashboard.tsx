import React, { useState, useEffect, useRef } from "react";
import { LogIn, LogOut, Clipboard, CheckCircle, Package, User, Phone, MapPin, Eye, ShieldAlert, Key, RefreshCw, Compass, Info, Lock, ShieldCheck, Clock, MessageSquare } from "lucide-react";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getApiUrl } from "../types";
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import LiveChat from "./LiveChat";

interface RiderOrderMapProps {
  ord: any;
  leafletLoaded: boolean;
  getStableCoords: (address: string, id: string) => { lat: number; lng: number };
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  riderLat: number | null;
  riderLng: number | null;
  onRouteComputed?: (path: { lat: number; lng: number }[]) => void;
}

function RiderGoogleOrderMap({
  ord,
  getStableCoords,
  isTracking,
  riderLat,
  riderLng,
  onRouteComputed
}: {
  ord: any;
  getStableCoords: any;
  isTracking: boolean;
  riderLat: number | null;
  riderLng: number | null;
  onRouteComputed?: (path: { lat: number; lng: number }[]) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const orderLat = ord.latitude ?? ord.lat ?? ord.deliveryLatitude ?? getStableCoords(ord.address, ord.id).lat;
  const orderLng = ord.longitude ?? ord.lng ?? ord.deliveryLongitude ?? getStableCoords(ord.address, ord.id).lng;

  const kitchenLat = 6.4527;
  const kitchenLng = 3.3932;

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin: { lat: kitchenLat, lng: kitchenLng },
      destination: { lat: orderLat, lng: orderLng },
      travelMode: "DRIVING",
      fields: ["path", "viewport"],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: "#3b82f6",
            strokeWeight: 6,
            strokeOpacity: 0.9
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;

        // Callback with the points path for the simulation engine
        if (routes[0].path && onRouteComputed) {
          const coords = routes[0].path.map(pt => {
            const latVal = typeof pt.lat === "function" ? (pt.lat as any)() : pt.lat;
            const lngVal = typeof pt.lng === "function" ? (pt.lng as any)() : pt.lng;
            return { lat: latVal, lng: lngVal };
          });
          onRouteComputed(coords);
        }

        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    }).catch(err => {
      console.warn("Rider Routes API failed, drawing simple direct line:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, orderLat, orderLng]);

  return (
    <>
      <AdvancedMarker position={{ lat: kitchenLat, lng: kitchenLng }} title="Upside Kitchen">
        <div className="bg-black text-amber-500 rounded-full p-1 border-2 border-amber-500 shadow-md flex items-center justify-center font-bold text-[11px]" style={{ width: "28px", height: "28px" }}>
          🍳
        </div>
      </AdvancedMarker>

      <AdvancedMarker position={{ lat: orderLat, lng: orderLng }} title="Customer Venue">
        <div className="bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-md flex items-center justify-center font-bold text-xs" style={{ width: "28px", height: "28px" }}>
          📍
        </div>
      </AdvancedMarker>

      {isTracking && riderLat !== null && riderLng !== null && (
        <AdvancedMarker position={{ lat: riderLat, lng: riderLng }} title="Your Live Location">
          <div style={{ width: "40px", height: "40px" }} className="flex items-center justify-center">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white text-base animate-pulse shadow-lg">
              🏍️
            </div>
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}

function RiderOrderMap({
  ord,
  leafletLoaded,
  getStableCoords,
  isTracking,
  onStartTracking,
  onStopTracking,
  riderLat,
  riderLng,
  onRouteComputed
}: RiderOrderMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);

  const orderLat = ord.latitude ?? ord.lat ?? ord.deliveryLatitude ?? getStableCoords(ord.address, ord.id).lat;
  const orderLng = ord.longitude ?? ord.lng ?? ord.deliveryLongitude ?? getStableCoords(ord.address, ord.id).lng;

  // Baseline restaurant position
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
        const url = `https://router.project-osrm.org/route/v1/driving/${kitchenLng},${kitchenLat};${orderLng},${orderLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM routing failed");
        const data = await res.json();
        const route = data.routes?.[0];
        if (route?.geometry?.coordinates && isMounted) {
          const coords: [number, number][] = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          setRoadCoords(coords);
          if (onRouteComputed) {
            onRouteComputed(coords.map(([lat, lng]) => ({ lat, lng })));
          }
        }
      } catch (err) {
        console.warn("OSRM routing query failed, falling back to street grid:", err);
      }
    };

    fetchOSRMRoute();
    return () => {
      isMounted = false;
    };
  }, [orderLat, orderLng, hasGoogleKey]);

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
      html: `<div class="bg-black text-amber-500 rounded-full p-1 border-2 border-amber-500 shadow-md flex items-center justify-center font-bold text-[11px]" style="width:28px;height:28px;">🍳</div>`,
      className: "custom-icon-kitchen",
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    L.marker([kitchenLat, kitchenLng], { icon: kitchenIcon })
      .addTo(map)
      .bindPopup("<b>Upside Sanctuary Kitchen</b><br/>IKATE LEKKI (Origin of Hot Plate Gastronomy)");

    // 2. Customer Icon Pin
    const customerIcon = L.divIcon({
      html: `<div class="bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-md flex items-center justify-center font-bold text-xs" style="width:28px;height:28px;">📍</div>`,
      className: "custom-icon-pin",
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const marker = L.marker([orderLat, orderLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>${ord.customerName || "Customer"}</b><br/>${ord.address || "Delivery Location"}`);

    if (isTracking && riderLat !== null && riderLng !== null) {
      // 3. Rider active Location Pin
      const riderIcon = L.divIcon({
        html: `<div class="bg-blue-600 text-white rounded-full p-1 border-2 border-white shadow-md flex items-center justify-center font-bold text-xs animate-pulse" style="width:28px;height:28px;box-shadow: 0 0 10px rgba(59, 130, 246, 0.75);">🏍️</div>`,
        className: "custom-icon-rider",
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });

      L.marker([riderLat, riderLng], { icon: riderIcon })
        .addTo(map)
        .bindPopup("<b>Your live location</b><br/>Syncing location in real-time...")
        .openPopup();

      // Find closest segment in roadCoords to segregate transit covered leg from active route
      let closestIdx = 0;
      if (roadCoords.length > 0) {
        let minDist = Infinity;
        for (let i = 0; i < roadCoords.length; i++) {
          const [lat, lng] = roadCoords[i];
          const dist = Math.pow(lat - riderLat, 2) + Math.pow(lng - riderLng, 2);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = i;
          }
        }
      }

      // Part A: Covered transit path (Kitchen to Rider position)
      const pathKitchenToRider = roadCoords.length > 0
        ? roadCoords.slice(0, closestIdx + 1)
        : getStreetPath([kitchenLat, kitchenLng], [riderLat, riderLng], (ord.id || "rider") + "_covered");

      L.polyline(pathKitchenToRider, {
        color: "#6b7280", // Slate grey completed leg
        weight: 3.5,
        dashArray: "4, 6",
        opacity: 0.7,
        lineCap: "round"
      }).addTo(map);

      // Part B: Active dispatch delivery route (Rider position to Customer)
      const pathRiderToCustomer = roadCoords.length > 0
        ? roadCoords.slice(closestIdx)
        : getStreetPath([riderLat, riderLng], [orderLat, orderLng], (ord.id || "customer") + "_active");
      
      // Deep blue outline
      L.polyline(pathRiderToCustomer, {
        color: "#3b82f6",
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      // Light glow core
      L.polyline(pathRiderToCustomer, {
        color: "#60a5fa",
        weight: 2,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      const bounds = L.latLngBounds([[kitchenLat, kitchenLng], [orderLat, orderLng], [riderLat, riderLng]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // No active GPS coordinate streams from rider yet - draw expected path from kitchen to customer
      const pathKitchenToCustomer = roadCoords.length > 0
        ? roadCoords
        : getStreetPath([kitchenLat, kitchenLng], [orderLat, orderLng], (ord.id || "direct") + "_predicted");
      
      L.polyline(pathKitchenToCustomer, {
        color: "#d97706",
        weight: 4.5,
        dashArray: "8, 8",
        opacity: 0.8,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      L.polyline(pathKitchenToCustomer, {
        color: "#fbbf24",
        weight: 1.5,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(map);

      marker.openPopup();

      const bounds = L.latLngBounds([[kitchenLat, kitchenLng], [orderLat, orderLng]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [leafletLoaded, orderLat, orderLng, isTracking, riderLat, riderLng, hasGoogleKey, roadCoords]);

  if (hasGoogleKey) {
    return (
      <div className="border border-neutral-200 mt-4 overflow-hidden bg-neutral-900 shadow-inner">
        <div className="bg-neutral-950 p-3 flex justify-between items-center border-b border-neutral-850">
          <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            Live Google Dispatch Radar
          </span>
          <button
            onClick={isTracking ? onStopTracking : onStartTracking}
            className={`px-3 py-1 text-[9px] font-mono font-bold tracking-widest uppercase cursor-pointer border transition-colors ${
              isTracking
                ? "bg-rose-950/40 border-rose-800 text-rose-500 hover:bg-rose-900/30 animate-pulse"
                : "bg-amber-500 border-amber-600 text-white hover:bg-amber-600"
            }`}
          >
            {isTracking ? "● Live On" : "Track Delivery Live"}
          </button>
        </div>

        <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly">
          <div className="w-full h-64 bg-neutral-900 relative" style={{ minHeight: "240px" }}>
            <Map
              defaultCenter={{ lat: orderLat, lng: orderLng }}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
              style={{ width: "100%", height: "100%" }}
              disableDefaultUI={true}
              zoomControl={true}
            >
              <RiderGoogleOrderMap
                ord={ord}
                getStableCoords={getStableCoords}
                isTracking={isTracking}
                riderLat={riderLat}
                riderLng={riderLng}
                onRouteComputed={onRouteComputed}
              />
            </Map>
          </div>
        </APIProvider>

        {isTracking && (
          <div className="bg-blue-950/40 border-t border-blue-900/30 p-2 text-center text-[9px] font-mono text-blue-400 tracking-wider uppercase leading-none">
            📡 Auto-syncing GPS coordinates dynamically via Google Roads to customer.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 mt-4 overflow-hidden bg-neutral-50 shadow-inner">
      <div className="bg-neutral-100 p-3 flex justify-between items-center border-b border-neutral-200">
        <span className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          Live Route Dispatch Radar
        </span>
        
        <button
          onClick={isTracking ? onStopTracking : onStartTracking}
          className={`px-3 py-1 text-[9px] font-mono font-bold tracking-widest uppercase cursor-pointer border transition-colors ${
            isTracking
              ? "bg-rose-100 border-rose-300 text-rose-700 hover:bg-rose-200 animate-pulse"
              : "bg-amber-500 border-amber-600 text-white hover:bg-amber-600"
          }`}
        >
          {isTracking ? "● Live Tracking On" : "Track Delivery Live"}
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-64 bg-neutral-200 relative" style={{ minHeight: "240px", zIndex: 10 }} />
      
      {isTracking && (
        <div className="bg-blue-50 border-t border-blue-200/50 p-2 text-center text-[9px] font-mono text-blue-700 tracking-wider uppercase leading-none">
          📡 Auto-syncing GPS coordinates dynamically to customer in real-time.
        </div>
      )}
    </div>
  );
}


export default function DedicatedRiderDashboard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loggedInRider, setLoggedInRider] = useState<any>(() => {
    const saved = localStorage.getItem("upside_rider_session");
    return saved ? JSON.parse(saved) : null;
  });

  // Leaflet and Live Geolocation Tracking States
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [computedRoadPaths, setComputedRoadPaths] = useState<Record<string, { lat: number; lng: number }[]>>({});
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Periodically update the timestamp every 5 seconds to keep the estimated time of arrival fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<string | null>(null); // orderId that is currently tracking
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [useSimulator, setUseSimulator] = useState<boolean>(true); // default to true so it works flawlessly in sandboxed environments!
  const [simulationIntervalId, setSimulationIntervalId] = useState<any>(null);
  const [deviceLat, setDeviceLat] = useState<number>(6.4527);
  const [deviceLng, setDeviceLng] = useState<number>(3.3932);
  const [deviceAccuracy, setDeviceAccuracy] = useState<string>("Simulated");
  const [riderLat, setRiderLat] = useState<number | null>(null);
  const [riderLng, setRiderLng] = useState<number | null>(null);
  const [tripLoadingId, setTripLoadingId] = useState<string | null>(null);

  // Locate the rider logged-in location immediately
  useEffect(() => {
    if (!loggedInRider) return;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceLat(position.coords.latitude);
          setDeviceLng(position.coords.longitude);
          setDeviceAccuracy(position.coords.accuracy ? `${Math.round(position.coords.accuracy)}m (GPS Verify)` : "GPS Authenticated");
        },
        (error) => {
          console.warn("Could not locate precise logged in device GPS, using fallback:", error.message);
          // Jitter fallback slightly to show a live localized coordinate near Lekki Phase 1
          const jitterLat = 6.4527 + (Math.random() - 0.5) * 0.005;
          const jitterLng = 3.3932 + (Math.random() - 0.5) * 0.005;
          setDeviceLat(jitterLat);
          setDeviceLng(jitterLng);
          setDeviceAccuracy("Emulator Fallback");
        }
      );
    }
  }, [loggedInRider]);

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
    const deltaLat = ((Math.abs(hashVal) % 100) / 1500) - 0.03; // spreads within 0.06 deg (~6km) block in Lagos
    const deltaLng = (((Math.abs(hashVal) >> 8) % 100) / 1500) - 0.03;
    return {
      lat: 6.4527 + deltaLat,
      lng: 3.3932 + deltaLng
    };
  };

  const startTracking = (orderId: string) => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
    }

    const ord = assignedOrders.find((o) => o.id === orderId);
    const orderLat = ord?.latitude ?? ord?.lat ?? ord?.deliveryLatitude ?? getStableCoords(ord?.address || "Lagos", orderId).lat;
    const orderLng = ord?.longitude ?? ord?.lng ?? ord?.deliveryLongitude ?? getStableCoords(ord?.address || "Lagos", orderId).lng;

    // Baseline restaurant post (origin of dispatch route)
    const kitchenLat = 6.4527;
    const kitchenLng = 3.3932;

    // Start coordinates for tracking (use current handset location or kitchen)
    const startLat = deviceLat || kitchenLat;
    const startLng = deviceLng || kitchenLng;

    setIsTracking(orderId);

    if (useSimulator) {
      const roadPoints = computedRoadPaths[orderId] || [];
      const hasRoadPoints = roadPoints.length > 0;
      const totalSteps = hasRoadPoints ? roadPoints.length : 15;

      let currentStep = 0;

      setRiderLat(startLat);
      setRiderLng(startLng);

      const updateOrderCoords = async (lat: number, lng: number) => {
        try {
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            status: "Out for Delivery",
            riderLatitude: lat,
            riderLongitude: lng,
            riderLastTrackingTime: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Simulation database update error:", err);
        }
      };

      updateOrderCoords(startLat, startLng);

      const interval = setInterval(() => {
        currentStep++;
        if (currentStep >= totalSteps) {
          setRiderLat(orderLat);
          setRiderLng(orderLng);
          updateOrderCoords(orderLat, orderLng);
          clearInterval(interval);
          setSimulationIntervalId(null);
          return;
        }

        let nextLat = startLat;
        let nextLng = startLng;

        if (hasRoadPoints) {
          const pt = roadPoints[currentStep];
          if (pt) {
            nextLat = pt.lat;
            nextLng = pt.lng;
          } else {
            nextLat = orderLat;
            nextLng = orderLng;
          }
        } else {
          const progress = currentStep / totalSteps;
          const jitterX = (Math.sin(currentStep) * 0.0002);
          const jitterY = (Math.cos(currentStep) * 0.0002);
          nextLat = startLat + (orderLat - startLat) * progress + jitterX;
          nextLng = startLng + (orderLng - startLng) * progress + jitterY;
        }

        setRiderLat(nextLat);
        setRiderLng(nextLng);
        updateOrderCoords(nextLat, nextLng);
      }, 4000);

      setSimulationIntervalId(interval);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setRiderLat(latitude);
          setRiderLng(longitude);

          try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
              status: "Out for Delivery",
              riderLatitude: latitude,
              riderLongitude: longitude,
              riderLastTrackingTime: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          } catch (err) {
            console.error("Error writing tracking coordinates to firestore:", err);
          }
        },
        (err) => {
          console.error("Geolocation watch error:", err);
          alert(`Error tracking location: ${err.message}. Emulating fallback path.`);
          setUseSimulator(true);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000
        }
      );

      setWatchId(id);
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    if (simulationIntervalId) {
      clearInterval(simulationIntervalId);
      setSimulationIntervalId(null);
    }
    setIsTracking(null);
    setRiderLat(null);
    setRiderLng(null);
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (simulationIntervalId) {
        clearInterval(simulationIntervalId);
      }
    };
  }, [watchId, simulationIntervalId]);

  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [verificationInputs, setVerificationInputs] = useState<{[orderId: string]: string}>({});

  // Stream allocated orders specifically assigned to the logged-in courier
  useEffect(() => {
    if (!loggedInRider?.id) return;

    setOrdersLoading(true);
    const q = query(
      collection(db, "orders"),
      where("assignedRiderId", "==", loggedInRider.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        // Sort: Active ones first, completed / delivered ones at the end, then by date decreasing
        list.sort((a, b) => {
          const isACompleted = a.status === "Completed" || a.status === "Delivered";
          const isBCompleted = b.status === "Completed" || b.status === "Delivered";
          if (!isACompleted && isBCompleted) return -1;
          if (isACompleted && !isBCompleted) return 1;
          return b.timestamp - a.timestamp;
        });

        setAssignedOrders(list);
        setOrdersLoading(false);
      },
      (err) => {
        console.error("Error streaming assigned courier orders:", err);
        setOrdersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loggedInRider]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError("Please enter your registered Courier Username and Password key.");
      return;
    }

    setLoginError(null);
    setIsLoading(true);

    try {
      // Query the logistics riders configuration
      const ridersRef = collection(db, "riders");
      const q = query(ridersRef, where("username", "==", cleanUsername));
      const snap = await getDocs(q);

      if (snap.empty) {
        setLoginError("No courier profile matches this username in the logistics register.");
        setIsLoading(false);
        return;
      }

      let matchedRider: any = null;
      snap.forEach((docSnap) => {
        const val = docSnap.data();
        if (val.password === cleanPassword) {
          matchedRider = { id: docSnap.id, ...val };
        }
      });

      if (!matchedRider) {
        setLoginError("Accreditation code verification failed. Incorrect password.");
        setIsLoading(false);
        return;
      }

      if (matchedRider.active === false) {
        setLoginError("This courier account registration has been placed on administrative hold.");
        setIsLoading(false);
        return;
      }

      // Store authenticated courier session
      localStorage.setItem("upside_rider_session", JSON.stringify(matchedRider));
      setLoggedInRider(matchedRider);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Courier authentication crash:", err);
      setLoginError(`Logistics verification issue: ${err.message || err}`);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("upside_rider_session");
    setLoggedInRider(null);
    setAssignedOrders([]);
  };

  const handleMarkAsDone = async (orderId: string) => {
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const orderRef = doc(db, "orders", orderId);
      // Update database status explicitly to "Completed" as requested
      await updateDoc(orderRef, {
        status: "Completed",
        updatedAt: new Date().toISOString()
      });

      // Dispatch tracking update status payload to server to trigger transactional notifications
      fetch(getApiUrl("/api/delivery/orders/update-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "Completed"
        })
      }).catch(err => console.error("Could not dispatch status change email logs to clients:", err));

      setStatusSuccess(`Order #${orderId.slice(-8).toUpperCase()} has been marked as Completed / Delivered!`);
    } catch (err: any) {
      console.error("Failed to transition status:", err);
      setStatusError(`Failed to update status on ledger: ${err.message}`);
    }
  };

  const handleStartTrip = async (order: any) => {
    setTripLoadingId(order.id);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const response = await fetch(getApiUrl("/api/delivery/orders/start-trip"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: order.id,
          riderId: loggedInRider.id,
          riderName: loggedInRider.fullName,
          riderPhone: loggedInRider.phoneNumber || loggedInRider.phone || ""
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate delivery trip on backend.");
      }

      // Update Firestore with rider details immediately for live tracking sync
      try {
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, {
          riderId: loggedInRider.id,
          riderName: loggedInRider.fullName,
          riderPhone: loggedInRider.phoneNumber || loggedInRider.phone || "",
          updatedAt: new Date().toISOString()
        });
      } catch (firestoreErr) {
        console.warn("Bypassed non-critical Firestore order update during start-trip:", firestoreErr);
      }

      // Automatically expand and start tracking coordinates in real-time
      setExpandedMapId(order.id);
      startTracking(order.id);

      setStatusSuccess(`Trip started! Real-time progress tracker link dispatched to consignee's email.`);
    } catch (err: any) {
      console.error("Error activating delivery trip:", err);
      setStatusError(`Trip Activation Error: ${err.message || err}`);
    } finally {
      setTripLoadingId(null);
    }
  };

  // Login View
  if (!loggedInRider) {
    return (
      <div className="bg-neutral-50 min-h-screen pt-28 pb-16 px-4 text-neutral-900 font-sans flex items-center justify-center" id="dedicated-rider-login-root">
        <div className="w-full max-w-md space-y-6 animate-fadeIn">
          
          <div className="space-y-4 text-center">
            {/* Elegant Branding Logo */}
            <div className="flex flex-col items-center justify-center leading-tight">
              <div className="flex items-center gap-1.5 select-none">
                <span className="text-2xl md:text-3xl font-black text-neutral-950 tracking-wider font-sans uppercase">
                  UPSIDE
                </span>
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              </div>
              <span className="text-[10px] font-mono tracking-[0.35em] text-neutral-500 uppercase mt-1">
                RESTAURANT &amp; CAFÉ
              </span>
            </div>

            <div className="w-[1px] h-6 bg-amber-500 mx-auto opacity-50"></div>

            <div className="space-y-1">
              <h1 className="text-lg md:text-xl font-sans font-light tracking-tight text-neutral-900 uppercase">
                Courier Logistics Portal
              </h1>
              <p className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase">
                UPSIDE GOURMET SANCTUARY DELIVERY DIVISION
              </p>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 p-6 md:p-8 space-y-6 shadow-sm rounded-none">
            
            <div className="border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-800">
                Liaison Accreditation Gate
              </h2>
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded flex gap-2 items-start animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

             <form onSubmit={handleLogin} className="space-y-5">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block">
                   Courier Username
                 </label>
                 <div className="relative">
                   <span className="absolute left-3 top-3.5 text-xs font-bold text-neutral-400 font-mono">@</span>
                   <input
                     type="text"
                     required
                     placeholder="e.g. rider_name"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     className="w-full text-sm font-mono p-3 px-8 bg-neutral-50 border border-neutral-200 rounded-none focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-300 font-medium lowercase"
                     id="rider-username-input"
                   />
                 </div>
               </div>
 
               <div className="space-y-1.5">
                 <label className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold block">
                   Portal Key Password
                 </label>
                 <input
                   type="password"
                   required
                   placeholder="••••••••"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full text-sm font-mono p-3 px-4 bg-neutral-50 border border-neutral-200 rounded-none focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-300 font-medium"
                   id="rider-password-input"
                 />
               </div>
 
               <button
                 type="submit"
                 disabled={isLoading}
                 className="w-full py-3.5 bg-neutral-900 border border-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                 id="rider-login-submit-btn"
               >
                 {isLoading ? (
                   <>
                     <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                     <span>Authorizing Ledger Access...</span>
                   </>
                 ) : (
                   <>
                     <LogIn className="w-4 h-4 text-amber-500" />
                     <span>Authorize &amp; Synchronize</span>
                   </>
                 )}
               </button>
             </form>
 
             {/* Rider Credentials Guideline Box */}
             <div className="border-t border-neutral-100 pt-5 space-y-3 font-sans" id="rider-guideline-section">
               <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono uppercase font-bold tracking-wider">
                 <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                 <span>Courier Protocol Notice</span>
               </div>
               <div className="bg-neutral-50 border border-neutral-200/50 p-4 space-y-2.5 text-left">
                 <p className="text-[11px] leading-relaxed font-sans text-neutral-600">
                   Welcome to the Upside Delivery Hub. Please keep the following access policies in mind:
                 </p>
                 <ul className="space-y-2 text-[10px] font-sans text-neutral-500 list-none pl-0">
                   <li className="flex gap-2">
                     <span className="text-amber-500 font-bold shrink-0">▪</span>
                     <span><strong>No Email Required:</strong> Drivers authenticate exclusively via a custom logistics system Username.</span>
                   </li>
                   <li className="flex gap-2">
                     <span className="text-amber-500 font-bold shrink-0">▪</span>
                     <span><strong>No Self Registration:</strong> Courier profiles must be compiled and assigned by dispatch managers. Direct sign-up is disabled.</span>
                   </li>
                   <li className="flex gap-2">
                     <span className="text-amber-500 font-bold shrink-0">▪</span>
                     <span><strong>No Self Password Reset:</strong> Lost keys cannot be retrieved via email. Request password restoration from administration.</span>
                   </li>
                 </ul>
               </div>
             </div>
           </div>

          <div className="text-center">
            <p className="text-[10.5px] text-neutral-400 font-sans max-w-sm mx-auto leading-relaxed">
              Logistics credentials are systematically provisioned inside the Administrator Panel. If you require access tokens, report directly to dispatch.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // Loaded Dashboard UI
  const assignedActive = assignedOrders.filter(o => o.status !== "Completed" && o.status !== "Delivered");
  const assignedArchived = assignedOrders.filter(o => o.status === "Completed" || o.status === "Delivered");

  return (
    <div className="bg-neutral-50 min-h-screen pt-28 pb-16 px-4 text-neutral-900 font-sans" id="dedicated-rider-dashboard-view">
      <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn text-left">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div className="flex items-center gap-4">
            {/* Brand Logo Insignia */}
            <div className="flex flex-col leading-none border-r border-neutral-200 pr-4">
              <span className="text-sm font-black text-neutral-950 tracking-wider font-sans uppercase">
                UPSIDE
              </span>
              <span className="text-[7.5px] font-mono tracking-[0.2em] text-neutral-450 uppercase mt-0.5">
                DELIVERY CO.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-200 rounded-none flex items-center justify-center font-bold text-amber-600 text-lg">
                🏍️
              </div>
              <div>
                <span className="text-[10px] tracking-widest text-amber-600 font-bold uppercase block">
                  Logistics Dispatch Agent
                </span>
                <h2 className="text-base font-bold text-neutral-950 uppercase tracking-wider">
                  {loggedInRider.fullName}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <span className="text-xs font-mono text-neutral-400">@{loggedInRider.username}</span>
            <button
              onClick={handleLogout}
              className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-950 text-[10px] uppercase font-bold font-mono text-rose-400 hover:text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm rounded-none"
              id="rider-sign-out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Relinquish Post</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification Banner */}
        {statusSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs font-mono rounded flex gap-2 items-center animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusSuccess}</span>
          </div>
        )}

        {statusError && (
          <div className="p-4 bg-red-50 border border-red-250 text-red-800 text-xs font-mono rounded flex gap-2 items-start animate-shake">
            <ShieldAlert className="w-4 h-4 text-red-650 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{statusError}</span>
          </div>
        )}

        {/* Device GPS and shift check-in block */}
        <div className="bg-neutral-905 border border-neutral-250 p-5 shadow-sm text-left relative overflow-hidden" id="rider-check-in-gps-card" style={{ background: "#fafafa" }}>
          <div className="absolute right-3 top-3 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono text-amber-700 rounded-none uppercase tracking-wider font-bold">
            Live Telemetry Node
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-2">
              <h4 className="text-[10px] font-mono tracking-widest text-[#d97706] uppercase font-bold flex items-center gap-1.5 font-sans">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span>Active Login Handset Locator</span>
              </h4>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                Your credentials are authenticated. Your active coordinates on the logistics ledger are pinpointed below:
              </p>
              
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <div className="bg-white px-2.5 py-1.5 border border-neutral-200 font-mono text-[10px] text-neutral-500">
                  LATITUDE: <span className="text-neutral-900 font-bold font-mono">{deviceLat.toFixed(6)}</span>
                </div>
                <div className="bg-white px-2.5 py-1.5 border border-neutral-200 font-mono text-[10px] text-neutral-500">
                  LONGITUDE: <span className="text-neutral-900 font-bold font-mono">{deviceLng.toFixed(6)}</span>
                </div>
                <div className="bg-white px-2.5 py-1.5 border border-neutral-200 font-mono text-[10px] text-neutral-500">
                  PROVIDER STATUS: <span className="text-[#d97706] font-bold uppercase">{deviceAccuracy}</span>
                </div>
              </div>

              {/* Mode Selection Toggle */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-black">Tracking Driver:</span>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="tracking_mode"
                    checked={useSimulator === true}
                    onChange={() => setUseSimulator(true)}
                    className="accent-amber-500"
                  />
                  <span className="text-[10.5px] font-mono font-bold text-neutral-700">🤖 Interactive Route Simulator (Recommended)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="tracking_mode"
                    checked={useSimulator === false}
                    onChange={() => setUseSimulator(false)}
                    className="accent-amber-500"
                  />
                  <span className="text-[10.5px] font-mono font-bold text-neutral-700">📱 Real Handset Geolocation API</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-4 flex md:justify-end gap-2">
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        setDeviceLat(position.coords.latitude);
                        setDeviceLng(position.coords.longitude);
                        setDeviceAccuracy(`${Math.round(position.coords.accuracy)}m (High Accuracy GPS)`);
                        alert(`Precision locate verified: [${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}]`);
                      },
                      (error) => {
                        alert(`Precision GPS signal timed out or blocked. Leveraged Lekki Headquarters preset successfully.`);
                      }
                    );
                  }
                }}
                className="py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-[9px] tracking-widest uppercase transition-colors rounded-none flex items-center gap-1.5 cursor-pointer border border-neutral-950 shadow-sm"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500" />
                <span>Locate My Handset GPS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border border-neutral-200 p-5 shadow-sm">
            <p className="text-[10px] text-neutral-400 uppercase font-bold font-mono tracking-wider">Active Deliveries</p>
            <p className="text-2xl font-bold font-mono mt-1 text-amber-500">{assignedActive.length}</p>
          </div>
          <div className="bg-white border border-neutral-200 p-5 shadow-sm">
            <p className="text-[10px] text-neutral-400 uppercase font-bold font-mono tracking-wider">Completed Rides</p>
            <p className="text-2xl font-bold font-mono mt-1 text-green-600">{assignedArchived.length}</p>
          </div>
          <div className="col-span-2 lg:col-span-1 bg-white border border-neutral-200 p-5 shadow-sm space-y-1">
            <p className="text-[10px] text-neutral-400 uppercase font-bold font-mono tracking-wider">Assigned Handset</p>
            <p className="text-xs font-mono text-neutral-800 font-bold mt-1">{loggedInRider.phoneNumber || "No active line"}</p>
          </div>
        </div>

        {/* Active Allocated Orders Section */}
        <div className="space-y-4">
          <div className="border-b border-neutral-200 pb-2 flex justify-between items-center">
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-[#d97706] flex items-center gap-1.5 font-mono">
              <Package className="w-4 h-4 text-amber-550" />
              <span>Allocated Task Orders ({assignedActive.length})</span>
            </h3>
          </div>

          {ordersLoading ? (
            <div className="text-center py-12 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500 mx-auto" />
              <p className="text-[10px] text-neutral-400 uppercase font-mono">Syncing courier cargo roster...</p>
            </div>
          ) : assignedActive.length === 0 ? (
            <div className="text-center py-16 bg-white border border-neutral-200 space-y-3 shadow-sm text-neutral-400">
              <Clipboard className="w-10 h-10 mx-auto text-neutral-300" />
              <p className="text-xs uppercase tracking-widest font-mono font-bold text-neutral-800">No active assignment roster</p>
              <p className="text-xs max-w-sm mx-auto font-sans text-neutral-400 leading-relaxed">
                There are no active orders assigned to you currently, or all designated dispatch tasks are fully processed. Rest or visit central kitchen.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {assignedActive.map((ord) => {
                const currentRiderLat = isTracking === ord.id && riderLat ? riderLat : (ord.riderLatitude ?? ord.rider_latitude ?? deviceLat ?? 6.4527);
                const currentRiderLng = isTracking === ord.id && riderLng ? riderLng : (ord.riderLongitude ?? ord.rider_longitude ?? deviceLng ?? 3.3932);
                
                const destCoords = getStableCoords(ord.address || "Lagos", ord.id);
                const orderLat = ord.latitude ?? ord.lat ?? ord.deliveryLatitude ?? destCoords.lat;
                const orderLng = ord.longitude ?? ord.lng ?? ord.deliveryLongitude ?? destCoords.lng;
                
                const distance = calculateDistance(currentRiderLat, currentRiderLng, orderLat, orderLng);
                const etaMinutes = Math.max(2, Math.round(distance * 2.4));
                const etaTimestamp = new Date(currentTime.getTime() + etaMinutes * 60 * 1000);
                const formattedEtaTime = etaTimestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={ord.id} className="bg-white border border-neutral-200 p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                    {/* Left Column information */}
                  <div className="flex-grow space-y-4">
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-neutral-900 tracking-wider font-mono uppercase">
                        #{ord.id?.slice(-8).toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-900 text-white text-[9px] font-mono uppercase tracking-widest font-bold">
                        {ord.status || "Prepping"}
                      </span>
                      {ord.type && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-mono uppercase tracking-widest font-bold border border-amber-100">
                          {ord.type}
                        </span>
                      )}
                    </div>

                    {/* Customer Info Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 p-4 border border-neutral-100 text-xs">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-neutral-400 font-extrabold uppercase block">
                          Consignee / Client
                        </span>
                        <p className="text-neutral-900 font-bold text-sm">{ord.customerName}</p>
                        <p className="flex items-center gap-1.5 text-neutral-500 font-mono mt-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" />
                          <a href={`tel:${ord.phone}`} className="hover:text-amber-600 hover:underline">{ord.phone}</a>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-neutral-400 font-extrabold uppercase block">
                          Delivery Coordinates / Area
                        </span>
                        <p className="text-neutral-700 leading-normal flex items-start gap-1 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <span>{ord.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Live ETA & Courier Dispatch Stats Box */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-amber-500/[0.04] border border-amber-500/15 p-4 text-xs rounded-sm">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono tracking-widest text-neutral-400 font-extrabold uppercase block">
                          Rider GPS Position
                        </span>
                        <p className="text-neutral-900 font-mono font-bold text-xs">
                          {currentRiderLat.toFixed(5)}, {currentRiderLng.toFixed(5)}
                        </p>
                        <span className="text-[9px] text-neutral-400 font-mono flex items-center gap-1 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isTracking === ord.id ? "bg-emerald-500 animate-ping" : "bg-neutral-400"}`} />
                          {isTracking === ord.id ? "Live GPS Signal active" : "Last synchronized"}
                        </span>
                      </div>
                      
                      <div className="space-y-1 border-l border-neutral-200 pl-0 md:pl-4">
                        <span className="text-[8px] font-mono tracking-widest text-neutral-400 font-extrabold uppercase block">
                          Total Route Distance
                        </span>
                        <p className="text-neutral-900 font-bold text-sm">
                          {distance.toFixed(2)} km
                        </p>
                        <span className="text-[9px] text-neutral-400 font-sans block mt-1">
                          Direct air route projection
                        </span>
                      </div>

                      <div className="space-y-1 border-l border-neutral-200 pl-0 md:pl-4 bg-amber-500/[0.06] p-2 -m-2 rounded">
                        <span className="text-[8px] font-mono tracking-widest text-[#d97706] font-black uppercase block">
                          Estimated Time of Arrival (ETA)
                        </span>
                        <p className="text-[#d97706] font-black text-sm flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{formattedEtaTime}</span>
                        </p>
                        <span className="text-[9.5px] text-[#b45309] font-mono font-extrabold uppercase tracking-wider block mt-0.5">
                          In ~{etaMinutes} mins (Dynamic)
                        </span>
                      </div>
                    </div>

                    {/* Verification Code Box & Interactive Validation Panel */}
                    {(() => {
                      const orderPasscode = (ord.verificationCode || ord.verification_code || ord.verificationcode || ord.VerificationCode || "").trim().toUpperCase();
                      const finalCode = orderPasscode || ("UPS-" + ord.id?.slice(-4).toUpperCase());
                      
                      return (
                        <div className="bg-amber-50/50 border border-amber-200 p-4 space-y-3.5 rounded mt-3">
                          <div className="flex items-center gap-2 text-amber-800">
                            <Lock className="w-4 h-4 shrink-0 text-amber-600" />
                            <span className="text-[9.5px] font-mono tracking-widest font-black uppercase">
                              Secured Delivery Verification Code
                            </span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-amber-150">
                            <div>
                              <span className="text-[8px] font-mono tracking-widest text-neutral-400 uppercase block font-bold">
                                Expected Securing OTP Code
                              </span>
                              <span className="text-base font-black font-mono tracking-widest text-[#d97706] uppercase mt-0.5 block select-all">
                                {finalCode}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-600 max-w-xs leading-relaxed font-sans">
                              Confirm that the consignee states this exact code in person. Enter it below to check and authorize handoff.
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-[8.5px] font-mono tracking-widest text-neutral-500 uppercase block mb-1 font-bold">
                              Interactive Owner Claim Code Check:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Type OTP (e.g. ABC123)"
                                value={verificationInputs[ord.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setVerificationInputs(prev => ({ ...prev, [ord.id]: val }));
                                }}
                                className="flex-grow bg-white border border-neutral-300 text-xs text-neutral-800 font-mono p-2 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              />
                              {(() => {
                                const typed = (verificationInputs[ord.id] || "").trim().toUpperCase();
                                if (typed === "") {
                                  return (
                                    <span className="px-2.5 py-2 bg-neutral-100 text-neutral-500 text-[9px] font-mono uppercase tracking-wider font-bold shrink-0 rounded border border-neutral-200">
                                      Awaiting Code
                                    </span>
                                  );
                                } else if (typed === finalCode) {
                                  return (
                                    <span className="px-2.5 py-2 bg-emerald-50 text-emerald-700 text-[9px] font-mono uppercase tracking-wider font-bold shrink-0 rounded border border-emerald-200 flex items-center gap-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      Owner Verified ✓
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="px-2.5 py-2 bg-red-50 text-red-600 text-[9px] font-mono uppercase tracking-wider font-bold shrink-0 rounded border border-red-200">
                                      Mismatched ✗
                                    </span>
                                  );
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Integrated Map & GPS tracking controls */}
                    <div className="pt-2">
                      <button
                        onClick={() => setExpandedMapId(expandedMapId === ord.id ? null : ord.id)}
                        className="w-full py-2 bg-neutral-150 hover:bg-neutral-200 text-neutral-800 font-mono text-[10px] tracking-widest uppercase text-center cursor-pointer transition-colors flex items-center justify-center gap-2 border border-neutral-200"
                      >
                        <Compass className={`w-3.5 h-3.5 text-[#d97706] ${isTracking === ord.id ? "animate-spin" : ""}`} />
                        <span>{expandedMapId === ord.id ? "Collapse Route Radar" : "Expand Route Radar & Live GPS"}</span>
                      </button>

                      {expandedMapId === ord.id && (
                        <RiderOrderMap
                          ord={ord}
                          leafletLoaded={leafletLoaded}
                          getStableCoords={getStableCoords}
                          isTracking={isTracking === ord.id}
                          onStartTracking={() => startTracking(ord.id)}
                          onStopTracking={stopTracking}
                          riderLat={isTracking === ord.id ? riderLat : null}
                          riderLng={isTracking === ord.id ? riderLng : null}
                          onRouteComputed={(path) => {
                            setComputedRoadPaths(prev => ({ ...prev, [ord.id]: path }));
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col justify-end gap-2 shrink-0 md:w-56">
                    {!ord.tripStarted ? (
                      <button
                        onClick={() => handleStartTrip(ord)}
                        disabled={tripLoadingId === ord.id}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-amber-600 disabled:opacity-55"
                      >
                        <Compass className={`w-4 h-4 shrink-0 ${tripLoadingId === ord.id ? "animate-spin" : ""}`} />
                        <span>{tripLoadingId === ord.id ? "Launching..." : "Start Delivery Trip"}</span>
                      </button>
                    ) : (
                      <div className="w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[9.5px] uppercase font-bold tracking-wider text-center rounded flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping shrink-0" />
                        <span>🏍️ Transit Trip Started</span>
                      </div>
                    )}

                    {(() => {
                      const orderPasscode = (ord.verificationCode || ord.verification_code || ord.verificationcode || ord.VerificationCode || "").trim().toUpperCase();
                      const finalCode = orderPasscode || ("UPS-" + ord.id?.slice(-4).toUpperCase());
                      const isVerified = (verificationInputs[ord.id] || "").trim().toUpperCase() === finalCode;
                      
                      return (
                        <button
                          onClick={() => {
                            if (!isVerified) {
                              const confirmBypass = window.confirm(
                                `Attention: You have not verified the secure owner code (${finalCode}) with the customer.\n\nAre you sure you want to bypass owner verification and mark this order as Completed?`
                              );
                              if (!confirmBypass) return;
                            }
                            handleMarkAsDone(ord.id);
                          }}
                          className={`w-full py-3 font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border rounded ${
                            isVerified 
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700 font-extrabold shadow" 
                              : "bg-green-700 hover:bg-green-600 text-white border-green-650"
                          }`}
                        >
                          {isVerified ? (
                            <ShieldCheck className="w-4 h-4 shrink-0 animate-pulse text-[#22c55e]" />
                          ) : (
                            <CheckCircle className="w-4 h-4 shrink-0 text-amber-50" />
                          )}
                          <span>{isVerified ? "Deliver (Owner Verified ✓)" : "Mark as Done"}</span>
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => setActiveChatOrderId(activeChatOrderId === ord.id ? null : ord.id)}
                      className={`w-full py-2.5 font-mono text-[10px] tracking-wider uppercase text-center cursor-pointer transition-all border ${
                        activeChatOrderId === ord.id 
                          ? "bg-amber-500 text-black border-amber-600 hover:bg-amber-400 font-bold" 
                          : "bg-neutral-900 text-white border-neutral-950 hover:bg-neutral-800"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Customer</span>
                      </span>
                    </button>

                    <a
                      href={`tel:${ord.phone}`}
                      className="w-full py-2 bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 font-mono text-[9px] tracking-wider uppercase text-center cursor-pointer transition-colors"
                    >
                      Call Consignee
                    </a>
                  </div>
                </div>

                {/* Live Real-time Customer Chat Section */}
                {activeChatOrderId === ord.id && (
                  <div className="border-t border-neutral-200 pt-4 animate-fadeIn">
                    <LiveChat
                      orderId={ord.id}
                      senderId={loggedInRider.username || "rider_courier"}
                      senderName={loggedInRider.fullName || "Courier Rider"}
                      recipientName={ord.customerName || "Customer"}
                      onClose={() => setActiveChatOrderId(null)}
                      theme="light"
                    />
                  </div>
                )}

              </div>
              ); })}
            </div>
          )}
        </div>

        {/* History / Completed Rides */}
        <div className="space-y-4 pt-4">
          <div className="border-b border-neutral-200 pb-2">
            <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-450 font-mono">
              Delivered &amp; Completed Archive ({assignedArchived.length})
            </h3>
          </div>

          {assignedArchived.length === 0 ? (
            <p className="text-[11px] text-neutral-400 font-sans italic">No historic assignments recorded under this courier profile.</p>
          ) : (
            <div className="bg-white border border-neutral-200 split-y divide-y divide-neutral-100 shadow-sm text-xs">
              {assignedArchived.slice(0, 10).map((ord) => (
                <div key={ord.id} className="p-3.5 flex items-center justify-between flex-wrap gap-2 hover:bg-neutral-50/50">
                  <div>
                    <span className="font-bold text-neutral-800 font-mono">#{ord.id?.slice(-8).toUpperCase()}</span>
                    <span className="text-neutral-300 mx-2">|</span>
                    <span className="text-neutral-500 font-sans">Client: {ord.customerName}</span>
                    <span className="text-neutral-300 mx-2">|</span>
                    <span className="text-neutral-400 shrink-0 font-mono text-[10px]">{ord.address}</span>
                  </div>
                  <span className="text-green-600 font-bold uppercase font-mono text-[9px] bg-green-50 px-2 py-0.5 border border-green-100">
                    Completed ✓
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
