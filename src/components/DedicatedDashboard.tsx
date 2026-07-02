import React, { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { MenuItem, MENU_ITEMS, CATEGORIES, Category } from "../data/menu";
import OrderHistory from "./OrderHistory";
import OrderTracker from "./OrderTracker";
import AdminAnalyticsPanel from "./AdminAnalyticsPanel";
import RidersManagementPanel from "./RidersManagementPanel";
import SupportManagementPanel from "./SupportManagementPanel";
import MenuImage from "./MenuImage";
import { 
  ShieldCheck, 
  MapPin, 
  ShoppingBag, 
  Heart, 
  Clock, 
  ArrowLeft, 
  Utensils, 
  LogIn, 
  LogOut,
  Package,
  User as UserIcon,
  Users,
  Settings,
  Plus,
  Compass,
  CheckCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Award,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  Mail,
  Send,
  CheckSquare,
  AlertCircle
} from "lucide-react";
import { collection, query, updateDoc, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { ShippingLocation, getApiUrl } from "../types";
import classicDrinks from "../assets/images/classic_restaurant_drinks_1782058509882.jpg";
import gourmetDrinks from "../assets/images/gourmet_drinks_hero_1782059009940.jpg";

interface DedicatedDashboardProps {
  currentUser: FirebaseUser | null;
  userRole?: string;
  menuItems?: MenuItem[];
  onBackToLobby: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onAddToCart: (item: MenuItem, variant?: string, extras?: string[], notes?: string) => void;
  onAuthClick: () => void;
  onLogout: () => void;
  onTrackOrder?: (order: any) => void;
  onReorder?: (items: any[]) => void;
  categories?: Category[];
  shippingLocations?: ShippingLocation[];
  isMySQLActive?: boolean;
}

const PRESET_IMAGES = [
  { name: "Classic Restaurant Drinks", url: classicDrinks },
  { name: "Gourmet Drinks Hero", url: gourmetDrinks }
];

export default function DedicatedDashboard({
  currentUser,
  userRole = "user",
  menuItems,
  onBackToLobby,
  favorites,
  onToggleFavorite,
  onAddToCart,
  onAuthClick,
  onLogout,
  onTrackOrder,
  onReorder,
  categories,
  shippingLocations = [],
  isMySQLActive = false
}: DedicatedDashboardProps) {
  const finalMenuItems = menuItems || MENU_ITEMS;
  const displayCategories = categories || CATEGORIES;
  const isPrivileged = userRole === "admin" || userRole === "sales" || userRole === "chef";

  // State Tabs depending on profile roles
  const [activeTab, setActiveTab] = useState<string>("history");
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(() => {
    const saved = localStorage.getItem("upside_active_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.id || null;
      } catch (_) {}
    }
    return null;
  });

  // Real-time directory storage
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchText, setUserSearchText] = useState("");
  const [menuSearchText, setMenuSearchText] = useState("");
  
  // Real-time pipeline order logs
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [ridersList, setRidersList] = useState<any[]>([]);
  const [ordersSearchText, setOrdersSearchText] = useState("");
  const [selectedOrderTab, setSelectedOrderTab] = useState<string>("all");
  const [pipelineChannelFilter, setPipelineChannelFilter] = useState<string>("all");
  const [isVerifyingOpayId, setIsVerifyingOpayId] = useState<string | null>(null);
  const [whatsappSearchText, setWhatsappSearchText] = useState("");
  const [whatsappStatusFilter, setWhatsappStatusFilter] = useState<string>("all");

  // Custom Email to Customer Modal States
  const [emailModalOrder, setEmailModalOrder] = useState<any | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  // Form states to create customized menu items
  const [newMenuData, setNewMenuData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    category: "starters",
    image: PRESET_IMAGES[0].url,
    tags: "Chef's Special, Spicy",
    specs: "Contains premium native spices",
    available: true
  });
  const [menuFormError, setMenuFormError] = useState("");
  const [menuFormSuccess, setMenuFormSuccess] = useState("");

  // IMAGE LIBRARY STATES
  const [customImages, setCustomImages] = useState<{ id: string, name: string, url: string }[]>([]);
  const [newImageName, setNewImageName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageFormSuccess, setImageFormSuccess] = useState("");
  const [imageFormError, setNewImageFormError] = useState("");

  // BULK IMAGE LIBRARY STATES
  const [imageUploadMode, setImageUploadMode] = useState<"single" | "bulk">("single");
  const [bulkImagesList, setBulkImagesList] = useState<{ id: string; name: string; url: string; size?: string; source: "file" | "url" }[]>([]);
  const [bulkUrlInput, setBulkUrlInput] = useState("");
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{ current: number; total: number; active: boolean; statusText: string }>({
    current: 0,
    total: 0,
    active: false,
    statusText: ""
  });
  const [isDragOver, setIsDragOver] = useState(false);

  // STATIC MENU DB SYNC STATES
  const [isSyncingMenu, setIsSyncingMenu] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSyncStaticMenu = async () => {
    setIsSyncingMenu(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/seed-menu");
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSyncStatus(`SUCCESS: ${data.message}`);
      } else {
        setSyncStatus(`ERROR: ${data.error || "Failed to synchronize menu."}`);
      }
    } catch (err: any) {
      setSyncStatus(`ERROR: ${err.message || err}`);
    } finally {
      setIsSyncingMenu(false);
    }
  };

  // CUSTOM CATEGORIES STATES
  const [newCatData, setNewCatData] = useState({
    id: "",
    name: "",
    description: "",
    icon: "Utensils",
  });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catFormSuccess, setCatFormSuccess] = useState("");
  const [catFormError, setCatFormError] = useState("");

  // INSTAGRAM FEED INTEGRATION STATES
  const [instagramToken, setInstagramToken] = useState("");
  const [instagramUsername, setInstagramUsername] = useState("");
  const [instagramLastSynced, setInstagramLastSynced] = useState("");
  const [instagramSyncStatus, setInstagramSyncStatus] = useState("");
  const [instagramSyncError, setInstagramSyncError] = useState("");
  const [isInstagramConfigLoading, setIsInstagramConfigLoading] = useState(false);
  const [isInstagramSyncing, setIsInstagramSyncing] = useState(false);

  // Manual Instagram Post insert form
  const [manualPostUrl, setManualPostUrl] = useState("");
  const [manualPostCaption, setManualPostCaption] = useState("");
  const [manualPostPermalink, setManualPostPermalink] = useState("");
  const [instagramActionSuccess, setInstagramActionSuccess] = useState("");
  const [syncedInstagramPosts, setSyncedInstagramPosts] = useState<any[]>([]);

  // Load Instagram configuration
  useEffect(() => {
    if (currentUser && (userRole === "admin" || userRole === "developer")) {
      const unsub = onSnapshot(doc(db, "settings", "instagram"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInstagramToken(data.accessToken || "");
          setInstagramUsername(data.username || "");
          setInstagramLastSynced(data.lastSyncedAt || "");
        }
      }, (err) => {
        console.warn("Could not fetch Instagram config doc:", err);
      });
      return () => unsub();
    }
  }, [currentUser, userRole]);

  // Load current Instagram posts in database
  useEffect(() => {
    if (currentUser && (userRole === "admin" || userRole === "developer")) {
      const q = query(collection(db, "instagram_posts"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts: any[] = [];
        snapshot.forEach((docSnap) => {
          posts.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort by createdAt descending
        posts.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        setSyncedInstagramPosts(posts);
      }, (err) => {
        console.warn("Failed to load synced instagram posts:", err);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // OPAY SECURE GATEWAY CONFIGURATION FOR ADMINS
  const [opayMerchantId, setOpayMerchantId] = useState("");
  const [opayPublicKey, setOpayPublicKey] = useState("");
  const [opaySecretKey, setOpaySecretKey] = useState("");
  const [opayEnvironment, setOpayEnvironment] = useState("sandbox");
  const [opayActionSuccess, setOpayActionSuccess] = useState("");
  const [opayActionError, setOpayActionError] = useState("");
  const [isOpayLoading, setIsOpayLoading] = useState(false);

  // Load OPay settings config
  useEffect(() => {
    if (currentUser && (userRole === "admin" || userRole === "developer")) {
      const unsub = onSnapshot(doc(db, "settings", "opay"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const mId = data.merchantId || "";
          const pKey = data.publicKey || "";
          const sKey = data.secretKey || "";
          const env = data.environment || "sandbox";

          setOpayMerchantId(mId);
          setOpayPublicKey(pKey);
          setOpaySecretKey(sKey);
          setOpayEnvironment(env);

          // If valid credentials exist in the admin's Firestore document, automatically sync them to .env on load!
          if (mId && pKey && sKey) {
            fetch(getApiUrl("/api/opay/convert-to-env"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merchantId: mId, publicKey: pKey, secretKey: sKey, environment: env })
            }).then(() => {
              console.log("[AUTO-CONVERT-TO-ENV] Loaded and synchronized OPay credentials with .env on backend process.");
            }).catch(syncErr => {
              console.warn("[AUTO-CONVERT-TO-ENV] Onload environment sync failed:", syncErr);
            });
          }
        }
      }, (err) => {
        console.warn("Could not fetch OPay config doc:", err);
      });
      return () => unsub();
    }
  }, [currentUser, userRole]);

  const handleSaveOpayConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpayActionError("");
    setOpayActionSuccess("");
    setIsOpayLoading(true);

    try {
      const cleanMId = opayMerchantId.trim();
      const cleanPKey = opayPublicKey.trim();
      const cleanSKey = opaySecretKey.trim();

      await setDoc(doc(db, "settings", "opay"), {
        merchantId: cleanMId,
        publicKey: cleanPKey,
        secretKey: cleanSKey,
        environment: opayEnvironment,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || "admin"
      }, { merge: true });

      // On successful database write, automatically replicate/convert these values to server env securely!
      try {
        await fetch(getApiUrl("/api/opay/convert-to-env"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchantId: cleanMId,
            publicKey: cleanPKey,
            secretKey: cleanSKey,
            environment: opayEnvironment
          })
        });
        console.log("[AUTO-CONVERT-TO-ENV] Successfully synchronized manual update with server-side environment!");
      } catch (envSyncErr) {
        console.warn("[AUTO-CONVERT-TO-ENV] Manual sync failed:", envSyncErr);
      }

      setOpayActionSuccess("OPay payment credentials configured and saved successfully!");
    } catch (err: any) {
      console.error("Failed to save OPay configuration:", err);
      setOpayActionError(err.message || "Failed to save secure gateway configurations.");
    } finally {
      setIsOpayLoading(false);
    }
  };

  // MYSQL HOST DATABASE MANAGEMENT PANEL
  const [mysqlHost, setMysqlHost] = useState("");
  const [mysqlPort, setMysqlPort] = useState("3306");
  const [mysqlUser, setMysqlUser] = useState("");
  const [mysqlPassword, setMysqlPassword] = useState("");
  const [mysqlDatabase, setMysqlDatabase] = useState("");
  const [mysqlStatus, setMysqlStatus] = useState<"connected" | "disconnected" | "loading">("loading");
  const [mysqlStatusMessage, setMysqlStatusMessage] = useState("");
  const [mysqlTables, setMysqlTables] = useState<{ tableName: string; rows: number }[]>([]);
  const [mysqlActionSuccess, setMysqlActionSuccess] = useState("");
  const [mysqlActionError, setMysqlActionError] = useState("");
  const [isMysqlLoading, setIsMysqlLoading] = useState(false);
  const [isSchemaSetupWorking, setIsSchemaSetupWorking] = useState(false);
  const [isDataSyncWorking, setIsDataSyncWorking] = useState(false);

  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<any | null>(null);

  const runDatabaseDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    setDiagnosticInfo(null);
    setDiagnosticError(null);
    try {
      const res = await fetch(getApiUrl("/api/mysql/diagnostic"));
      const data = await res.json();
      if (!res.ok || data.success === false) {
        setDiagnosticError(data.errorDetails || { message: data.message || "Failed to execute diagnostic." });
      } else {
        setDiagnosticInfo(data);
      }
    } catch (err: any) {
      setDiagnosticError({ message: err.message || "Network request failed." });
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  // Poll MySQL status on mount and when role is admin
  const fetchMySQLStatus = async () => {
    try {
      const res = await fetch(getApiUrl("/api/mysql/status"));
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setMysqlStatus("connected");
          setMysqlStatusMessage(data.message);
          setMysqlTables(data.tables || []);
        } else {
          setMysqlStatus("disconnected");
          setMysqlStatusMessage(data.message || "MySQL is currently offline or unconfigured.");
          setMysqlTables([]);
        }
        // Pre-populate input configurations returned from process env safely
        if (data.config) {
          if (data.config.host) setMysqlHost(data.config.host);
          if (data.config.port) setMysqlPort(data.config.port);
          if (data.config.user) setMysqlUser(data.config.user);
          if (data.config.database) setMysqlDatabase(data.config.database);
        }
      }
    } catch (err: any) {
      setMysqlStatus("disconnected");
      setMysqlStatusMessage(`Gateway API error fetching database status: ${err.message}`);
    }
  };

  useEffect(() => {
    if (currentUser && userRole === "admin" && activeTab === "mysql_panel") {
      setMysqlStatus("loading");
      fetchMySQLStatus();
    }
  }, [currentUser, userRole, activeTab]);

  const handleSaveMySQLConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setMysqlActionError("");
    setMysqlActionSuccess("");
    setIsMysqlLoading(true);

    try {
      const payload = {
        host: mysqlHost.trim(),
        port: parseInt(mysqlPort.trim() || "3306", 10),
        user: mysqlUser.trim(),
        password: mysqlPassword.trim(),
        database: mysqlDatabase.trim()
      };

      const res = await fetch(getApiUrl("/api/mysql/convert-to-env"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save MySQL configurations.");
      }

      setMysqlActionSuccess("MySQL settings saved and app database worker restarted successfully!");
      // Live query status of new credentials
      setTimeout(() => fetchMySQLStatus(), 1000);
    } catch (err: any) {
      console.error("Save MySQL config failed:", err);
      setMysqlActionError(err.message || "Failed to apply dynamic MySQL secrets.");
    } finally {
      setIsMysqlLoading(false);
    }
  };

  const handleMySQLSchemaSetup = async () => {
    if (!window.confirm("Are you absolutely sure you want to initialize the MySQL schemas on your cPanel database? This will execute CREATE TABLE statements and seed the structural product lists.")) {
      return;
    }
    setMysqlActionError("");
    setMysqlActionSuccess("");
    setIsSchemaSetupWorking(true);

    try {
      const res = await fetch(getApiUrl("/api/mysql/setup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Schema setup crashed on target host.");
      }
      setMysqlActionSuccess(`Success: ${data.message} Seeded categories and menus.`);
      fetchMySQLStatus();
    } catch (err: any) {
      setMysqlActionError(err.message || "Could not complete SQL table setup.");
    } finally {
      setIsSchemaSetupWorking(false);
    }
  };

  const handleMySQLDataSync = async () => {
    if (!window.confirm("Replicate all active reservations, registers, users profiles, and dynamic order logs from Cloud Firestore into MySQL?")) {
      return;
    }
    setMysqlActionError("");
    setMysqlActionSuccess("");
    setIsDataSyncWorking(true);

    try {
      const res = await fetch(getApiUrl("/api/mysql/sync"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: allUsers,
          orders: allOrders,
          riders: ridersList
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Data sync aborted.");
      }
      setMysqlActionSuccess(`Replication Success! Synchronized ${data.synced.users} users, ${data.synced.orders} orders, and ${data.synced.riders || 0} riders into MySQL!`);
      fetchMySQLStatus();
    } catch (err: any) {
      setMysqlActionError(err.message || "Data synchronization error.");
    } finally {
      setIsDataSyncWorking(false);
    }
  };

  // Handle popup window handshake response message
  useEffect(() => {
    const handleAuthHandshakeMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      // Accept messaging from the developer app container or preview domains style
      if (!origin.endsWith(".run.app") && !origin.includes("localhost")) {
        return;
      }

      const data = event.data;
      if (data && data.type === "INSTAGRAM_AUTH_SUCCESS") {
        const { accessToken, username } = data;
        setInstagramSyncError("");
        setInstagramActionSuccess("Handshake Authorized successfully!");
        setInstagramSyncStatus("Saving Instagram credentials securely...");
        setIsInstagramConfigLoading(true);

        try {
          setInstagramToken(accessToken);
          setInstagramUsername(username);

          // Update settings document securely in backend
          await setDoc(doc(db, "settings", "instagram"), {
            accessToken,
            username,
            lastSyncedAt: new Date().toISOString()
          }, { merge: true });

          setInstagramActionSuccess(`Connected Instagram handle @${username}! Automatically retrieving active feed...`);
          setInstagramSyncStatus("");
          
          // Trigger immediate synchronization with the newly achieved access token!
          await handleSyncInstagramFeed(accessToken);
        } catch (err) {
          console.error("Failed to process authorized handshake token:", err);
          setInstagramSyncError("Handshake Save Failed: " + (err instanceof Error ? err.message : String(err)));
          setInstagramSyncStatus("");
        } finally {
          setIsInstagramConfigLoading(false);
        }
      }
    };

    window.addEventListener("message", handleAuthHandshakeMessage);
    return () => window.removeEventListener("message", handleAuthHandshakeMessage);
  }, [currentUser, userRole, instagramToken]);

  const handleSaveInstagramConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstagramSyncError("");
    setInstagramActionSuccess("");
    setIsInstagramConfigLoading(true);

    try {
      await setDoc(doc(db, "settings", "instagram"), {
        accessToken: instagramToken,
        username: instagramUsername,
        lastSyncedAt: instagramLastSynced || ""
      }, { merge: true });
      setInstagramActionSuccess("Instagram api credentials saved successfully in Firebase backend settings node!");
    } catch (err) {
      setInstagramSyncError("Failed to save settings: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsInstagramConfigLoading(false);
    }
  };

  const handleInstagramConnectHandshake = async () => {
    setInstagramSyncError("");
    setInstagramActionSuccess("");
    setInstagramSyncStatus("Initializing custom handshake gateway sessions...");

    try {
      const response = await fetch(getApiUrl("/api/instagram/auth-url"));
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to start: HTTP ${response.status}`);
      }

      const { url } = await response.json();
      const width = 580;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const authWindow = window.open(
        url,
        "instagram_handshake_popup",
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
      );

      if (!authWindow) {
        throw new Error("Popup was blocked by the browser. Please support popups to complete verification.");
      }

      setInstagramSyncStatus("Handshake popup active. Waiting for you to verify ownership on Instagram...");
    } catch (err) {
      console.error("Instagram popup opening issue:", err);
      setInstagramSyncError(err instanceof Error ? err.message : String(err));
      setInstagramSyncStatus("");
    }
  };

  const handleSyncInstagramFeed = async (overrideToken?: string) => {
    const tokenToUse = overrideToken || instagramToken;
    if (!tokenToUse) {
      setInstagramSyncError("An Instagram Access Token is required to synchronize the feed.");
      return;
    }
    setInstagramSyncError("");
    setInstagramActionSuccess("");
    setIsInstagramSyncing(true);
    setInstagramSyncStatus("Connecting to Instagram Graph API...");

    try {
      const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
      const url = `https://graph.instagram.com/me/media?fields=${fields}&access_token=${tokenToUse}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP error! Status: ${response.status}`);
      }

      const resJson = await response.json();
      const mediaList = resJson.data || [];

      if (mediaList.length === 0) {
        setInstagramSyncStatus("No media posts found in your Instagram feed.");
        setIsInstagramSyncing(false);
        return;
      }

      setInstagramSyncStatus(`Fetched ${mediaList.length} items. Saving to Firebase...`);

      // Write each post to collection
      const batchPromises = mediaList.map(async (item: any) => {
        const imageUrl = item.media_type === "VIDEO" ? (item.thumbnail_url || item.media_url) : item.media_url;
        const postDocRef = doc(db, "instagram_posts", item.id);
        const postData = {
          id: item.id,
          caption: item.caption || "Upside Dining Moment",
          media_url: imageUrl || "",
          permalink: item.permalink || "https://instagram.com",
          media_type: item.media_type || "IMAGE",
          timestamp: item.timestamp || new Date().toISOString(),
          createdAt: new Date(item.timestamp || Date.now()).toISOString(),
        };
        return setDoc(postDocRef, postData);
      });

      await Promise.all(batchPromises);

      // Update Instagram setting last sync timestamp
      const syncDateString = new Date().toISOString();
      await setDoc(doc(db, "settings", "instagram"), {
        lastSyncedAt: syncDateString
      }, { merge: true });

      setInstagramLastSynced(syncDateString);
      setInstagramActionSuccess(`Successfully parsed and synchronized ${mediaList.length} live Instagram feed items!`);
      setInstagramSyncStatus("");
    } catch (err) {
      console.error("Instagram sync failure:", err);
      setInstagramSyncError("Sync failed: " + (err instanceof Error ? err.message : String(err)));
      setInstagramSyncStatus("");
    } finally {
      setIsInstagramSyncing(false);
    }
  };

  const handleAddManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPostUrl) {
      setInstagramSyncError("Please provide a valid Image URL.");
      return;
    }
    setInstagramSyncError("");
    setInstagramActionSuccess("");

    try {
      const postId = "manual-" + Date.now();
      const postRef = doc(db, "instagram_posts", postId);
      await setDoc(postRef, {
        id: postId,
        caption: manualPostCaption || "Admin Curated Moment",
        media_url: manualPostUrl,
        permalink: manualPostPermalink || "https://instagram.com",
        media_type: "IMAGE",
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      setManualPostUrl("");
      setManualPostCaption("");
      setManualPostPermalink("");
      setInstagramActionSuccess("Custom curated feed moment uploaded and saved successfully!");
    } catch (err) {
      setInstagramSyncError("Failed to save post: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this Instagram post from the dynamic website feed?")) {
      return;
    }
    setInstagramSyncError("");
    setInstagramActionSuccess("");
    try {
      await deleteDoc(doc(db, "instagram_posts", id));
      setInstagramActionSuccess("Post successfully decoupled and removed from live grid.");
    } catch (err) {
      setInstagramSyncError("Failed to delete post: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Custom Image observer inside dashboard
  useEffect(() => {
    if (currentUser && userRole === "admin") {
      const q = query(collection(db, "assets"));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          // Seed the PRESET_IMAGES elements into the assets collection in Firebase
          const seedPromises = PRESET_IMAGES.map(async (img, idx) => {
            const presetId = `preset-${idx}`;
            const payload = {
              id: presetId,
              name: img.name,
              url: img.url,
              createdAt: new Date().toISOString(),
              isPreset: true
            };
            return setDoc(doc(db, "assets", presetId), payload);
          });
          try {
            await Promise.all(seedPromises);
          } catch (seedErr) {
            console.error("Failed to seed preset images:", seedErr);
          }
          return;
        }
        const tempImgs: any[] = [];
        snapshot.forEach((docSnap) => {
          tempImgs.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort: Presets first, then custom ones, ordered by creation date
        tempImgs.sort((a, b) => {
          if (a.isPreset && !b.isPreset) return -1;
          if (!a.isPreset && b.isPreset) return 1;
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setCustomImages(tempImgs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, "assets");
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // Combined library of options for selection and listing
  const combinedImages = customImages.map(img => ({ name: img.name, url: img.url, isPreset: img.isPreset }));

  // Actions for custom images
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewImageFormError("");
    setImageFormSuccess("");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Downscale the image to fit within 800px bounds for rapid, bulletproof loading
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG with high quality compression
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
            setNewImageUrl(compressedBase64);
            setImageFormSuccess("Local image optimized and converted to secure compressed format successfully!");
          } else {
            setNewImageUrl(reader.result as string);
            setImageFormSuccess("Local image successfully prepared for dynamic save.");
          }
        };
        img.onerror = () => {
          setNewImageFormError("Could not process local image data.");
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setNewImageFormError("Could not read local file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCustomImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewImageFormError("");
    setImageFormSuccess("");
    if (!newImageName.trim()) {
      setNewImageFormError("Image name description is requested.");
      return;
    }
    if (!newImageUrl.trim()) {
      setNewImageFormError("Please enter a URL or select a local image file.");
      return;
    }
    const parsedId = newImageName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") + "-" + Date.now();
    try {
      const payload = {
        id: parsedId,
        name: newImageName.trim(),
        url: newImageUrl.trim(),
        createdAt: new Date().toISOString(),
        isPreset: false
      };
      // 1. Save to Firestore
      await setDoc(doc(db, "assets", parsedId), payload);

      // 2. Sync to MySQL
      const mysqlRes = await fetch(getApiUrl("/api/mysql/assets"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!mysqlRes.ok) {
        console.warn("Failed to sync single asset to MySQL:", await mysqlRes.text());
      }

      setImageFormSuccess(`Image "${newImageName}" successfully registered to library and synced to MySQL.`);
      setNewImageName("");
      setNewImageUrl("");
    } catch (err: any) {
      console.error("Save image failed:", err);
      setNewImageFormError(`Failed to save image: ${err.message}`);
      handleFirestoreError(err, OperationType.WRITE, `assets/${parsedId}`);
    }
  };

  const handleDeleteCustomImage = async (imgId: string, imgName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${imgName}" from your library?`)) return;
    try {
      // 1. Delete from Firestore
      await deleteDoc(doc(db, "assets", imgId));

      // 2. Sync deletion to MySQL
      const mysqlRes = await fetch(getApiUrl(`/api/mysql/assets/${imgId}`), {
        method: "DELETE"
      });
      if (!mysqlRes.ok) {
        console.warn("Failed to sync deletion of asset to MySQL:", await mysqlRes.text());
      }

      setImageFormSuccess(`"${imgName}" was deleted from the library and MySQL database.`);
    } catch (err: any) {
      console.error("Delete image failed:", err);
      alert(`Failed to delete image: ${err.message}`);
      handleFirestoreError(err, OperationType.DELETE, `assets/${imgId}`);
    }
  };

  const processFilesForBulk = (files: FileList) => {
    setNewImageFormError("");
    setImageFormSuccess("");
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setNewImageFormError("Only image files are accepted.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setNewImageFormError("Some images were skipped as they exceed 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const downscaledUrl = canvas.toDataURL("image/jpeg", 0.75);
            
            const cleanName = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase());

            const uniqueId = "bulk-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
            const sizeInKb = Math.round(downscaledUrl.length * 0.75 / 1024);

            setBulkImagesList((prev) => [
              ...prev,
              {
                id: uniqueId,
                name: cleanName,
                url: downscaledUrl,
                size: `${sizeInKb} KB`,
                source: "file"
              }
            ]);
          }
        };
        img.onerror = () => {
          setNewImageFormError("Could not process one of the image files.");
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setNewImageFormError("Could not read local file.");
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddBulkUrls = () => {
    setNewImageFormError("");
    setImageFormSuccess("");
    if (!bulkUrlInput.trim()) {
      setNewImageFormError("Please enter at least one URL.");
      return;
    }

    const urls = bulkUrlInput
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http://") || u.startsWith("https://"));

    if (urls.length === 0) {
      setNewImageFormError("No valid URLs starting with http:// or https:// were found.");
      return;
    }

    const newEntries = urls.map((url, index) => {
      let defaultLabel = "External Asset";
      try {
        const pathname = new URL(url).pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (filename && filename.includes('.')) {
          defaultLabel = filename
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
        }
      } catch (_) {}

      const uniqueId = "bulk-url-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7) + "-" + index;
      return {
        id: uniqueId,
        name: defaultLabel,
        url: url,
        size: "Remote URL",
        source: "url" as const
      };
    });

    setBulkImagesList((prev) => [...prev, ...newEntries]);
    setBulkUrlInput("");
    setImageFormSuccess(`Added ${newEntries.length} external image(s) to prepared batch.`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFilesForBulk(e.dataTransfer.files);
    }
  };

  const handleRemovePreparedImage = (id: string) => {
    setBulkImagesList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdatePreparedName = (id: string, newName: string) => {
    setBulkImagesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handlePublishBulkImages = async () => {
    setNewImageFormError("");
    setImageFormSuccess("");
    if (bulkImagesList.length === 0) {
      setNewImageFormError("Please prepare at least one image in the batch first.");
      return;
    }

    setBulkUploadProgress({
      current: 0,
      total: bulkImagesList.length,
      active: true,
      statusText: "Initializing bulk library write..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < bulkImagesList.length; i++) {
      const item = bulkImagesList[i];
      setBulkUploadProgress((prev) => ({
        ...prev,
        current: i + 1,
        statusText: `Publishing: "${item.name}" (${i + 1}/${bulkImagesList.length})...`
      }));

      const cleanLabel = item.name.trim() || "Bulk Asset";
      const parsedId = cleanLabel.toLowerCase().replace(/[^a-z0-9_-]/g, "-") + "-" + Date.now() + "-" + i;

      try {
        const payload = {
          id: parsedId,
          name: cleanLabel,
          url: item.url,
          createdAt: new Date().toISOString(),
          isPreset: false
        };
        // 1. Write to Firestore
        await setDoc(doc(db, "assets", parsedId), payload);

        // 2. Sync to MySQL
        const mysqlRes = await fetch(getApiUrl("/api/mysql/assets"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!mysqlRes.ok) {
          console.warn(`Failed to sync bulk asset "${cleanLabel}" to MySQL:`, await mysqlRes.text());
        }

        successCount++;
      } catch (err) {
        console.error("Bulk upload item failed:", err);
        failCount++;
      }
    }

    setBulkUploadProgress({
      current: successCount,
      total: bulkImagesList.length,
      active: false,
      statusText: ""
    });

    if (failCount === 0) {
      setImageFormSuccess(`Successfully published and synced all ${successCount} images to the visual library and MySQL database!`);
      setBulkImagesList([]);
    } else {
      setNewImageFormError(`Published ${successCount} images, but ${failCount} failed. Please verify and retry.`);
      setBulkImagesList((prev) => prev.slice(successCount));
    }
  };

  // Actions for Categories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError("");
    setCatFormSuccess("");
    if (!newCatData.id.trim() || !newCatData.name.trim() || !newCatData.description.trim()) {
      setCatFormError("All fields are strictly requested.");
      return;
    }
    const parsedId = newCatData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!parsedId) {
      setCatFormError("Slug ID must contain valid small case alphanumeric characters only.");
      return;
    }
    try {
      const payload = {
        id: parsedId,
        name: newCatData.name.trim(),
        description: newCatData.description.trim(),
        icon: newCatData.icon,
        updatedAt: new Date().toISOString()
      };
      if (isMySQLActive) {
        const res = await fetch(getApiUrl("/api/mysql/categories"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          throw new Error("Unable to execute category write within MySQL host.");
        }
      } else {
        await setDoc(doc(db, "categories", parsedId), payload);
      }
      if (editingCatId) {
        setCatFormSuccess(`"${payload.name}" updated successfully.`);
        setEditingCatId(null);
      } else {
        setCatFormSuccess(`"${payload.name}" category created successfully.`);
      }
      setNewCatData({
        id: "",
        name: "",
        description: "",
        icon: "Utensils"
      });
    } catch (err: any) {
      console.error("Save category failed:", err);
      setCatFormError(`Failed to save category to database: ${err.message}`);
    }
  };

  const handleUnhideCategory = async (cat: Category) => {
    if (!window.confirm(`Are you sure you want to unhide/enable Category "${cat.name}"? It will immediately show on the live store.`)) return;
    try {
      if (isMySQLActive) {
        const res = await fetch(getApiUrl("/api/mysql/categories"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cat, deleted: 0 })
        });
        if (!res.ok) throw new Error("Failed to restore category state inside MySQL.");
      } else {
        await deleteDoc(doc(db, "categories", cat.id));
      }
      setCatFormSuccess(`"${cat.name}" has been enabled/unhidden successfully!`);
    } catch (err: any) {
      console.error("Unhide category failed:", err);
      alert(`Could not unhide category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you absolutely sure you want to delete Category "${cat.name}"? This won't delete menu items but will remove the category filter.`)) return;
    try {
      if (isMySQLActive) {
        const res = await fetch(getApiUrl(`/api/mysql/categories/${cat.id}`), {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Failed to soft delete category on MySQL host.");
      } else {
        const isNativeStatic = CATEGORIES.some(s => s.id === cat.id);
        if (isNativeStatic) {
          // Soft delete preset static categories by writing custom deleted status
          await setDoc(doc(db, "categories", cat.id), {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
            deleted: true,
            updatedAt: new Date().toISOString()
          });
        } else {
          await deleteDoc(doc(db, "categories", cat.id));
        }
      }
      setCatFormSuccess(`"${cat.name}" deleted successfully.`);
      if (editingCatId === cat.id) {
        setEditingCatId(null);
        setNewCatData({ id: "", name: "", description: "", icon: "Utensils" });
      }
    } catch (err: any) {
      console.error("Delete category failed:", err);
      alert(`Could not delete category: ${err.message}`);
    }
  };

  const handleToggleCategoryDisabled = async (cat: Category, currentDisabled: boolean) => {
    const actionText = currentDisabled ? "enable" : "disable";
    if (!window.confirm(`Are you sure you want to ${actionText} the Category "${cat.name}"?`)) return;
    try {
      if (isMySQLActive) {
        const res = await fetch(getApiUrl("/api/mysql/categories"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cat, disabled: !currentDisabled ? 1 : 0 })
        });
        if (!res.ok) throw new Error("Unable to save status inside MySQL database.");
      } else {
        const isNativeStatic = CATEGORIES.some(s => s.id === cat.id);
        if (isNativeStatic) {
          // For static core categories, write or merge the disabled flag
          await setDoc(doc(db, "categories", cat.id), {
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            description: cat.description,
            disabled: !currentDisabled,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } else {
          // For custom categories, update the disabled property
          const catRef = doc(db, "categories", cat.id);
          await updateDoc(catRef, { disabled: !currentDisabled });
        }
      }
      setCatFormSuccess(`"${cat.name}" category has been ${currentDisabled ? "enabled" : "disabled"} successfully!`);
    } catch (err: any) {
      console.error("Toggle category disabled failed:", err);
      alert(`Could not toggle category state: ${err.message}`);
    }
  };

  // Auto fallback tabs selection safely on load or role shift
  useEffect(() => {
    if (userRole === "admin") {
      setActiveTab("users_panel");
    } else if (userRole === "sales" || userRole === "chef") {
      setActiveTab("orders_pipeline");
    } else if (userRole === "menu_lister") {
      setActiveTab("menus_panel");
    } else if (userRole === "developer") {
      setActiveTab("mysql_panel");
    } else {
      setActiveTab("history");
    }
  }, [userRole]);

  // Read users real-time if Admin clearance
  useEffect(() => {
    if (currentUser && userRole === "admin") {
      const q = query(collection(db, "users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tempUsers: any[] = [];
        snapshot.forEach((docSnap) => {
          tempUsers.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAllUsers(tempUsers);
      }, (err) => {
        console.error("User list reading permission denied:", err);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // Read global pipeline orders real-time if privileged staff clearance
  useEffect(() => {
    if (currentUser && isPrivileged) {
      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tempOrders: any[] = [];
        snapshot.forEach((docSnap) => {
          tempOrders.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Sort descending
        tempOrders.sort((a, b) => b.timestamp - a.timestamp);
        setAllOrders(tempOrders);
      }, (err) => {
        console.error("Orders pipeline reading permission denied:", err);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole, isPrivileged]);

  // Read riders real-time for dropdown selection
  useEffect(() => {
    if (currentUser && isPrivileged) {
      const q = query(collection(db, "riders"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRidersList(list);
      }, (err) => {
        console.error("Riders reading error:", err);
      });
      return () => unsubscribe();
    }
  }, [currentUser, isPrivileged]);

  // Handle setting a user role directly
  const handleSetUserRole = async (userId: string, targetRole: string) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: targetRole });
    } catch (e: any) {
      console.error("Role update failed:", e);
      alert(`Could not update user role: ${e.message}`);
    }
  };

  // Handle toggling user disabled state
  const handleToggleUserDisabled = async (userId: string, currentDisabled: boolean) => {
    const actionText = currentDisabled ? "enable" : "suspend";
    if (userId === currentUser?.uid) {
      alert("Self suspension is locked by system security policies.");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to ${actionText} this user's profile and credentials?`)) return;
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { disabled: !currentDisabled });
    } catch (e: any) {
      console.error("User profile suspension toggle failed:", e);
      alert(`Could not toggle suspension state: ${e.message}`);
    }
  };

  // Handle deleting database user profile completely
  const handleDeleteUserProfile = async (userId: string) => {
    if (userId === currentUser?.uid) {
      alert("Self deletion is locked to prevent administrative lockout.");
      return;
    }
    if (!window.confirm("WARNING: Are you absolutely sure you want to permanently delete this user's profile database entry? This action is permanent and cannot be undone.")) {
      return;
    }
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      alert("User profile permanently deleted from the database.");
    } catch (e: any) {
      console.error("User profile deletion failed:", e);
      alert(`Failed to delete user profile: ${e.message}`);
    }
  };

  // Handle setting order progress state
  const handleSetOrderStatus = async (orderId: string, statusText: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: statusText, updatedAt: new Date().toISOString() });

      // Trigger server-side ERP update-status which emails the user and logs activity to the admin
      fetch(getApiUrl("/api/delivery/orders/update-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: statusText
        })
      }).catch(err => console.error("Could not dispatch status update ERP logs:", err));
    } catch (e: any) {
      console.error("Order status shift failed:", e);
      alert(`Could not transition order progress: ${e.message}`);
    }
  };

  // Handle updating WhatsApp order payment status and optionally dispatching confirmation email
  const handleUpdateWhatsAppStatus = async (order: any, newPaymentStatus: string) => {
    try {
      const orderRef = doc(db, "orders", order.id);
      
      // Update Firestore
      await updateDoc(orderRef, {
        paymentStatus: newPaymentStatus,
        // If marked as paid, we can set the kitchen status to Prepping so it enters the cooking pipeline
        ...(newPaymentStatus === "paid" ? { status: "Prepping" } : {}),
        updatedAt: new Date().toISOString()
      });

      // Update MySQL if active
      if (isMySQLActive) {
        await fetch(getApiUrl(`/api/mysql/orders/${order.id}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentStatus: newPaymentStatus,
            ...(newPaymentStatus === "paid" ? { status: "Prepping" } : {})
          })
        }).catch(err => console.error("Could not sync paymentStatus to MySQL:", err));
      }

      // If transition to paid, send email confirmation!
      if (newPaymentStatus === "paid") {
        if (order.email && order.email !== "guest@example.com" && order.email.includes("@")) {
          await fetch(getApiUrl("/api/delivery/notify/order-placed"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              email: order.email,
              customerName: order.customerName,
              verificationCode: order.verificationCode || "",
              totalPrice: order.totalPrice,
              items: order.items || [],
              address: order.address,
              phone: order.phone || "",
              paymentStatus: "paid"
            })
          }).then(res => {
            if (res.ok) {
              alert(`Order marked as PAID! Confirmation email successfully dispatched to ${order.customerName}.`);
            } else {
              alert(`Order marked as PAID! (Note: Confirmation email dispatch returned status ${res.status})`);
            }
          }).catch(err => {
            console.error("Could not dispatch confirmation email:", err);
            alert(`Order marked as PAID! (Note: Could not dispatch confirmation email: ${err.message})`);
          });
        } else {
          alert("Order marked as PAID! (No customer email found or guest account used)");
        }
      } else {
        alert(`Order status updated to "${newPaymentStatus}" successfully.`);
      }
    } catch (e: any) {
      console.error("WhatsApp status shift failed:", e);
      alert(`Could not update WhatsApp status: ${e.message}`);
    }
  };

  const handleVerifyOpayOrder = async (orderId: string) => {
    setIsVerifyingOpayId(orderId);
    try {
      const response = await fetch(getApiUrl("/api/opay/verify-payment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: orderId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Verification Success: Status is now "${data.paymentStatus || "paid"}"!`);
      } else {
        alert(`Verification Failed: ${data.error || "Please verify manually."}`);
      }
    } catch (err: any) {
      console.error("OPay order verification fail:", err);
      alert(`Network error verifying OPay payment: ${err.message || err}`);
    } finally {
      setIsVerifyingOpayId(null);
    }
  };

  // Handle deleting order (and automatically setting its status to Cancelled first)
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you absolutely sure you want to cancel and delete this order? This action is permanent and cannot be undone.")) {
      return;
    }
    try {
      const orderRef = doc(db, "orders", orderId);
      // Automatically cancel it before deleting
      await updateDoc(orderRef, {
        status: "Cancelled",
        orderStatus: "Cancelled",
        paymentStatus: "cancelled",
        updatedAt: new Date().toISOString()
      });
      // Perform the deletion
      await deleteDoc(orderRef);
      alert("Order was successfully cancelled and deleted permanently from the system.");
    } catch (e: any) {
      console.error("Order cancel & delete operation failed:", e);
      alert(`Could not delete order: ${e.message}`);
    }
  };

  // Handler to dispatch custom email to the customer
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailModalOrder || !emailSubject.trim() || !emailMessage.trim()) return;

    setIsSendingEmail(true);
    setEmailSuccessMessage("");
    setEmailErrorMessage("");

    try {
      const response = await fetch(getApiUrl("/api/delivery/notify/custom-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailModalOrder.email,
          customerName: emailModalOrder.customerName,
          subject: emailSubject,
          message: emailMessage,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setEmailSuccessMessage(data.message || "Email dispatched successfully!");
        setTimeout(() => {
          setEmailModalOrder(null);
        }, 1500);
      } else {
        setEmailErrorMessage(data.error || "Failed to send email. Check SMTP/Resend API configuration.");
      }
    } catch (err: any) {
      console.error("Error dispatching custom email:", err);
      setEmailErrorMessage(err.message || "Failed to communicate with notification API.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Handle deleting of menu items (only allowed to admin)
  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${item.name}" from the menu?`)) return;
    try {
      if (isMySQLActive) {
        const res = await fetch(getApiUrl(`/api/mysql/menus/${item.id}`), {
          method: "DELETE"
        });
        if (!res.ok) throw new Error("Unable to delete menu item from MySQL database.");
      } else {
        const isNativeStatic = MENU_ITEMS.some(s => s.id === item.id);
        if (isNativeStatic) {
          // To delete a static preset, write a document to Firestore under the exact same ID with deleted = true
          await setDoc(doc(db, "menus", item.id), {
            id: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            image: item.image,
            deleted: true,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Dynamic items are completely deleted or marked deleted in Firestore
          await deleteDoc(doc(db, "menus", item.id));
        }
      }
      setMenuFormSuccess(`"${item.name}" was successfully deleted from the database.`);
      if (editingItemId === item.id) {
        setEditingItemId(null);
        setNewMenuData({
          id: "",
          name: "",
          description: "",
          price: "",
          category: "starters",
          image: PRESET_IMAGES[0].url,
          tags: "Chef's Special, Spicy",
          specs: "Contains premium native spices",
          available: true
        });
      }
    } catch (e: any) {
      console.error("Menu item deletion failure:", e);
      alert(`Failed to delete menu item: ${e.message}`);
    }
  };

  // Handle uploading and auto-optimizing an image directly for the create/edit menu form
  const handleMenuFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMenuFormError("");
    setMenuFormSuccess("");
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Downscale the image to fit within 600px bounds so it remains exceptionally lightweight but ultra-crisp
          const maxDim = 600;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to highly optimized JPEG so it is perfectly lightweight for Firestore document limits
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.70);
            setNewMenuData(prev => ({ ...prev, image: compressedBase64 }));
            setMenuFormSuccess("Menu image successfully processed and optimized for database storage!");
          } else {
            setNewMenuData(prev => ({ ...prev, image: reader.result as string }));
            setMenuFormSuccess("Menu image successfully read into memory.");
          }
        };
        img.onerror = () => {
          setMenuFormError("Unsupported or corrupted local image format.");
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        setMenuFormError("Failure reading local file.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle creating or updating customized menu item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMenuFormError("");
    setMenuFormSuccess("");

    if (!newMenuData.id.trim() || !newMenuData.name.trim() || !newMenuData.price.trim() || !newMenuData.image.trim()) {
      setMenuFormError("Id, Name, Price NGN, and Cover Image fields are strictly requested.");
      return;
    }

    const priceNum = parseFloat(newMenuData.price.trim());
    if (isNaN(priceNum) || priceNum <= 0) {
      setMenuFormError("Please state a legitimate positive price value.");
      return;
    }

    try {
      const parsedId = newMenuData.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!parsedId) {
        setMenuFormError("Menu Slug Id must contain valid small case alpha-numeric characters only.");
        return;
      }

      const itemPayload = {
        id: parsedId,
        name: newMenuData.name.trim(),
        description: newMenuData.description.trim(),
        price: priceNum,
        category: newMenuData.category,
        image: newMenuData.image.trim(),
        tags: newMenuData.tags ? newMenuData.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        specs: newMenuData.specs ? newMenuData.specs.split(",").map(s => s.trim()).filter(Boolean) : [],
        available: newMenuData.available,
        updatedAt: new Date().toISOString()
      };

      if (isMySQLActive) {
        const res = await fetch(getApiUrl("/api/mysql/menus"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload)
        });
        if (!res.ok) {
          throw new Error("Unable to save menu item inside MySQL Database.");
        }
      } else {
        await setDoc(doc(db, "menus", parsedId), itemPayload);
      }
      
      if (editingItemId) {
        setMenuFormSuccess(`Magnificent! "${itemPayload.name}" was successfully saved and updated in real-time.`);
        setEditingItemId(null);
      } else {
        setMenuFormSuccess(`Magnificent! "${itemPayload.name}" successfully created and auto-updated across the live store.`);
      }

      // Clear forms
      setNewMenuData({
        id: "",
        name: "",
        description: "",
        price: "",
        category: "starters",
        image: PRESET_IMAGES[0].url,
        tags: "Chef's Special, Spicy",
        specs: "Contains premium native spices",
        available: true
      });
    } catch (err: any) {
      console.error("Menu save error:", err);
      setMenuFormError(`Failed to save menu item to database: ${err.message}`);
    }
  };

  // Get favorited menu items
  const favoritedItems = finalMenuItems.filter(it => favorites.includes(it.id));

  // Determine user's favorite category from wishlist
  const getFavCategory = () => {
    if (favoritedItems.length === 0) return "N/A";
    const counts: Record<string, number> = {};
    favoritedItems.forEach(it => {
      counts[it.category] = (counts[it.category] || 0) + 1;
    });
    let maxCat = "";
    let maxVal = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    });
    return maxCat.toUpperCase();
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let val: string | undefined = undefined;
    if (item.category === "grills") val = "Medium Well Done";
    if (item.category === "breakfast") val = "Scrambled Eggs";
    if (item.category === "coffee") val = "Whole Milk";
    
    onAddToCart(item, val, [], "Added from Wishlist");
  };

  // Filtration logic for directory users
  const filteredUsers = allUsers.filter(usr => {
    if (!userSearchText.trim()) return true;
    const s = userSearchText.toLowerCase();
    return (usr.email || "").toLowerCase().includes(s) || 
           (usr.displayName || "").toLowerCase().includes(s) ||
           (usr.role || "").toLowerCase().includes(s);
  });

  // Filtration logic for global orders pipeline
  const filteredOrders = allOrders.filter(ord => {
    const isOpay = ord.paymentMethod === "opay" || ord.paymentMethod === "OPay" || ord.type === "opay" || (!ord.paymentMethod && ord.id?.startsWith("order_"));
    const isWhatsapp = ord.paymentMethod === "whatsapp" || ord.type === "whatsapp";

    // Channel filter
    if (pipelineChannelFilter === "opay" && !isOpay) return false;
    if (pipelineChannelFilter === "whatsapp" && !isWhatsapp) return false;

    // Stage check (only if we're not filtering "all" preparation statuses)
    let currentStatus = ord.status || "Prepping";
    if (currentStatus === "paid" || currentStatus === "pending") {
      currentStatus = "Prepping";
    }
    if (selectedOrderTab !== "all" && currentStatus !== selectedOrderTab) return false;
    
    // Search check
    if (!ordersSearchText.trim()) return true;
    const s = ordersSearchText.toLowerCase();
    return (ord.customerName || "").toLowerCase().includes(s) ||
           (ord.id || "").toLowerCase().includes(s) ||
           (ord.email || "").toLowerCase().includes(s) ||
           (ord.phone || "").toLowerCase().includes(s) ||
           (ord.address || "").toLowerCase().includes(s);
  });

  return (
    <div className="bg-white min-h-screen text-neutral-900 pb-24" id="dedicated-dashboard-spa">
      {/* Visual Ambient Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-neutral-900 border-b border-neutral-200">
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-black/60 z-10" />
        
        {/* Decorative image */}
        <img 
          src={gourmetDrinks} 
          alt="Dining banner background" 
          className="w-full h-full object-cover scale-105 filter blur-xs"
        />

        {/* Back Link Overlay */}
        <div className="absolute top-10 left-[5%] lg:left-[10%] z-20">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/85 border border-amber-500/50 hover:border-amber-500/50 text-amber-500 hover:text-amber-500 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            id="dashboard-back-lobby-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Menu</span>
          </button>
        </div>

        {/* User Identity Overlay */}
        <div className="absolute bottom-6 left-[5%] lg:left-[10%] z-20 text-left">
          {currentUser && (
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.3em] text-amber-600 font-mono font-bold uppercase block">
                {userRole.toUpperCase()} OPERATIONS PORTAL
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold font-mono text-neutral-950 tracking-wide uppercase">
                Welcome back, {currentUser.displayName || currentUser.email?.split("@")[0] || "Staff Member"}
              </h1>
              <p className="text-xs text-neutral-800 font-mono">
                {userRole === "admin" && "Total system clearance. You can manage user roles and add menu options dynamically."}
                {userRole === "sales" && "Review user orders, transition cook pipelines, and handle client dispatch stages."}
                {userRole === "chef" && "Elite kitchen monitor tracker. Review and update cooking preparations."}
                {userRole === "user" && "Manage your historical orders, active deliveries, and saved items in Lagos."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-none px-[5%] lg:px-[10%] mt-8 space-y-8">
        {currentUser ? (
          <>
            {/* Standard Account KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="account-metrics-dashboard-grid">
              
              {/* Metric 1 */}
              <div className="bg-neutral-55 border border-neutral-200 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-300">
                  <UserIcon className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Profile Clearance</span>
                <span className="text-sm font-bold font-mono text-amber-600 uppercase mt-4 block">{userRole}</span>
                <span className="text-[9px] font-mono text-neutral-500 mt-1 block">Account authority level</span>
              </div>

              {/* Metric 2 */}
              <div className="bg-neutral-55 border border-neutral-200 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Wishlist Bookmarks</span>
                <span className="text-2xl font-black font-mono text-neutral-900 mt-4 block">{favorites.length} <span className="text-xs font-normal text-neutral-500">ITEM(S)</span></span>
                <span className="text-[9px] font-mono text-neutral-500 mt-1 block">Custom personal choices</span>
              </div>

              {/* Metric 3 */}
              <div className="bg-neutral-55 border border-neutral-200 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-300">
                  <Utensils className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Preferred Taste</span>
                <span className="text-sm font-bold font-mono text-amber-600 uppercase truncate mt-4 block">{getFavCategory()}</span>
                <span className="text-[9px] font-mono text-neutral-500 mt-1 block">Most wishlisted category</span>
              </div>

              {/* Metric 4 */}
              <div className="bg-neutral-55 border border-neutral-200 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-300">
                  <Compass className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Database Network</span>
                <span className="text-xs font-bold font-mono text-emerald-600 uppercase mt-4 block">Connected Live</span>
                <span className="text-[9px] font-mono text-neutral-500 mt-1 block">Zero delay client syncs</span>
              </div>
            </div>

            {/* Core Workspace double-column containing dynamic tabs based on clearance levels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Dynamic Interactive Panel Workspace */}
              <div className="lg:col-span-12 space-y-6">
                
                {/* Visual Premium Unified Tab Switcher Navigation */}
                <div className="flex flex-wrap gap-1 border-b border-neutral-200 bg-neutral-150 p-1 font-mono">
                  {/* Standard Tabs */}
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "history"
                        ? "bg-amber-600 text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    📜 My Orders ({userRole === "user" ? "Client" : "Personal"})
                  </button>
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "wishlist"
                        ? "bg-amber-600 text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    💖 Wishlist ({favorites.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("tracker")}
                    className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "tracker"
                        ? "bg-amber-600 text-white"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    🚚 Order Tracker
                  </button>

                  {/* Privileged pipeline (Sales, Chef, Admin) */}
                  {(userRole === "admin" || userRole === "sales" || userRole === "chef") && (
                    <>
                      <button
                        onClick={() => setActiveTab("orders_pipeline")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "orders_pipeline"
                            ? "bg-amber-600 text-white border-l-2 border-amber-400"
                            : "text-amber-600 hover:text-amber-500 hover:bg-amber-100"
                        }`}
                      >
                        🛍️ Orders Pipeline ({allOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("whatsapp_orders")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "whatsapp_orders"
                            ? "bg-amber-600 text-white border-l-2 border-amber-400"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        💬 WhatsApp Orders ({allOrders.filter(o => o.paymentMethod === "whatsapp" || o.type === "whatsapp").length})
                      </button>
                    </>
                  )}

                  {/* Admin-only user directory */}
                  {userRole === "admin" && (
                    <button
                      onClick={() => setActiveTab("users_panel")}
                      className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "users_panel"
                          ? "bg-amber-600 text-white"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                      }`}
                    >
                      👥 User Directory ({allUsers.length})
                    </button>
                  )}

                  {/* Admin or Menu Lister menu managers */}
                  {(userRole === "admin" || userRole === "menu_lister") && (
                    <>
                      <button
                        onClick={() => setActiveTab("menus_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "menus_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        🍜 Dynamic Menu Manager
                      </button>
                      <button
                        onClick={() => setActiveTab("categories_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "categories_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        📂 Category Manager
                      </button>
                      <button
                        onClick={() => setActiveTab("images_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "images_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                      }`}
                    >
                      🖼️ Image Library ({customImages.length + PRESET_IMAGES.length})
                    </button>
                    </>
                  )}

                  {/* Admin or Developer system panels */}
                  {(userRole === "admin" || userRole === "developer") && (
                    <>
                      <button
                        onClick={() => setActiveTab("instagram_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "instagram_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        📸 Instagram Integration
                      </button>
                      <button
                        onClick={() => setActiveTab("opay_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "opay_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        💳 OPay Gateway Settings
                      </button>
                    </>
                  )}

                  {/* Admin or Developer MySQL console */}
                  {(userRole === "admin" || userRole === "developer") && (
                    <button
                      onClick={() => setActiveTab("mysql_panel")}
                      className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "mysql_panel"
                          ? "bg-amber-600 text-white"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                      }`}
                    >
                      🗄️ MySQL Database Console
                    </button>
                  )}

                  {/* Admin-only shipping & riders */}
                  {userRole === "admin" && (
                    <>
                      <button
                        onClick={() => setActiveTab("shipping_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "shipping_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                        id="tab-btn-shipping-manager"
                      >
                        🚚 Delivery Locations
                      </button>
                      <button
                        onClick={() => setActiveTab("riders_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "riders_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        🚴 Logistics & Riders
                      </button>
                    </>
                  )}

                  {/* Admin or Sales Panels */}
                  {(userRole === "admin" || userRole === "sales") && (
                    <>
                      <button
                        onClick={() => setActiveTab("analytics_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "analytics_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        📊 Analytics & Conversions
                      </button>
                      <button
                        onClick={() => setActiveTab("support_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "support_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        🎧 Support Desk Chats
                      </button>
                    </>
                  )}
                </div>

                {/* TAB 1: USER ORDER HISTORY */}
                {activeTab === "history" && (
                  <div className="bg-white border border-neutral-200 p-6 space-y-4" id="dashboard-history-tab">
                    <OrderHistory 
                      onTrackClick={(order) => {
                        setTrackedOrderId(order.id);
                        localStorage.setItem("upside_active_order", JSON.stringify(order));
                        setActiveTab("tracker");
                        if (onTrackOrder) {
                          onTrackOrder(order);
                        }
                      }}
                      onReorderClick={onReorder}
                    />
                  </div>
                )}

                {/* TAB 1.5: REALTIME ORDER TRACKER */}
                {activeTab === "tracker" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-4" id="dashboard-tracker-tab">
                    <OrderTracker 
                      orderId={trackedOrderId}
                      userRole={userRole}
                    />
                  </div>
                )}

                {/* TAB 2: WISHLIST BOOKMARKS */}
                {activeTab === "wishlist" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="dashboard-wishlist-tab">
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">
                        💖 Saved Favorited Dishes
                      </span>
                      <span className="text-[8px] font-mono text-neutral-500 uppercase">
                        Quickly add items to cart
                      </span>
                    </div>

                    {favoritedItems.length === 0 ? (
                      <div className="text-center py-16 space-y-4">
                        <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
                          <Heart className="w-5 h-5 text-neutral-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">Wishlist is empty</p>
                          <p className="text-[10px] text-neutral-600 font-sans max-w-[240px] mx-auto leading-relaxed">
                            Click hearts on any menu screen to save your preferred choices.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="dashboard-wishlist-interior-grid">
                        {favoritedItems.map((item) => (
                          <div 
                            key={item.id}
                            className="bg-[#181818] border border-neutral-800 p-4 flex gap-4 hover:border-neutral-700 transition-all font-mono"
                          >
                            <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 shrink-0 overflow-hidden relative">
                              <MenuImage 
                                src={item.image} 
                                name={item.name} 
                                className="w-full h-full object-cover"
                                containerClassName="w-full h-full"
                                size="sm"
                              />
                            </div>
                            <div className="flex-grow flex flex-col justify-between text-left">
                              <div>
                                <h4 className="text-xs font-bold text-white tracking-wide uppercase line-clamp-1">{item.name}</h4>
                                <span className="text-[10px] text-amber-500 font-bold block mt-0.5">₦{item.price.toLocaleString()}</span>
                                <span className="text-[8.5px] text-neutral-500 block capitalize">{item.category}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={(e) => handleQuickAdd(item, e)}
                                  className="flex-grow py-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-[8px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  title="Add to cart"
                                >
                                  <ShoppingBag className="w-3" />
                                  <span>ADD TO CART</span>
                                </button>
                                <button
                                  onClick={() => onToggleFavorite(item.id)}
                                  className="px-2 py-1 bg-[#121212] hover:bg-neutral-800 border border-neutral-800 text-rose-500 hover:text-neutral-400 transition-colors cursor-pointer"
                                  title="Remove from favorites"
                                >
                                  <Heart className="w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: ORDER PIPELINE MONITOR (Sales/Chef/Admin) */}
                {isPrivileged && activeTab === "orders_pipeline" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="dashboard-pipeline-tab">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                          <span>🛍️ Global Orders Pipeline</span>
                          <span className="px-2 py-0.5 bg-neutral-800 text-[9px] text-neutral-400 tracking-normal rounded-none font-normal">Staff Action Only</span>
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Filter, search, and update client order preparation logistics in Lagos.</p>
                      </div>

                      {/* Status quick tags bar */}
                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                        {["all", "Prepping", "In Oven", "Awaiting Pickup", "Out for Delivery", "Delivered"].map((st) => (
                          <button
                            key={st}
                            onClick={() => setSelectedOrderTab(st)}
                            className={`px-3 py-1.5 border transition-all cursor-pointer ${
                              selectedOrderTab === st
                                ? "bg-amber-600 text-white border-transparent font-bold"
                                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                            }`}
                          >
                            {st === "all" ? "SHOW ALL" : st.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Channel selection sub-tabs inside Orders Pipeline */}
                    <div className="flex border-b border-neutral-800 font-mono text-[10px]">
                      {[
                        { id: "all", label: "🌐 All Channels", count: allOrders.length },
                        { id: "opay", label: "💳 OPay Checkout", count: allOrders.filter(o => o.paymentMethod === "opay" || o.paymentMethod === "OPay" || o.type === "opay" || (!o.paymentMethod && o.id?.startsWith("order_"))).length },
                        { id: "whatsapp", label: "💬 WhatsApp Checkout", count: allOrders.filter(o => o.paymentMethod === "whatsapp" || o.type === "whatsapp").length }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setPipelineChannelFilter(tab.id)}
                          className={`px-4 py-2.5 font-bold uppercase border-b-2 tracking-wider transition-all cursor-pointer ${
                            pipelineChannelFilter === tab.id
                              ? "border-amber-500 text-amber-500 bg-amber-500/5 font-extrabold"
                              : "border-transparent text-neutral-400 hover:text-white"
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>

                    {/* Channel-specific functional dashboards */}
                    {pipelineChannelFilter === "opay" && (
                      <div className="bg-gradient-to-r from-[#ff6b00]/10 to-transparent border border-[#ff6b00]/20 p-4 font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] text-[#ff6b00] font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>💳</span> OPay Automated Clearing House & Verification Terminal
                          </h3>
                          <span className="text-[8px] bg-[#ff6b00]/25 text-[#ff6b00] border border-[#ff6b00]/30 px-2 py-0.5 uppercase font-bold animate-pulse">
                            Live Sync Active
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                          Verify user payments against the OPay central transaction ledger instantly. Unpaid or pending checkouts can be queried manually to confirm status hooks, or force-marked as paid.
                        </p>
                        <div className="flex flex-wrap gap-4 text-[9.5px] text-neutral-500 font-mono pt-1">
                          <span>Total OPay Records: <strong className="text-white">{allOrders.filter(o => o.paymentMethod === "opay" || o.paymentMethod === "OPay" || o.type === "opay" || (!o.paymentMethod && o.id?.startsWith("order_"))).length}</strong></span>
                          <span>•</span>
                          <span>Successful: <strong className="text-emerald-400">{allOrders.filter(o => (o.paymentMethod === "opay" || o.paymentMethod === "OPay" || o.type === "opay" || (!o.paymentMethod && o.id?.startsWith("order_"))) && ["paid", "success", "payment_successful"].includes((o.paymentStatus || "").toLowerCase())).length}</strong></span>
                          <span>•</span>
                          <span>Pending / Unpaid: <strong className="text-amber-500">{allOrders.filter(o => (o.paymentMethod === "opay" || o.paymentMethod === "OPay" || o.type === "opay" || (!o.paymentMethod && o.id?.startsWith("order_"))) && !["paid", "success", "payment_successful"].includes((o.paymentStatus || "").toLowerCase())).length}</strong></span>
                        </div>
                      </div>
                    )}

                    {pipelineChannelFilter === "whatsapp" && (
                      <div className="bg-gradient-to-r from-emerald-600/10 to-transparent border border-emerald-500/20 p-4 font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[11px] text-emerald-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>💬</span> WhatsApp Direct Order & Billing Console
                          </h3>
                          <span className="text-[8px] bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 uppercase font-bold">
                            Manual Settlement
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                          Review offline manual checkout receipts placed by clients in Lagos. Coordinate deliveries, initiate customer chat, update billing statuses manually, and trigger chef cooking queues once cash or bank transfer is confirmed.
                        </p>
                        <div className="flex flex-wrap gap-4 text-[9.5px] text-neutral-500 font-mono pt-1">
                          <span>WhatsApp Orders: <strong className="text-white">{allOrders.filter(o => o.paymentMethod === "whatsapp" || o.type === "whatsapp").length}</strong></span>
                          <span>•</span>
                          <span>Paid: <strong className="text-emerald-400">{allOrders.filter(o => (o.paymentMethod === "whatsapp" || o.type === "whatsapp") && ["paid", "success", "payment_successful"].includes((o.paymentStatus || "").toLowerCase())).length}</strong></span>
                          <span>•</span>
                          <span>Waiting Payment: <strong className="text-amber-500">{allOrders.filter(o => (o.paymentMethod === "whatsapp" || o.type === "whatsapp") && !["paid", "success", "payment_successful"].includes((o.paymentStatus || "").toLowerCase())).length}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* Awaiting Pickup Notifications Alert */}
                    {(() => {
                      const awaitingPickupOrders = allOrders.filter(o => o.status === "Awaiting Pickup");
                      if (awaitingPickupOrders.length === 0) return null;
                      return (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 font-mono rounded animate-pulse flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">🔔</span>
                            <div>
                              <p className="text-xs font-bold text-amber-500 uppercase tracking-wide">Orders Ready for Pickup</p>
                              <p className="text-[10px] text-neutral-300 font-sans mt-0.5">
                                {awaitingPickupOrders.length} {awaitingPickupOrders.length === 1 ? "order is" : "orders are"} currently ready and waiting at the kitchen. Change status to "Out for Delivery" once collected by couriers.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {awaitingPickupOrders.slice(0, 3).map((o, idx) => (
                              <span key={o.id} className="text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono uppercase">
                                #{o.id?.slice(-5).toUpperCase()}
                              </span>
                            ))}
                            {awaitingPickupOrders.length > 3 && (
                              <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                                +{awaitingPickupOrders.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Search Field */}
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input
                        type="text"
                        placeholder="Search by ID, client name, phone number, or delivery address..."
                        value={ordersSearchText}
                        onChange={(e) => setOrdersSearchText(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-850 p-2.5 pl-10 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-16 space-y-2 border border-dashed border-neutral-800 font-mono">
                        <Package className="w-8 h-8 mx-auto text-neutral-700" />
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">No matching orders found</p>
                        <p className="text-[9px] text-neutral-600 max-w-xs mx-auto">There are no orders resting in this queue at the moment.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5" id="pipeline-orders-list-node">
                        {filteredOrders.map((ord) => {
                          const formattedDate = new Date(ord.timestamp).toLocaleString("en-NG", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          });

                          let ordStatus = ord.status || "Prepping";
                          if (ordStatus === "paid" || ordStatus === "pending") {
                            ordStatus = "Prepping";
                          }

                          return (
                            <div 
                              key={ord.id} 
                              className="bg-[#181818] border border-neutral-800 p-4 md:p-5 flex flex-col lg:flex-row justify-between gap-5 font-mono text-left hover:border-neutral-750 transition-all"
                            >
                              <div className="space-y-4 flex-grow">
                                {/* Top bar */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-white tracking-widest">
                                    #{ord.id.slice(-6).toUpperCase()}
                                  </span>
                                  <span className="text-[9px] text-neutral-500 font-mono">
                                    {formattedDate}
                                  </span>
                                  <span className="px-2 py-0.5 bg-neutral-900 text-amber-500 font-mono text-[9px] uppercase tracking-wider font-extrabold border border-neutral-800">
                                    {ordStatus.toUpperCase()}
                                  </span>

                                  {/* Channel and payment indicators */}
                                  {(() => {
                                    const isOpay = ord.paymentMethod === "opay" || ord.paymentMethod === "OPay" || ord.type === "opay" || (!ord.paymentMethod && ord.id?.startsWith("order_"));
                                    const isWhatsapp = ord.paymentMethod === "whatsapp" || ord.type === "whatsapp";
                                    const payStatus = (ord.paymentStatus || "").toLowerCase();
                                    const isPaid = ["paid", "success", "payment_successful"].includes(payStatus);

                                    return (
                                      <>
                                        {isOpay ? (
                                          <span className="px-2 py-0.5 bg-neutral-900 text-[#ff6b00] font-mono text-[9px] uppercase tracking-wider font-extrabold border border-[#ff6b00]/30 flex items-center gap-1">
                                            <span>💳</span> OPay Order
                                          </span>
                                        ) : isWhatsapp ? (
                                          <span className="px-2 py-0.5 bg-neutral-900 text-emerald-500 font-mono text-[9px] uppercase tracking-wider font-extrabold border border-emerald-500/30 flex items-center gap-1">
                                            <span>💬</span> WhatsApp Order
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 font-mono text-[9px] uppercase tracking-wider font-extrabold border border-neutral-800">
                                            {ord.type?.toUpperCase()}
                                          </span>
                                        )}

                                        {isPaid ? (
                                          <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 font-mono text-[8.5px] uppercase tracking-wider font-black border border-emerald-500/35">
                                            ✓ PAID
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-amber-950/40 text-amber-500 font-mono text-[8.5px] uppercase tracking-wider font-black border border-amber-500/35 animate-pulse">
                                            ⏳ UNPAID / AWAITING PAYMENT
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>

                                {/* Main client Info grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] bg-neutral-950/40 p-3 border border-neutral-850">
                                  <div>
                                    <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Client</p>
                                    <p className="text-neutral-200 mt-0.5">{ord.customerName}</p>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">{ord.email}</p>
                                    <p className="text-[9px] text-neutral-400">{ord.phone}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Fulfillment Method</p>
                                    <p className="text-neutral-200 mt-0.5 line-clamp-2">{ord.address}</p>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 p-2 text-center flex flex-col justify-center">
                                    <p className="text-[7.5px] text-amber-500 uppercase tracking-widest font-bold">Verification Key</p>
                                    <span className="text-xs font-black text-amber-400 mt-1 block select-all font-mono tracking-widest">{ord.verificationCode || "N/A"}</span>
                                  </div>
                                </div>

                                {/* Items summary */}
                                <div className="space-y-1">
                                  <p className="text-[8.5px] text-neutral-500 uppercase tracking-widest font-bold">Ordered Dishes</p>
                                  <div className="space-y-1 text-[10px]">
                                    {(() => {
                                      const items = ord.items;
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
                                      return itemsArray.map((it: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center bg-black/30 px-2 py-1 select-text">
                                          <span className="text-neutral-300">
                                            {(it?.quantity || 1)}x <span className="font-sans text-white">{it?.name || "Menu Item"}</span>
                                          </span>
                                          <span className="text-neutral-400">₦{((it?.price || 5000) * (it?.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>

                                {/* Rider assignment panel of the dispatch section (Oven Section) */}
                                {userRole === "admin" && (
                                  <div className="bg-neutral-900/60 p-3.5 border border-neutral-800 space-y-2 mt-4 text-left">
                                    <div className="flex justify-between items-center flex-wrap gap-2">
                                      <span className="text-[9px] text-amber-500 uppercase tracking-widest font-bold">
                                        🚴 Rider Allocation (Oven section)
                                      </span>
                                      {ord.assignedRiderName ? (
                                        <span className="text-[9px] text-[#22c55e] font-extrabold uppercase bg-emerald-950/20 border border-emerald-950/30 px-2 py-0.5">
                                          ✓ Dispatched: {ord.assignedRiderName}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-neutral-500 font-extrabold uppercase bg-neutral-950 px-2 py-0.5 border border-neutral-850">
                                          Awaiting allocation...
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <select
                                        className="flex-grow bg-black border border-neutral-800 text-[11px] text-[#cccccc] p-2 focus:outline-none focus:border-amber-500 cursor-pointer"
                                        value={ord.assignedRiderId || ""}
                                        onChange={async (e) => {
                                          const val = e.target.value;
                                          if (val === "") {
                                            // Reset rider assignment
                                            try {
                                              const res = await fetch("/api/delivery/orders/assign", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  orderId: ord.id,
                                                  riderId: null,
                                                  riderName: null,
                                                  riderPhone: null
                                                })
                                              });
                                              const data = await res.json();
                                              if (!data.success) {
                                                alert(`Error: ${data.error}`);
                                              }
                                            } catch (err) {
                                              console.error("Nullifying rider failed:", err);
                                            }
                                            return;
                                          }
                                          const chosen = ridersList.find(r => r.id === val);
                                          if (chosen) {
                                            try {
                                              const res = await fetch("/api/delivery/orders/assign", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                  orderId: ord.id,
                                                  riderId: chosen.id,
                                                  riderName: chosen.fullName,
                                                  riderPhone: chosen.phoneNumber || chosen.phone || "N/A"
                                                })
                                              });
                                              const data = await res.json();
                                              if (!data.success) {
                                                alert(`Error: ${data.error}`);
                                              }
                                            } catch (err) {
                                              console.error("Assigning rider failed:", err);
                                            }
                                          }
                                        }}
                                      >
                                        <option value="">-- Click to assign courier --</option>
                                        {ridersList.map((ri: any) => (
                                          <option key={ri.id} value={ri.id}>
                                            {ri.fullName} ({ri.phoneNumber || ri.phone || "No phone"}) {ri.active === false ? "[Deactivated]" : ""}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Progress modification panel (sales) */}
                              <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-neutral-800 pt-4 lg:pt-0 lg:pl-5 flex flex-col justify-between items-stretch gap-3">
                                <div className="text-center lg:text-right">
                                  <p className="text-[8.5px] text-neutral-500 uppercase tracking-widest font-bold">Total billing</p>
                                  <p className="text-lg font-bold font-mono text-amber-500 mt-0.5">₦{ord.totalPrice.toLocaleString()}</p>
                                </div>

                                <div className="space-y-1.5 mt-auto">
                                  <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold lg:text-right">Shift Progress</p>
                                  
                                  {/* Multi Action buttons for fast logistic clicks */}
                                  <div className="flex flex-col gap-1 text-[9px] uppercase font-bold tracking-wider">
                                    {/* 1. Prepping */}
                                    <button
                                      disabled={
                                        ordStatus === "Prepping" || 
                                        !(userRole === "admin" || userRole === "chef")
                                      }
                                      onClick={() => handleSetOrderStatus(ord.id, "Prepping")}
                                      className={`py-1.5 px-2.5 text-center border transition-all cursor-pointer ${
                                        ordStatus === "Prepping" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : (userRole === "admin" || userRole === "chef")
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                            : "bg-neutral-950 border-neutral-900/40 text-neutral-600 cursor-not-allowed"
                                      }`}
                                      title={!(userRole === "admin" || userRole === "chef") ? "Kitchen privilege required" : "Mark as Prepping"}
                                    >
                                      Prepping
                                    </button>

                                    {/* 2. In Oven */}
                                    <button
                                      disabled={
                                        ordStatus === "In Oven" || 
                                        !(userRole === "admin" || userRole === "chef")
                                      }
                                      onClick={() => handleSetOrderStatus(ord.id, "In Oven")}
                                      className={`py-1.5 px-2.5 text-center border transition-all cursor-pointer ${
                                        ordStatus === "In Oven" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : (userRole === "admin" || userRole === "chef")
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                            : "bg-neutral-950 border-neutral-900/40 text-neutral-600 cursor-not-allowed"
                                      }`}
                                      title={!(userRole === "admin" || userRole === "chef") ? "Kitchen privilege required" : "Mark as In Oven"}
                                    >
                                      In Oven
                                    </button>

                                    {/* 3. Awaiting Pickup */}
                                    <button
                                      disabled={
                                        ordStatus === "Awaiting Pickup" || 
                                        !(userRole === "admin" || userRole === "chef")
                                      }
                                      onClick={() => handleSetOrderStatus(ord.id, "Awaiting Pickup")}
                                      className={`py-1.5 px-2.5 text-center border transition-all cursor-pointer ${
                                        ordStatus === "Awaiting Pickup" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : (userRole === "admin" || userRole === "chef")
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                            : "bg-neutral-950 border-neutral-900/40 text-neutral-600 cursor-not-allowed"
                                      }`}
                                      title={!(userRole === "admin" || userRole === "chef") ? "Kitchen privilege required" : "Mark as Awaiting Pickup"}
                                    >
                                      Awaiting Pickup 📦
                                    </button>

                                    {/* 4. Out for Delivery */}
                                    <button
                                      disabled={
                                        ordStatus === "Out for Delivery" || 
                                        (userRole === "sales" && ordStatus !== "Awaiting Pickup") ||
                                        !(userRole === "admin" || userRole === "sales")
                                      }
                                      onClick={() => handleSetOrderStatus(ord.id, "Out for Delivery")}
                                      className={`py-1.5 px-2.5 text-center border transition-all cursor-pointer ${
                                        ordStatus === "Out for Delivery" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : (userRole === "admin" || (userRole === "sales" && ordStatus === "Awaiting Pickup"))
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-amber-500"
                                            : "bg-neutral-950 border-neutral-900/40 text-neutral-600 cursor-not-allowed"
                                      }`}
                                      title={
                                        userRole === "chef" 
                                          ? "Sales privilege required" 
                                          : (userRole === "sales" && ordStatus !== "Awaiting Pickup")
                                            ? "Can only dispatch when order is Awaiting Pickup"
                                            : "Mark as Out for Delivery"
                                      }
                                    >
                                      Out for Delivery
                                    </button>

                                    {/* 5. Delivered */}
                                    <button
                                      disabled={
                                        ordStatus === "Delivered" || 
                                        !(userRole === "admin" || userRole === "sales")
                                      }
                                      onClick={() => handleSetOrderStatus(ord.id, "Delivered")}
                                      className={`py-1.5 px-2.5 text-center border transition-all cursor-pointer ${
                                        ordStatus === "Delivered" 
                                          ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/25 font-extrabold" 
                                          : (userRole === "admin" || userRole === "sales")
                                            ? "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500"
                                            : "bg-neutral-950 border-neutral-900/40 text-neutral-600 cursor-not-allowed"
                                      }`}
                                      title={!(userRole === "admin" || userRole === "sales") ? "Sales privilege required" : "Mark as Delivered"}
                                    >
                                      Delivered ✓
                                    </button>

                                    {/* Channel-Specific Verification Controls */}
                                    {(() => {
                                      const isOpay = ord.paymentMethod === "opay" || ord.paymentMethod === "OPay" || ord.type === "opay" || (!ord.paymentMethod && ord.id?.startsWith("order_"));
                                      const isWhatsapp = ord.paymentMethod === "whatsapp" || ord.type === "whatsapp";
                                      const payStatus = (ord.paymentStatus || "").toLowerCase();
                                      const isPaid = ["paid", "success", "payment_successful"].includes(payStatus);

                                      return (
                                        <>
                                          {isOpay && (
                                            <div className="bg-black/30 p-2 border border-[#ff6b00]/10 space-y-1.5 mt-1 text-left">
                                              <div className="flex justify-between items-center text-[8px] text-neutral-400 font-bold uppercase">
                                                <span>OPay Controls</span>
                                                <span className="text-neutral-500">Ref: #{ord.id?.slice(-6).toUpperCase()}</span>
                                              </div>
                                              <div className="flex flex-col gap-1.5">
                                                <div className="flex gap-1">
                                                  <button
                                                    onClick={() => handleVerifyOpayOrder(ord.id)}
                                                    disabled={isVerifyingOpayId === ord.id}
                                                    className="flex-grow py-1 px-1.5 bg-[#ff6b00]/15 hover:bg-[#ff6b00]/30 text-[#ff6b00] border border-[#ff6b00]/30 text-[9px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                                  >
                                                    {isVerifyingOpayId === ord.id ? "Checking..." : "🔍 Verify OPay"}
                                                  </button>
                                                  {!isPaid && (
                                                    <button
                                                      onClick={() => handleUpdateWhatsAppStatus(ord, "paid")}
                                                      className="py-1 px-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-[9px] font-bold uppercase transition-all cursor-pointer"
                                                      title="Manually force OPay order as Paid"
                                                    >
                                                      Force Paid
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {isWhatsapp && (
                                            <div className="bg-black/30 p-2 border border-emerald-500/10 space-y-1.5 mt-1 text-left">
                                              <div className="flex justify-between items-center text-[8px] text-neutral-400 font-bold uppercase">
                                                <span>WhatsApp Controls</span>
                                              </div>
                                              <div className="flex flex-col gap-1.5">
                                                <div className="flex gap-1.5">
                                                  <button
                                                    onClick={() => handleUpdateWhatsAppStatus(ord, "paid")}
                                                    disabled={isPaid}
                                                    className={`flex-1 py-1 px-1.5 text-[9px] font-bold uppercase transition-all cursor-pointer border ${
                                                      isPaid 
                                                        ? "bg-neutral-850 text-neutral-600 border-neutral-800 cursor-not-allowed" 
                                                        : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/40"
                                                    }`}
                                                  >
                                                    {isPaid ? "✓ Marked Paid" : "✓ Mark Paid"}
                                                  </button>
                                                  
                                                  <select
                                                    value={ord.paymentStatus || "waiting for payment"}
                                                    onChange={(e) => handleUpdateWhatsAppStatus(ord, e.target.value)}
                                                    className="bg-[#0a0908] border border-neutral-800 text-[9px] text-neutral-300 font-mono cursor-pointer focus:outline-none focus:border-amber-500 p-1"
                                                  >
                                                    <option value="waiting for payment">⏳ Waiting</option>
                                                    <option value="not paid">❌ Unpaid</option>
                                                    <option value="cancel">🚫 Cancelled</option>
                                                    <option value="paid">✔️ Paid</option>
                                                  </select>
                                                </div>
                                                
                                                {/* Customer Chat Helper */}
                                                <button
                                                  onClick={() => {
                                                    setEmailModalOrder(ord);
                                                    setEmailSubject(`Regarding your Upside Restaurant order #${ord.id.substring(6) || ord.id}`);
                                                    setEmailMessage(`Hi ${ord.customerName || "Customer"},\n\nWe are reaching out to you regarding your order #${ord.id.substring(6) || ord.id}.\n\n`);
                                                    setEmailSuccessMessage("");
                                                    setEmailErrorMessage("");
                                                  }}
                                                  className="w-full py-1 bg-neutral-900 border border-neutral-800 text-[8.5px] text-neutral-350 font-bold uppercase tracking-wider text-center block hover:text-amber-500 hover:border-amber-500 transition-colors cursor-pointer"
                                                >
                                                  📧 Email Customer
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}

                                    <div className="border-t border-neutral-800 my-1"></div>

                                    <button
                                      onClick={() => handleDeleteOrder(ord.id)}
                                      className="py-1.5 px-2.5 text-center border border-rose-500/30 text-rose-400 bg-rose-950/20 hover:bg-rose-600 hover:text-white transition-all duration-200 cursor-pointer font-bold flex items-center justify-center gap-1.5"
                                      title="Auto-cancels the order first, then deletes it permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Cancel & Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3.5: WHATSAPP ORDERS MANAGER (Sales/Chef/Admin) */}
                {isPrivileged && activeTab === "whatsapp_orders" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="dashboard-whatsapp-orders-tab">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                          <span>💬 WhatsApp Orders Pipeline</span>
                          <span className="px-2 py-0.5 bg-neutral-800 text-[9px] text-neutral-400 rounded-none tracking-normal font-normal">Privileged Dashboard</span>
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          Manage external orders placed via WhatsApp. Change statuses or mark as paid to dispatch confirmations.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          placeholder="Search WhatsApp orders..."
                          value={whatsappSearchText}
                          onChange={(e) => setWhatsappSearchText(e.target.value)}
                          className="px-3 py-1.5 bg-[#0a0908] border border-neutral-800 text-[10px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-amber-600 w-48 font-mono"
                        />
                        <div className="flex bg-[#0a0908] border border-neutral-800 p-0.5">
                          {["all", "waiting for payment", "not paid", "paid", "cancel"].map((st) => {
                            const count = allOrders.filter(
                              (o) =>
                                (o.paymentMethod === "whatsapp" || o.type === "whatsapp") &&
                                (st === "all" || (o.paymentStatus || "").toLowerCase() === st)
                            ).length;
                            return (
                              <button
                                key={st}
                                onClick={() => setWhatsappStatusFilter(st)}
                                className={`px-2 py-1 text-[9px] font-mono uppercase transition-colors cursor-pointer ${
                                  whatsappStatusFilter === st
                                    ? "bg-amber-600 text-white font-bold"
                                    : "text-neutral-400 hover:text-white"
                                }`}
                              >
                                {st} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Filtered list */}
                    {(() => {
                      const filtered = allOrders
                        .filter((o) => o.paymentMethod === "whatsapp" || o.type === "whatsapp")
                        .filter((o) => {
                          const statusMatch =
                            whatsappStatusFilter === "all" ||
                            (o.paymentStatus || "").toLowerCase() === whatsappStatusFilter;
                          const searchLower = whatsappSearchText.toLowerCase();
                          const textMatch =
                            !whatsappSearchText ||
                            (o.id || "").toLowerCase().includes(searchLower) ||
                            (o.customerName || "").toLowerCase().includes(searchLower) ||
                            (o.email || "").toLowerCase().includes(searchLower) ||
                            (o.phone || "").toLowerCase().includes(searchLower) ||
                            (o.address || "").toLowerCase().includes(searchLower);
                          return statusMatch && textMatch;
                        });

                      if (filtered.length === 0) {
                        return (
                          <div className="py-12 text-center border border-dashed border-neutral-850">
                            <span className="text-3xl block mb-2">💬</span>
                            <p className="text-xs font-mono text-neutral-500">No matching WhatsApp orders found.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filtered.map((ord) => {
                            const orderStatus = (ord.paymentStatus || "waiting for payment").toLowerCase();
                            
                            // Let's determine color theme for order card status
                            let borderCol = "border-neutral-850";
                            let statusBadge = "border-neutral-700 text-neutral-400";
                            if (orderStatus === "waiting for payment") {
                              borderCol = "border-amber-900/40 bg-amber-950/5";
                              statusBadge = "border-amber-600/40 text-amber-500 bg-amber-950/20";
                            } else if (orderStatus === "not paid") {
                              borderCol = "border-rose-950 bg-rose-950/5";
                              statusBadge = "border-rose-600/40 text-rose-500 bg-rose-950/20";
                            } else if (orderStatus === "paid") {
                              borderCol = "border-emerald-950 bg-emerald-950/5";
                              statusBadge = "border-emerald-600/40 text-emerald-500 bg-emerald-950/20";
                            } else if (orderStatus === "cancel") {
                              borderCol = "border-neutral-900 bg-neutral-950/20 opacity-60";
                              statusBadge = "border-neutral-700 text-neutral-500";
                            }

                            return (
                              <div
                                key={ord.id}
                                className={`border ${borderCol} p-5 space-y-4 font-mono flex flex-col justify-between transition-all`}
                                id={`whatsapp-order-${ord.id}`}
                              >
                                <div className="space-y-3">
                                  {/* Top Row: Info & Badges */}
                                  <div className="flex items-start justify-between gap-2 border-b border-neutral-850 pb-2">
                                    <div>
                                      <span className="text-[9px] text-neutral-500 font-mono block">
                                        {ord.timestamp ? new Date(ord.timestamp).toLocaleString() : "Unknown date"}
                                      </span>
                                      <h3 className="text-xs font-mono font-bold text-white uppercase mt-0.5 tracking-wider">
                                        ID: #{ord.id?.substring(6) || ord.id}
                                      </h3>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border rounded-none font-mono ${statusBadge}`}>
                                        {ord.paymentStatus || "Waiting for Payment"}
                                      </span>
                                      {ord.type && (
                                        <span className="text-[8px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 uppercase tracking-wider">
                                          {ord.type}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Customer Info */}
                                  <div className="text-[10px] text-neutral-300 space-y-1 bg-neutral-900/50 p-2.5 border border-neutral-850">
                                    <p className="font-sans">
                                      <strong className="font-mono text-amber-500 text-[9.5px]">👤 CUSTOMER:</strong> {ord.customerName}
                                    </p>
                                    <p className="font-sans">
                                      <strong className="font-mono text-amber-500 text-[9.5px]">📞 PHONE:</strong> {ord.phone}
                                    </p>
                                    {ord.email && ord.email !== "guest@example.com" && (
                                      <p className="font-sans">
                                        <strong className="font-mono text-amber-500 text-[9.5px]">✉️ EMAIL:</strong> {ord.email}
                                      </p>
                                    )}
                                    <p className="font-sans mt-1 text-neutral-400">
                                      <strong className="font-mono text-amber-500 text-[9.5px]">📍 ADDRESS:</strong> {ord.address}
                                    </p>
                                  </div>

                                  {/* Ordered items list */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] text-neutral-500 block uppercase font-bold tracking-wider">Items summary:</span>
                                    <div className="space-y-1 pl-1">
                                      {(ord.items || []).map((it: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center text-[10px] text-neutral-400 border-b border-neutral-900 pb-0.5">
                                          <span>• {it.name} <span className="text-neutral-500 text-[9px]">x{it.quantity}</span></span>
                                          <span className="text-neutral-300">₦{(it.price * it.quantity).toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Verification Code */}
                                  {ord.verificationCode && (
                                    <div className="flex justify-between items-center text-[9px] bg-[#0e0c0b] p-1.5 border border-neutral-850 text-neutral-400">
                                      <span>VERIFICATION CODE:</span>
                                      <span className="font-bold text-amber-500 tracking-widest">{ord.verificationCode}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Bottom Row: Price & Actions */}
                                <div className="pt-3 border-t border-neutral-850 space-y-3">
                                  <div className="flex justify-between items-end">
                                    <span className="text-[9px] text-neutral-500">GRAND TOTAL:</span>
                                    <span className="text-sm font-bold text-white">₦{ord.totalPrice?.toLocaleString()}</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => handleUpdateWhatsAppStatus(ord, "paid")}
                                      disabled={orderStatus === "paid"}
                                      className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-center cursor-pointer font-bold ${
                                        orderStatus === "paid"
                                          ? "bg-neutral-850 text-neutral-600 border border-neutral-800"
                                          : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500"
                                      }`}
                                    >
                                      {orderStatus === "paid" ? "✅ PAID (Done)" : "✔️ Mark Paid"}
                                    </button>

                                    <div className="relative group">
                                      <select
                                        value={ord.paymentStatus || "waiting for payment"}
                                        onChange={(e) => handleUpdateWhatsAppStatus(ord, e.target.value)}
                                        className="w-full px-2 py-1.5 bg-[#0a0908] border border-neutral-800 text-[10px] text-neutral-300 font-mono cursor-pointer focus:outline-none focus:border-amber-500"
                                      >
                                        <option value="waiting for payment">⏳ Waiting Payment</option>
                                        <option value="not paid">❌ Not Paid</option>
                                        <option value="cancel">🚫 Cancelled</option>
                                        <option value="paid">✔️ Paid (Mark Paid)</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* TAB 4: USER DIRECTORY ROLE ASSIGNER (Admins Only) */}
                {userRole === "admin" && activeTab === "users_panel" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="dashboard-users-tab">
                    <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                          <span>👥 Platform User Directory</span>
                          <span className="px-2 py-0.5 bg-neutral-800 text-[9px] text-neutral-400 rounded-none tracking-normal font-normal">System Admin Only</span>
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Assign, review, and adjust staff authority clearances.</p>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase font-semibold block">{allUsers.length} total users</span>
                    </div>

                    {/* Search Field */}
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                      <input
                        type="text"
                        placeholder="Search users by name, email, or role..."
                        value={userSearchText}
                        onChange={(e) => setUserSearchText(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-850 p-2.5 pl-10 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="overflow-x-auto border border-neutral-800" id="users-directory-table-node">
                      <table className="w-full text-left border-collapse font-mono text-[11px]">
                        <thead>
                          <tr className="bg-neutral-900 text-neutral-400 uppercase tracking-widest text-[9px] border-b border-neutral-800 select-none">
                            <th className="p-3.5">Full Name</th>
                            <th className="p-3.5">Email Contact</th>
                            <th className="p-3.5">Access Role</th>
                            <th className="p-3.5 text-center">Profile State / Actions</th>
                            <th className="p-3.5 text-center">Change Permission Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850 select-text">
                          {filteredUsers.map((usr) => (
                            <tr key={usr.id} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="p-3.5 font-sans font-semibold text-white">
                                {usr.displayName || "Anonymous Staff"}
                              </td>
                              <td className="p-3.5 text-neutral-300 font-mono text-xs">
                                {usr.email}
                              </td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 text-[8.5px] uppercase tracking-wider font-extrabold font-mono border ${
                                  usr.role === "admin" 
                                    ? "bg-rose-950/15 text-rose-400 border-rose-500/20" 
                                    : usr.role === "sales" 
                                    ? "bg-amber-950/20 text-text-amber-400 border-amber-500/20 text-amber-400" 
                                    : usr.role === "chef" 
                                    ? "bg-violet-950/15 text-violet-400 border-violet-500/20"
                                    : "bg-neutral-900 text-neutral-400 border-neutral-800"
                                }`}>
                                  {usr.role || "user"}
                                </span>
                              </td>
                              <td className="p-3.5 text-center flex items-center justify-center gap-2">
                                <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold border ${
                                  usr.disabled 
                                    ? "bg-red-950/35 text-red-500 border-red-500/30 font-extrabold" 
                                    : "bg-emerald-950/20 text-emerald-400 border-emerald-500/20"
                                }`}>
                                  {usr.disabled ? "🚫 Suspended" : "⚡ Active"}
                                </span>
                                <button
                                  onClick={() => handleToggleUserDisabled(usr.id, !!usr.disabled)}
                                  className={`px-2 py-1 text-[8.5px] uppercase font-bold border transition-colors cursor-pointer ${
                                    usr.disabled 
                                      ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900" 
                                      : "bg-red-950/20 text-red-400 border-red-500/20 hover:bg-red-900"
                                  }`}
                                >
                                  {usr.disabled ? "Enable" : "Suspend"}
                                </button>
                                <button
                                  onClick={() => handleDeleteUserProfile(usr.id)}
                                  className="px-2 py-1 text-[8.5px] uppercase font-bold border border-red-900/50 text-red-400 bg-red-950/15 hover:bg-red-900 hover:text-white transition-colors cursor-pointer"
                                >
                                  Delete ✕
                                </button>
                              </td>
                              <td className="p-3.5 text-center">
                                {/* Roles dropdown select */}
                                <select
                                  value={usr.role || "user"}
                                  onChange={(e) => handleSetUserRole(usr.id, e.target.value)}
                                  className="bg-neutral-950 text-amber-500 font-mono text-[10px] uppercase font-bold tracking-wider border border-neutral-800 py-1 px-3.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                                >
                                  <option value="user">User</option>
                                  <option value="chef">Chef</option>
                                  <option value="sales">Sales</option>
                                  <option value="menu_lister">Menu Lister</option>
                                  <option value="developer">Developer</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 5S: GLOBAL MENU CREATE MANAGEMENT (Admins / Menu Listers) */}
                {(userRole === "admin" || userRole === "menu_lister") && activeTab === "menus_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-menus-control-panel-grid">
                    
                    {/* Add/Edit Menu Item Form */}
                    <div className="xl:col-span-5 bg-[#121212] border border-neutral-850 p-6 space-y-4">
                      <div className="flex justify-between items-start border-b border-neutral-850 pb-2">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            {editingItemId ? `📝 Edit Menu Item: ${editingItemId}` : "🍜 Create New Menu Item"}
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            {editingItemId ? "Modify and update this menu item in real-time." : "Define a menu item from scratch. Auto-updates immediately on save."}
                          </p>
                        </div>
                        {editingItemId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(null);
                              setNewMenuData({
                                id: "",
                                name: "",
                                description: "",
                                price: "",
                                category: "starters",
                                image: PRESET_IMAGES[0].url,
                                tags: "Chef's Special, Spicy",
                                specs: "Contains premium native spices",
                                available: true
                              });
                              setMenuFormError("");
                              setMenuFormSuccess("");
                            }}
                            className="text-[9px] font-mono hover:text-red-400 text-neutral-500 border border-neutral-800 hover:border-red-900/30 px-2 py-1 transition-all cursor-pointer uppercase font-bold"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>

                      {menuFormError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono">
                          ⚠️ {menuFormError}
                        </div>
                      )}

                      {menuFormSuccess && (
                        <div className="p-3 bg-semibold bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono">
                          ✓ {menuFormSuccess}
                        </div>
                      )}

                      {/* Presets picker */}
                      <div className="space-y-1.5 bg-neutral-950/50 p-3 border border-neutral-850">
                        <label className="text-[8.5px] text-neutral-400 font-mono uppercase tracking-widest block font-bold">Fast Image presets picker</label>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
                          {combinedImages.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewMenuData(prev => ({ ...prev, image: img.url }))}
                              className={`px-2 py-1 text-[8px] font-mono uppercase border transition-all cursor-pointer ${
                                newMenuData.image === img.url
                                  ? "bg-amber-600 text-white border-transparent font-bold"
                                  : "bg-neutral-900 text-neutral-500 border-neutral-850 hover:text-white"
                              }`}
                            >
                              {img.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleSaveMenuItem} className="space-y-4 font-mono text-xs font-mono">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Item Slug ID *</label>
                            <input
                              type="text"
                              required
                              disabled={editingItemId !== null}
                              placeholder="e.g. goat-caramel"
                              value={newMenuData.id}
                              onChange={(e) => setNewMenuData(prev => ({ ...prev, id: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-900"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Category Group *</label>
                            <select
                              value={newMenuData.category}
                              onChange={(e) => setNewMenuData(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer text-xs"
                            >
                              {displayCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Food Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Nigerian Goat Meat Peppersoup"
                            value={newMenuData.name}
                            onChange={(e) => setNewMenuData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Billing Price (NGN) *</label>
                          <input
                            type="number"
                            required
                            placeholder="e.g. 15000"
                            value={newMenuData.price}
                            onChange={(e) => setNewMenuData(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Image Cover Source *</label>
                            {newMenuData.image.startsWith("data:image/") && (
                              <span className="text-[8px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Direct DB Base64 Mode</span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* File Upload Block */}
                            <div className="flex items-center justify-center border border-dashed border-neutral-800 hover:border-amber-500/50 bg-neutral-950/40 p-3 transition-all relative rounded min-h-[60px]">
                              <input
                                type="file"
                                id="menu-image-file-upload-direct"
                                accept="image/*"
                                onChange={handleMenuFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="text-center font-mono space-y-0.5 pointer-events-none">
                                <span className="text-[10px] text-amber-500 block font-bold">📂 CHOOSE LOCAL FILE</span>
                                <span className="text-[8px] text-neutral-500 block font-bold">Saves directly inside DB</span>
                              </div>
                            </div>

                            {/* URL Input Block */}
                            <div className="flex flex-col justify-center">
                              <input
                                type="text"
                                placeholder="Or type external web image URL..."
                                value={newMenuData.image.startsWith("data:image/") ? "" : newMenuData.image}
                                onChange={(e) => setNewMenuData(prev => ({ ...prev, image: e.target.value }))}
                                className="w-full bg-neutral-950 border border-neutral-850 p-3 text-white focus:outline-none focus:border-amber-500 font-mono text-[9px] rounded h-full min-h-[60px]"
                              />
                            </div>
                          </div>

                          {/* Live Dynamic Thumbnail & Diagnostic Info */}
                          {newMenuData.image && (
                            <div className="flex items-center gap-3 bg-neutral-950/70 border border-neutral-850 p-2.5 rounded-md">
                              <img
                                src={newMenuData.image}
                                alt="Dynamic preview"
                                className="w-12 h-12 object-cover border border-neutral-800 rounded-sm"
                                onError={(e) => {
                                  (e.target as any).src = classicDrinks;
                                }}
                              />
                              <div className="font-mono text-[9px] space-y-0.5 overflow-hidden flex-1">
                                <span className="text-neutral-300 block truncate font-bold">Preview: {newMenuData.name || "Unnamed Food Item"}</span>
                                <span className="text-neutral-500 block text-[8px] truncate">
                                  {newMenuData.image.startsWith("data:image/") 
                                    ? `Direct Base64 DB Format (~${Math.round(newMenuData.image.length / 1024)} KB)` 
                                    : `External Link Source: ${newMenuData.image}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Short Elegant Description</label>
                          <textarea
                            rows={3}
                            placeholder="State ingredients, flavors, textures..."
                            value={newMenuData.description}
                            onChange={(e) => setNewMenuData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Tags (Comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Signature, Spicy, Lagos Classic"
                              value={newMenuData.tags}
                              onChange={(e) => setNewMenuData(prev => ({ ...prev, tags: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Specs (Comma-separated)</label>
                            <input
                              type="text"
                              placeholder="Contains pork, Served sizzling"
                              value={newMenuData.specs}
                              onChange={(e) => setNewMenuData(prev => ({ ...prev, specs: e.target.value }))}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 p-2.5 bg-neutral-950 border border-neutral-850">
                          <input
                            type="checkbox"
                            id="menu-available-toggle"
                            checked={newMenuData.available}
                            onChange={(e) => setNewMenuData(prev => ({ ...prev, available: e.target.checked }))}
                            className="w-4 h-4 rounded border-neutral-800 text-amber-500 focus:ring-amber-500/30 accent-amber-500 cursor-pointer"
                          />
                          <label htmlFor="menu-available-toggle" className="text-[10px] text-neutral-300 uppercase tracking-wider font-mono cursor-pointer select-none">
                            Item is Available <span className="text-[9px] text-neutral-500 font-sans italic lowercase">(uncheck to hide from customer view)</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-widest uppercase transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{editingItemId ? "SAVE PRODUCT CHANGES" : "PUBLISH ITEM"}</span>
                        </button>
                      </form>
                    </div>

                    {/* Right side check current live catalogs */}
                    <div className="xl:col-span-7 bg-[#121212] border border-neutral-850 p-6 space-y-4 flex flex-col h-[740px]">
                      <div className="space-y-3">
                        <div className="border-b border-neutral-850 pb-2">
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center justify-between">
                            <span>🍜 Dynamic Active Menus Listing ({finalMenuItems.length})</span>
                            <span className="text-[8px] text-neutral-400 uppercase font-semibold font-sans bg-amber-950/20 px-2 py-0.5 border border-amber-900/10">Full EDIT & DELETE Authority</span>
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Click edit to populate parameters, or delete to instantly remove live items.</p>
                        </div>

                        {/* Search field for management panel */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
                          <input
                            type="text"
                            placeholder="Type to filter active products by name, slug, or category..."
                            value={menuSearchText}
                            onChange={(e) => setMenuSearchText(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 pl-9 text-xs font-mono placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/50 text-white"
                          />
                        </div>

                        {/* Database Seeding Quick Sync Button */}
                        <div className="bg-neutral-950/70 border border-neutral-850 p-3 rounded-md space-y-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[10px] font-mono text-amber-500 font-bold block uppercase tracking-widest">🔄 Menu Source Syncing Tool</span>
                            <span className="text-[8px] text-neutral-400 block font-sans">
                              Synchronizes all real café items and categories from project source code into your live Firestore database, replacing active products.
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={isSyncingMenu}
                            onClick={handleSyncStaticMenu}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-mono uppercase font-black text-[9px] px-3.5 py-2 transition-all rounded disabled:opacity-50 cursor-pointer text-center shrink-0"
                          >
                            {isSyncingMenu ? "🔄 Syncing Database..." : "Publish Static Menu To Live DB"}
                          </button>
                        </div>

                        {syncStatus && (
                          <div className={`p-2.5 w-full font-mono text-[9px] text-left rounded border ${
                            syncStatus.startsWith("SUCCESS:") 
                              ? "bg-emerald-950/20 border-emerald-900/30 text-emerald-400" 
                              : "bg-red-950/20 border-red-900/30 text-red-300"
                          }`}>
                            {syncStatus}
                          </div>
                        )}
                      </div>

                      {/* Scroll wrapper */}
                      <div className="space-y-2.5 overflow-y-auto flex-grow pr-1" id="admin-menus-live-scroll-node">
                        {finalMenuItems
                          .filter(item => {
                            if (!menuSearchText.trim()) return true;
                            const query = menuSearchText.toLowerCase();
                            return item.name.toLowerCase().includes(query) ||
                                   item.id.toLowerCase().includes(query) ||
                                   item.category.toLowerCase().includes(query);
                          })
                          .slice()
                          .reverse()
                          .map((item) => {
                            return (
                              <div 
                                key={item.id}
                                className={`p-3.5 border transition-all flex items-center justify-between gap-4 font-mono ${
                                  editingItemId === item.id
                                    ? "bg-amber-950/15 border-amber-500/50"
                                    : "bg-neutral-950/60 border-neutral-850/80 hover:border-neutral-750"
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-grow">
                                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                                    <MenuImage 
                                      src={item.image} 
                                      name={item.name} 
                                      className="w-full h-full object-cover"
                                      containerClassName="w-full h-full"
                                      size="sm"
                                    />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-xs font-bold text-white uppercase truncate max-w-[220px]">{item.name}</h4>
                                      <span className="text-[8px] font-mono text-neutral-500 uppercase bg-neutral-900 px-1 border border-neutral-850">
                                        {item.id}
                                      </span>
                                      {item.available === false ? (
                                        <span className="text-[7.5px] font-mono text-red-400 uppercase bg-red-950/20 px-1 border border-red-900/30">
                                          Unavailable (Hidden)
                                        </span>
                                      ) : (
                                        <span className="text-[7.5px] font-mono text-emerald-400 uppercase bg-emerald-950/20 px-1 border border-emerald-900/30">
                                          Available
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9.5px] text-neutral-500 capitalize">{item.category} • <span className="text-[9px] font-bold text-amber-500">₦{item.price.toLocaleString()}</span></p>
                                    <p className="text-[8px] text-neutral-400 font-sans line-clamp-1 max-w-[280px] mt-0.5">{item.description}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => {
                                      setEditingItemId(item.id);
                                      setNewMenuData({
                                        id: item.id,
                                        name: item.name,
                                        description: item.description || "",
                                        price: String(item.price),
                                        category: item.category,
                                        image: item.image,
                                        tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags || ""),
                                        specs: Array.isArray(item.specs) ? item.specs.join(", ") : (item.specs || ""),
                                        available: item.available !== false
                                      });
                                      setMenuFormError("");
                                      setMenuFormSuccess("");
                                    }}
                                    className="py-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-amber-500 hover:text-amber-400 border border-neutral-800 text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                                  >
                                    EDIT ✎
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMenuItem(item)}
                                    className="py-1 px-2.5 bg-red-950/25 hover:bg-red-900 text-red-400 hover:text-white border border-red-900/35 text-[8px] uppercase tracking-wider font-extrabold transition-all cursor-pointer"
                                  >
                                    DELETE ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

                {(userRole === "admin" || userRole === "menu_lister") && activeTab === "categories_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-categories-control">
                    <div className="xl:col-span-5 bg-[#121212] border border-neutral-850 p-6 space-y-4 font-mono">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                          {editingCatId ? `📝 Edit Custom Category: ${editingCatId}` : "📂 Register New Category"}
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5 font-sans">
                          Create custom dining categories that are synchronized immediately to client filters and dropdown views.
                        </p>
                      </div>

                      {catFormError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono text-left">
                          ⚠️ {catFormError}
                        </div>
                      )}

                      {catFormSuccess && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono text-left">
                          ✓ {catFormSuccess}
                        </div>
                      )}

                      <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-mono">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Category Slug ID *</label>
                          <input
                            type="text"
                            required
                            disabled={editingCatId !== null}
                            placeholder="e.g. jollof-specials"
                            value={newCatData.id}
                            onChange={(e) => setNewCatData(prev => ({ ...prev, id: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Category Display Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Jollof Specials"
                            value={newCatData.name}
                            onChange={(e) => setNewCatData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Visual Selector Icon Type</label>
                          <select
                            value={newCatData.icon}
                            onChange={(e) => setNewCatData(prev => ({ ...prev, icon: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer text-xs"
                          >
                            {["Utensils", "Flame", "Coffee", "GlassWater", "Egg", "Soup", "Salad", "Beef", "Fish", "UtensilsCrossed", "Pizza", "Cookie", "CupSoda"].map((ico) => (
                              <option key={ico} value={ico}>{ico}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Short Elegant Summary Description *</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="e.g. Luxurious house-spiced Nigerian grain crafts..."
                            value={newCatData.description}
                            onChange={(e) => setNewCatData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 font-sans"
                          />
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="submit"
                            className="flex-grow py-3 px-4 bg-amber-600 hover:bg-amber-700 text-black font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer font-mono"
                          >
                            {editingCatId ? "UPDATE CATEGORY ✓" : "CREATE CATEGORY ✓"}
                          </button>
                          {editingCatId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(null);
                                setNewCatData({ id: "", name: "", description: "", icon: "Utensils" });
                              }}
                              className="py-3 px-4 bg-neutral-900 border border-neutral-800 text-neutral-400 text-[10px] uppercase font-bold font-mono"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Categories Inventory List */}
                    <div className="xl:col-span-7 bg-[#121212] border border-neutral-850 p-6 space-y-4">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">Active Categories Inventory</h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          List representation of active categories. Includes preset static structures and custom creations.
                        </p>
                      </div>

                      <div className="space-y-2 overflow-y-auto max-h-[500px] no-scrollbar pr-1">
                        {(() => {
                          const administeredCategories = [
                            ...displayCategories,
                            ...CATEGORIES.filter(staticCat => !displayCategories.some(c => c.id === staticCat.id)).map(staticCat => ({
                              ...staticCat,
                              hidden: true
                            }))
                          ];
                          return administeredCategories.map((cat) => {
                            const isStatic = CATEGORIES.some(s => s.id === cat.id);
                            const isHidden = (cat as any).hidden;
                            return (
                              <div key={cat.id} className={`p-3.5 border flex items-start justify-between gap-3 ${isHidden ? "bg-neutral-950/20 border-neutral-900 opacity-60" : "bg-neutral-950/60 border-neutral-850"}`}>
                                <div className="text-left space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap text-left justify-start">
                                    <span className={`text-xs font-bold font-mono tracking-wide uppercase truncate ${isHidden ? "text-neutral-500 line-through" : "text-white"}`}>{cat.name}</span>
                                    <span className="text-[8px] font-mono text-amber-500 px-1 border border-amber-900/40 bg-amber-950/10">
                                      {cat.id}
                                    </span>
                                    {isStatic ? (
                                      <span className="text-[8px] font-mono text-neutral-500 uppercase">Static Core</span>
                                    ) : (
                                      <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold">Dynamic Custom</span>
                                    )}
                                    {isHidden && (
                                      <span className="text-[8px] font-mono text-amber-500 uppercase font-bold animate-pulse">Hidden / Disabled</span>
                                    )}
                                    {(cat as any).disabled && (
                                      <span className="text-[8px] font-mono text-red-500 border border-red-500/20 px-1 bg-red-950/20 uppercase font-bold">Disabled</span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">{cat.description}</p>
                                  <p className="text-[9px] text-neutral-500 font-mono">Icon representation: <code className="text-amber-500 font-bold">{cat.icon || "Utensils"}</code></p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {!isStatic && !isHidden && (
                                    <button
                                      onClick={() => {
                                        setEditingCatId(cat.id);
                                        setNewCatData({
                                          id: cat.id,
                                          name: cat.name,
                                          description: cat.description || "",
                                          icon: cat.icon || "Utensils"
                                        });
                                      }}
                                      className="py-1 px-2 border border-neutral-850 text-amber-500 hover:text-amber-400 text-[8px] font-mono uppercase bg-neutral-900 hover:bg-neutral-800 shrink-0"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  
                                  {/* Toggle Disable button */}
                                  {!isHidden && (
                                    <button
                                      onClick={() => handleToggleCategoryDisabled(cat, !!(cat as any).disabled)}
                                      className={`py-1 px-2 border text-[8px] font-mono uppercase shrink-0 ${
                                        (cat as any).disabled 
                                          ? "border-emerald-900/45 text-emerald-300 bg-emerald-950/25 hover:bg-emerald-900 hover:text-white" 
                                          : "border-red-900/45 text-red-300 bg-red-950/25 hover:bg-red-900 hover:text-white"
                                      }`}
                                    >
                                      {(cat as any).disabled ? "Enable" : "Disable"}
                                    </button>
                                  )}

                                  {isHidden ? (
                                    <button
                                      onClick={() => handleUnhideCategory(cat)}
                                      className="py-1 px-2 border border-emerald-900/40 text-emerald-400 hover:text-white text-[8px] font-mono uppercase bg-emerald-950/20 hover:bg-emerald-900 shrink-0"
                                    >
                                      Unhide (Enable)
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleDeleteCategory(cat)}
                                      className="py-1 px-2 border border-red-900/40 text-red-400 hover:text-white text-[8px] font-mono uppercase bg-red-950/20 hover:bg-red-900 shrink-0"
                                    >
                                      {isStatic ? "Hide (Disable)" : "Delete"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {(userRole === "admin" || userRole === "menu_lister") && activeTab === "images_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-images-control">
                    {/* Add Image Panel (Single & Bulk) */}
                    <div className="xl:col-span-5 bg-[#121212] border border-neutral-850 p-6 space-y-4 font-mono">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                          🖼️ Visual Library Uploads
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          Upload new high-resolution dining or ambient pictures to your digital assets collection.
                        </p>
                      </div>

                      {/* Single vs Bulk Mode Switcher */}
                      <div className="flex border-b border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setImageUploadMode("single")}
                          className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                            imageUploadMode === "single"
                              ? "text-amber-500 border-b-2 border-amber-500 bg-neutral-950/45"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          Single Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadMode("bulk")}
                          className={`flex-1 py-2 text-center text-[10px] font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                            imageUploadMode === "bulk"
                              ? "text-amber-500 border-b-2 border-amber-500 bg-neutral-950/45"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          Bulk Upload ({bulkImagesList.length})
                        </button>
                      </div>

                      {imageFormError && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono text-left">
                          ⚠️ {imageFormError}
                        </div>
                      )}

                      {imageFormSuccess && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono text-left">
                          ✓ {imageFormSuccess}
                        </div>
                      )}

                      {imageUploadMode === "single" ? (
                        <form onSubmit={handleSaveCustomImage} className="space-y-4 text-xs font-mono">
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Image Descriptive Label *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Crispy Suya Ribs"
                              value={newImageName}
                              onChange={(e) => setNewImageName(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-2 bg-neutral-950/60 p-3 border border-neutral-850 text-left">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Upload Local File</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="w-full text-[10px] text-neutral-400 file:bg-neutral-900 file:text-amber-500 file:px-2.5 file:py-1 file:border file:border-neutral-800 file:hover:bg-neutral-800 file:cursor-pointer"
                            />
                            <p className="text-[8px] text-neutral-500 mt-1">Accepts PNG, JPG, JPEG, WEBP under 1MB.</p>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-left">
                              <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">OR: Custom Image Address URL</label>
                              {newImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setNewImageUrl("")}
                                  className="text-[8.5px] hover:text-red-400 text-neutral-500 cursor-pointer font-mono"
                                >
                                  Clean URL
                                </button>
                              )}
                            </div>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              value={newImageUrl}
                              onChange={(e) => setNewImageUrl(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 text-[9.5px]"
                            />
                          </div>

                          {newImageUrl && (
                            <div className="space-y-1 bg-neutral-950/80 p-2 border border-neutral-850 text-left">
                              <span className="text-[8.5px] text-neutral-500 font-mono block uppercase">Interactive Preview:</span>
                              <div className="w-full h-32 overflow-hidden border border-neutral-800">
                                <img
                                  src={newImageUrl}
                                  alt="Dynamic Upload Preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as any).src = classicDrinks;
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-black font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer font-mono"
                          >
                            PUBLISH IMAGE TO LIBRARY ✓
                          </button>
                        </form>
                      ) : (
                        <div className="space-y-4 text-xs font-mono">
                          {/* Drag & Drop zone */}
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center space-y-2 cursor-pointer ${
                              isDragOver
                                ? "border-amber-500 bg-amber-950/20"
                                : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/40"
                            }`}
                            onClick={() => document.getElementById("bulk-file-input")?.click()}
                          >
                            <input
                              id="bulk-file-input"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files) {
                                  processFilesForBulk(e.target.files);
                                }
                              }}
                              className="hidden"
                            />
                            <Upload className={`w-8 h-8 ${isDragOver ? "text-amber-400 animate-bounce" : "text-neutral-500"}`} />
                            <div>
                              <p className="text-[11px] text-white font-bold uppercase tracking-wide">
                                Drag & Drop Multiple Images
                              </p>
                              <p className="text-[9px] text-neutral-400 mt-1 font-sans">
                                or click to browse device storage
                              </p>
                            </div>
                            <p className="text-[8px] text-neutral-500 font-sans">
                              Supports PNG, JPG, JPEG, WEBP up to 5MB each
                            </p>
                          </div>

                          {/* URL list input */}
                          <div className="space-y-2 bg-neutral-950/60 p-3 border border-neutral-850 text-left">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">
                              Or: Paste Multiple Image URLs
                            </label>
                            <textarea
                              placeholder="Paste external image URLs here, one per line or separated by commas"
                              value={bulkUrlInput}
                              onChange={(e) => setBulkUrlInput(e.target.value)}
                              rows={3}
                              className="w-full bg-[#121212] border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[9.5px] resize-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddBulkUrls}
                              className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-500 font-mono text-[9px] font-bold uppercase border border-neutral-700 transition-colors cursor-pointer"
                            >
                              Add URLs to Batch +
                            </button>
                          </div>

                          {/* Prepared batch list */}
                          {bulkImagesList.length > 0 && (
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center text-left">
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                  Prepared Batch ({bulkImagesList.length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setBulkImagesList([])}
                                  className="text-[8px] hover:text-red-400 text-neutral-500 font-mono uppercase cursor-pointer"
                                >
                                  Clear Batch ✕
                                </button>
                              </div>

                              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 no-scrollbar border-y border-neutral-850 py-2">
                                {bulkImagesList.map((item) => (
                                  <div
                                    key={item.id}
                                    className="bg-neutral-950 border border-neutral-850 p-2 flex gap-3 items-center"
                                  >
                                    <div className="w-12 h-12 overflow-hidden bg-neutral-900 border border-neutral-800 shrink-0">
                                      <img
                                        src={item.url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as any).src = classicDrinks;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1 text-left">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[8px] text-neutral-500 font-mono uppercase truncate">
                                          {item.size}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePreparedImage(item.id)}
                                          className="text-neutral-500 hover:text-red-400 font-mono text-[8.5px] uppercase cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleUpdatePreparedName(item.id, e.target.value)}
                                        placeholder="Enter image label"
                                        className="w-full bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 text-white text-[10px] focus:outline-none focus:border-amber-500"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Progress bar or Submit */}
                              {bulkUploadProgress.active ? (
                                <div className="space-y-2 bg-neutral-950 border border-amber-500/30 p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[9px] font-bold text-amber-400 font-mono uppercase tracking-widest">
                                      {bulkUploadProgress.statusText}
                                    </p>
                                  </div>
                                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
                                    <div
                                      className="bg-amber-500 h-full transition-all duration-300"
                                      style={{
                                        width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handlePublishBulkImages}
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-black font-bold uppercase tracking-wider text-[10px] transition-colors cursor-pointer font-mono"
                                >
                                  PUBLISH BATCH TO GALLERY ({bulkImagesList.length}) ✓
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Custom and static images display gallery */}
                    <div className="xl:col-span-7 bg-[#121212] border border-neutral-850 p-6 space-y-4">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">Available Visual Library Gallery</h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          Visual shortcuts container. Shows combination of global static presets and dynamic admin uploads.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] no-scrollbar pr-1">
                        {customImages.map((img) => (
                          <div key={img.id} className="bg-neutral-950/60 border border-neutral-850 p-2.5 space-y-2 group relative">
                            <div className="w-full h-24 overflow-hidden bg-neutral-900 border border-neutral-800">
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-1 text-left min-w-0">
                              <h4 className="text-[11px] font-bold text-white uppercase truncate">{img.name}</h4>
                              {img.isPreset ? (
                                <p className="text-[8.5px] font-mono text-neutral-500 uppercase">Core Seeded Preset</p>
                              ) : (
                                <p className="text-[8.5px] font-mono text-emerald-400 font-bold uppercase">Dynamic Custom</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteCustomImage(img.id, img.name)}
                              className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-red-950/90 hover:bg-red-900 text-red-200 hover:text-white border border-red-900/50 text-[7.5px] font-mono font-bold uppercase tracking-wider transition-all rounded shrink-0"
                            >
                              ✕ DELETE
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(userRole === "admin" || userRole === "developer") && activeTab === "instagram_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-instagram-control">
                    
                    {/* Left side splits: API Config & Hand curations */}
                    <div className="xl:col-span-5 space-y-6">

                      {/* One-Click Auto Login Handshake Box */}
                      <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30 p-6 space-y-4 font-mono">
                        <div>
                          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-900/60 rounded">
                            ⚡ Recommended: Live OAuth Handshake
                          </span>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase mt-2">
                            📸 Quick Sync Handshake
                          </h2>
                          <p className="text-[10px] text-neutral-400 font-sans mt-0.5 leading-relaxed">
                            Click below to authorize on Instagram. Our secure gateway will negotiate the access token, confirm ownership, and automatically synchronize your dynamic culinary feed into the landing page grid!
                          </p>
                        </div>

                        {instagramSyncError && (
                          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono">
                            ⚠️ {instagramSyncError}
                          </div>
                        )}

                        {instagramActionSuccess && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono">
                            ✓ {instagramActionSuccess}
                          </div>
                        )}

                        {instagramSyncStatus && (
                          <div className="p-3 bg-amber-950/20 border border-amber-900/30 text-amber-400 text-[10px] font-mono animate-pulse">
                            ⚙ {instagramSyncStatus}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleInstagramConnectHandshake}
                          disabled={isInstagramConfigLoading || isInstagramSyncing}
                          className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold uppercase tracking-wider text-[10px] transition-all cursor-pointer flex items-center justify-center gap-2 rounded shadow-md shadow-amber-600/10"
                        >
                          <span>📸 CONNECT INSTAGRAM ACCOUNT</span>
                        </button>
                      </div>
                      
                      {/* API Settings Box */}
                      <div className="bg-[#121212] border border-neutral-850 p-6 space-y-4 font-mono">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            ⚙️ Advanced Instagram Api Configuration
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            Prefer manual integration? Save custom developer tokens directly to the backend settings node below without popup authorization.
                          </p>
                        </div>

                        <form onSubmit={handleSaveInstagramConfig} className="space-y-4 text-xs font-mono">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Instagram Handle Username</label>
                            <input
                              type="text"
                              placeholder="e.g. upsidelagos"
                              value={instagramUsername}
                              onChange={(e) => setInstagramUsername(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Long-Lived User Access Token</label>
                            <input
                              type="password"
                              placeholder="IGQVJ............"
                              value={instagramToken}
                              onChange={(e) => setInstagramToken(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 text-[11px]"
                            />
                            <p className="text-[8px] text-neutral-500 font-sans mt-1">
                              Create an App on <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-amber-500 underline">Meta Developers</a>, add "Instagram Basic Display", and click "Generate Token".
                            </p>
                          </div>

                          {instagramLastSynced && (
                            <div className="text-[9px] text-neutral-400 flex justify-between bg-neutral-950 p-2 border border-neutral-900">
                              <span>Last API Sync Attempt:</span>
                              <span className="text-amber-500 font-bold">{new Date(instagramLastSynced).toLocaleString()}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="submit"
                              disabled={isInstagramConfigLoading}
                              className="py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500 text-white font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer"
                            >
                              {isInstagramConfigLoading ? "Saving..." : "Save Settings"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSyncInstagramFeed()}
                              disabled={isInstagramSyncing}
                              className="py-2.5 bg-amber-600 hover:bg-amber-700 text-black font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>{isInstagramSyncing ? "Syncing..." : "Sync Live Feed"}</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Manual Customization Box */}
                      <div className="bg-[#121212] border border-neutral-850 p-6 space-y-4 font-mono">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            🎨 Curate Custom Moments (Seeding Tool)
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            Don't have real Instagram token access ready yet? No problem! Manually curate stunning premium moments with elegant local links and captions. They will instantly merge with any live API data in your public landing grid.
                          </p>
                        </div>

                        <form onSubmit={handleAddManualPost} className="space-y-4 text-xs font-mono">
                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Image URL *</label>
                            <input
                              type="url"
                              required
                              placeholder="https://images.unsplash.com/..."
                              value={manualPostUrl}
                              onChange={(e) => setManualPostUrl(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 text-[10px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Caption Description</label>
                            <input
                              type="text"
                              placeholder="e.g. Late cocktails in Admiralty Way"
                              value={manualPostCaption}
                              onChange={(e) => setManualPostCaption(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Instagram Permalink URL</label>
                            <input
                              type="url"
                              placeholder="https://instagram.com/p/..."
                              value={manualPostPermalink}
                              onChange={(e) => setManualPostPermalink(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 text-[10px]"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 hover:border-amber-500 text-amber-500 font-bold uppercase tracking-wider text-[9px] transition-all cursor-pointer"
                          >
                            Add Curated Moment ✓
                          </button>
                        </form>
                      </div>

                    </div>

                    {/* Right side live items manager */}
                    <div className="xl:col-span-7 bg-[#121212] border border-neutral-850 p-6 space-y-4">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                          Website Live Grid Manager ({syncedInstagramPosts.length})
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          Below are the posts currently active in the front-end Instagram Moments block. Live-synced media and custom seeded moments are rendered with appropriate metadata.
                        </p>
                      </div>

                      {syncedInstagramPosts.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-neutral-850 text-neutral-500 space-y-2 font-mono">
                          <p className="text-xs uppercase font-bold tracking-widest text-neutral-400">Website Grid is Unseeded</p>
                          <p className="text-[10px] max-w-xs mx-auto font-sans leading-relaxed">
                            No dynamic posts found in Firestore. The landing page grid is currently displaying high-end static fallback presets automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-[550px] no-scrollbar pr-1 font-mono text-left">
                          {syncedInstagramPosts.map((post) => {
                            const isManual = post.id.startsWith("manual-");
                            return (
                              <div key={post.id} className="bg-neutral-950/60 border border-neutral-850 p-2 space-y-2 relative group flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="aspect-square w-full overflow-hidden bg-neutral-900 border border-neutral-800">
                                    <img
                                      src={post.media_url}
                                      alt={post.caption || "Instagram Feed Post"}
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="space-y-1 text-left min-w-0">
                                    <p className="text-[10px] text-neutral-300 leading-tight line-clamp-2 h-7 font-sans">
                                      {post.caption || "Dining Moment"}
                                    </p>
                                    <span className="inline-block text-[8px] px-1 py-0.5 font-bold uppercase rounded mt-1">
                                      {isManual ? (
                                        <span className="text-amber-500 bg-amber-950/10 border border-amber-900/30 px-1 py-0.5 rounded">Curated Fallback</span>
                                      ) : (
                                        <span className="text-emerald-400 bg-emerald-900/10 border border-emerald-900/20 px-1 py-0.5 rounded">Api Synced</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="pt-2 flex gap-1.5 w-full mt-auto">
                                  <button
                                    onClick={() => post.permalink && window.open(post.permalink, "_blank")}
                                    className="flex-1 py-1 px-1 bg-neutral-900 hover:bg-neutral-800 text-amber-500 border border-neutral-800 text-[8px] font-mono uppercase text-center cursor-pointer transition-all shrink-0"
                                  >
                                    View Link
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="py-1 px-1.5 bg-red-950/40 hover:bg-red-900 hover:text-white border border-red-900/30 text-red-400 text-[8px] font-mono uppercase text-center cursor-pointer transition-all shrink-0"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {(userRole === "admin" || userRole === "developer") && activeTab === "opay_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-opay-control">
                    
                    {/* Left Column: Documentation & Status */}
                    <div className="xl:col-span-4 space-y-6">
                      <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30 p-6 space-y-4 font-mono">
                        <div>
                          <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/40 px-2 py-0.5 border border-amber-900/60 rounded border-dashed">
                            🛡️ Bank-Grade Security
                          </span>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase mt-2">
                            OPAY CHECKOUT INTEGRATION
                          </h2>
                          <p className="text-[10px] text-neutral-400 font-sans mt-0.5 leading-relaxed">
                            Upside Fine Dining utilizes server-side proxy hashing. Credentials never travel to or expose inside client browsers. HMAC-SHA512 hashing protects order payloads directly within container runtimes.
                          </p>
                        </div>

                        <div className="space-y-2 border-t border-neutral-800 pt-4 text-[9.5px] text-neutral-400 leading-relaxed font-sans">
                          <p className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold">✓</span> Firebase Firestore Rules locked to Admin only
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold">✓</span> Direct HMAC SHA-512 signing handshake
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold">✓</span> Supports sandbox testing out-of-the-box
                          </p>
                        </div>

                        <div className="bg-[#0e0c0b] border border-neutral-850 p-4 font-mono text-[9.5px]">
                          <span className="text-neutral-500 font-bold block uppercase border-b border-neutral-850 pb-1 mb-1">Useful Resources:</span>
                          <a 
                            href="https://documentation.opaycheckout.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:underline block"
                          >
                            🔗 OPay Developer Portal Docs
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Configuration Form */}
                    <div className="xl:col-span-8">
                      <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 font-mono font-bold">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            ⚙️ OPay API GATEWAY CREDENTIALS
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            Provide your official Merchant credentials. You can acquire these from the OPay Merchant Portal API Integration tab.
                          </p>
                        </div>

                        {opayActionError && (
                          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono font-normal">
                            ⚠️ {opayActionError}
                          </div>
                        )}

                        {opayActionSuccess && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono font-normal">
                            ✓ {opayActionSuccess}
                          </div>
                        )}

                        <form onSubmit={handleSaveOpayConfig} className="space-y-4 text-xs font-mono">
                          <div className="space-y-1">
                            <label className="text-neutral-400 font-bold block uppercase text-[10px]">Merchant ID</label>
                            <input
                              type="text"
                              required
                              value={opayMerchantId}
                              onChange={(e) => setOpayMerchantId(e.target.value)}
                              placeholder="e.g. 256621102919017"
                              className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-3 font-mono focus:border-amber-500 outline-none rounded"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Public Key</label>
                              <input
                                type="text"
                                required
                                value={opayPublicKey}
                                onChange={(e) => setOpayPublicKey(e.target.value)}
                                placeholder="OPAY_PUB..."
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-3 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Secret Key</label>
                              <input
                                type="password"
                                required
                                value={opaySecretKey}
                                onChange={(e) => setOpaySecretKey(e.target.value)}
                                placeholder="OPAY_SEC..."
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-3 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 border-t border-neutral-850 pt-4">
                            <label className="text-neutral-400 font-bold block uppercase text-[10px]">Gateway Environment Mode</label>
                            <div className="flex flex-wrap gap-6 items-center pt-1 font-normal">
                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
                                <input
                                  type="radio"
                                  name="opayEnv"
                                  checked={opayEnvironment === "sandbox"}
                                  onChange={() => setOpayEnvironment("sandbox")}
                                  className="w-4 h-4 text-amber-600 bg-[#1e1e1e] border-neutral-700 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>Sandbox mode (Testing & Verification)</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-white select-none">
                                <input
                                  type="radio"
                                  name="opayEnv"
                                  checked={opayEnvironment === "production"}
                                  onChange={() => setOpayEnvironment("production")}
                                  className="w-4 h-4 text-amber-600 bg-[#1e1e1e] border-neutral-700 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>Production mode (Live Commercial Transactions)</span>
                              </label>
                            </div>
                          </div>

                          <div className="border-t border-neutral-850 pt-4">
                            <button
                              type="submit"
                              disabled={isOpayLoading}
                              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold uppercase tracking-wider text-[10px] transition-all cursor-pointer rounded"
                            >
                              {isOpayLoading ? "SAVING GATEWAY CONFIG..." : "✓ SAVE SECURE CREDENTIALS"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {userRole === "admin" && activeTab === "shipping_panel" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 text-left" id="dashboard-shipping-tab">
                    <div className="flex flex-col gap-1.5 border-b border-neutral-800 pb-4">
                      <h2 className="text-lg font-bold font-mono text-white tracking-wider uppercase flex items-center gap-2 animate-fadeIn">
                        🚚 Lagos Delivery Locations & Fees
                      </h2>
                      <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                        Customize where you operate in Lagos State. Standard guidelines state operations are restricted only to Lagos Island areas and specific places on the Mainland.
                      </p>
                    </div>

                    {/* Quick alert banner for mainland guidelines */}
                    <div className="bg-amber-900/10 border border-amber-800/30 p-3 text-[11px] font-mono text-amber-500/90 leading-relaxed flex items-start gap-2">
                      <span className="text-sm">⚠️</span>
                      <div>
                        <span className="font-bold">Operational Scope Info:</span> We only operate in Lagos Island neighborhoods (Ikoyi, V.I., Lekki, Banana Island) and designated Mainland neighborhoods (Ikeja, Gbagada, etc.) to ensure rapid express delivery.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Add / Edit Option Form */}
                      <div className="lg:col-span-4 bg-black border border-neutral-850 p-4 space-y-4 rounded">
                        <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-neutral-850 pb-2">
                          Add / Edit Location
                        </h3>

                        <form className="space-y-4 text-xs font-mono" onSubmit={async (e) => {
                          e.preventDefault();
                          const target = e.currentTarget;
                          const name = (target.elements.namedItem("locationName") as HTMLInputElement).value.trim();
                          const fee = Number((target.elements.namedItem("locationFee") as HTMLInputElement).value);
                          const isMainland = (target.elements.namedItem("locationType") as HTMLSelectElement).value === "mainland";

                          if (!name || isNaN(fee) || fee < 0) {
                            alert("Please provide a valid location name and positive delivery fee.");
                            return;
                          }

                          // Slugify name for consistent id
                          const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim();
                          if (!id) return;

                          try {
                            const docRef = doc(db, "shipping_areas", id);
                            await setDoc(docRef, {
                              id,
                              name,
                              fee,
                              isMainland,
                              deleted: false,
                              createdAt: new Date().toISOString()
                            });
                            target.reset();
                          } catch (err) {
                            console.error("Failed saving delivery location:", err);
                            alert("Failed to save delivery location. Please ensure you are logged in with Admin privileges.");
                          }
                        }}>
                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 uppercase">Neighborhood Name *</label>
                            <input
                              type="text"
                              name="locationName"
                              required
                              placeholder="E.g., Surulere, Yaba, Victoria Island"
                              className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-amber-500 transition-all rounded"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 uppercase">Delivery Fee (₦) *</label>
                            <input
                              type="number"
                              name="locationFee"
                              required
                              placeholder="E.g., 4000"
                              className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-amber-500 transition-all rounded"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 uppercase">Region classification *</label>
                            <select
                              name="locationType"
                              className="w-full bg-neutral-900 border border-neutral-800 text-white font-mono text-xs px-3 py-2 focus:outline-none focus:border-amber-500 transition-all rounded"
                            >
                              <option value="island">🏝️ Lagos Island</option>
                              <option value="mainland">🏢 Lagos Mainland</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-extrabold uppercase tracking-wider text-[10px] transition-all rounded cursor-pointer"
                          >
                            ✓ Save Location Options
                          </button>
                        </form>
                      </div>

                      {/* Right: Existing Locations List with dynamically loaded state */}
                      <div className="lg:col-span-8 bg-black/40 border border-neutral-850 p-4 space-y-4 rounded">
                        <div className="flex justify-between items-center border-b border-neutral-850 pb-2">
                          <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest">
                            Available Shipping Options ({shippingLocations.length})
                          </h3>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                              <tr className="border-b border-neutral-800 text-[10px] text-neutral-400 uppercase">
                                <th className="pb-2 font-bold tracking-wider">Neighborhood</th>
                                <th className="pb-2 font-bold tracking-wider">Zone</th>
                                <th className="pb-2 font-bold tracking-wider text-right">Delivery Fee</th>
                                <th className="pb-2 font-bold tracking-wider text-right">Manage</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shippingLocations.map((locItem) => {
                                return (
                                  <tr key={locItem.id} className="border-b border-neutral-900/60 hover:bg-neutral-900/30">
                                    <td className="py-3 font-semibold text-white">{locItem.name}</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                        locItem.isMainland 
                                          ? "bg-blue-900/20 text-blue-400 border border-blue-800/30" 
                                          : "bg-teal-900/20 text-teal-400 border border-teal-800/30"
                                      }`}>
                                        {locItem.isMainland ? "🏢 Mainland" : "🏝️ Island"}
                                      </span>
                                    </td>
                                    <td className="py-3 text-right font-bold text-amber-500">
                                      ₦{locItem.fee.toLocaleString()}
                                    </td>
                                    <td className="py-3 text-right">
                                      <button
                                        onClick={async () => {
                                          if (confirm(`Are you sure you want to remove ${locItem.name} from shipping locations?`)) {
                                            try {
                                              // Mark as deleted in Firestore
                                              const docRef = doc(db, "shipping_areas", locItem.id);
                                              await setDoc(docRef, {
                                                id: locItem.id,
                                                name: locItem.name,
                                                fee: locItem.fee,
                                                isMainland: locItem.isMainland || false,
                                                deleted: true,
                                                createdAt: new Date().toISOString()
                                              });
                                            } catch (err) {
                                              console.error("Failed to remove shipping area:", err);
                                              alert("Could not remove shipping location. Ensure you have admin access.");
                                            }
                                          }
                                        }}
                                        className="py-1 px-2.5 bg-red-950 hover:bg-red-900 text-red-500 hover:text-red-400 text-[9px] uppercase font-bold transition-all rounded border border-red-900/50 cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {shippingLocations.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-neutral-500 text-xs">
                                    No shipping locations populated. Restoring system defaults...
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(userRole === "admin" || userRole === "sales") && activeTab === "analytics_panel" && (
                  <AdminAnalyticsPanel />
                )}

                {userRole === "admin" && activeTab === "riders_panel" && (
                  <RidersManagementPanel />
                )}

                {(userRole === "admin" || userRole === "sales") && activeTab === "support_panel" && (
                  <SupportManagementPanel />
                )}

                {(userRole === "admin" || userRole === "developer") && activeTab === "mysql_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-mysql-control">
                    
                    {/* Left Column: Connection Check and Schema Monitor */}
                    <div className="xl:col-span-5 space-y-6">
                      <div className="bg-[#121212] border border-neutral-850 p-6 space-y-4 rounded">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-850">
                          <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                            🗄️ CONNECTION STATUS
                          </h2>
                          <button
                            onClick={fetchMySQLStatus}
                            className="text-[9px] uppercase font-bold text-amber-500 hover:text-amber-400 bg-neutral-900 px-2 py-1 border border-neutral-800 rounded transition-all cursor-pointer"
                          >
                            🔄 REFRESH
                          </button>
                        </div>

                        {mysqlStatus === "loading" && (
                          <div className="py-6 text-center space-y-2">
                            <div className="animate-spin inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                            <p className="text-[10px] text-neutral-400 font-mono">Pinging host server...</p>
                          </div>
                        )}

                        {mysqlStatus === "connected" && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs bg-emerald-950/20 border border-emerald-900/30 p-3 rounded">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="font-extrabold uppercase">● ONLINE & CONNECTED</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                              {mysqlStatusMessage}
                            </p>
                          </div>
                        )}

                        {mysqlStatus === "disconnected" && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-red-400 font-mono text-xs bg-red-950/20 border border-red-900/30 p-3 rounded">
                              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                              <span className="font-extrabold uppercase">● OFFLINE / UNCONFIGURED</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                              {mysqlStatusMessage}
                            </p>
                          </div>
                        )}

                        {/* Interactive Deep Diagnostic Section */}
                        <div className="pt-2 border-t border-neutral-900 space-y-2">
                          <button
                            type="button"
                            onClick={runDatabaseDiagnostic}
                            disabled={isDiagnosticLoading}
                            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 active:bg-amber-500/30 text-amber-500 border border-amber-500/30 text-[9.5px] uppercase font-bold tracking-wider cursor-pointer rounded transition-all flex items-center justify-center gap-2"
                          >
                            {isDiagnosticLoading ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                Analyzing Sockets & DNS...
                              </>
                            ) : (
                              "🔍 Run Deep Port Connectivity Diagnostic"
                            )}
                          </button>

                          {diagnosticInfo && (
                            <div className="p-3 bg-emerald-950/25 border border-emerald-900/30 rounded text-[9.5px] font-mono space-y-1.5 text-emerald-400">
                              <p className="font-bold">✓ DIAGNOSTIC PASSED</p>
                              <p className="text-neutral-400 leading-normal font-sans font-normal">
                                Single-connection TCP socket validation handshaked and tested query successfully.
                              </p>
                              <div className="bg-black/50 p-1.5 border border-neutral-900/40 rounded text-[9px] text-neutral-300">
                                Target: {diagnosticInfo.details?.host}:{diagnosticInfo.details?.port}
                              </div>
                            </div>
                          )}

                          {diagnosticError && (
                            <div className="p-3.5 bg-red-950/25 border border-red-900/35 rounded text-[9.5px] font-mono space-y-2 text-red-450">
                              <p className="font-bold text-red-400">⚠️ DIAGNOSTIC ANALYSIS REPORT</p>
                              <p className="text-neutral-400 font-sans leading-normal font-normal">
                                The connection handshake failed before executing the query. View error details below:
                              </p>
                              <div className="bg-black/60 p-2.5 border border-neutral-900 rounded text-[9px] text-[#f87171] space-y-1 break-all overflow-x-auto leading-relaxed">
                                <div><strong className="text-neutral-400">Message:</strong> {diagnosticError.message}</div>
                                {diagnosticError.code && <div><strong className="text-neutral-400">Error Code:</strong> {diagnosticError.code}</div>}
                                {diagnosticError.errno && <div><strong className="text-neutral-400">Errno:</strong> {diagnosticError.errno}</div>}
                                {diagnosticError.syscall && <div><strong className="text-neutral-400">Syscall:</strong> {diagnosticError.syscall}</div>}
                                {diagnosticError.address && <div><strong className="text-neutral-400">Resolved Address:</strong> {diagnosticError.address}</div>}
                                {diagnosticError.port && <div><strong className="text-neutral-400">Target Port:</strong> {diagnosticError.port}</div>}
                              </div>
                              <p className="text-neutral-500 text-[8.5px] font-sans leading-relaxed font-normal">
                                <strong className="text-neutral-400">Recommendation:</strong> If the issue is ETIMEDOUT or ECONNREFUSED, make sure the database is active and allows incoming traffic from standard remote servers. Port 3306 or your custom port might require open firewall privileges in cPanel.
                              </p>
                            </div>
                          )}
                        </div>

                        {mysqlStatus === "connected" && mysqlTables.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h3 className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 font-extrabold">
                              📚 LATEST CPANEL ROW COUNTS
                            </h3>
                            <div className="space-y-1 bg-black/40 p-3 border border-neutral-850 rounded text-[10px] font-mono">
                              {mysqlTables.map((tbl) => (
                                <div key={tbl.tableName} className="flex justify-between py-1 border-b border-neutral-900 last:border-0 font-normal">
                                  <span className="text-neutral-300">{tbl.tableName}</span>
                                  <span className="text-amber-500 font-bold">{tbl.rows} rows</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="bg-[#0e0c0b] border border-neutral-900 p-4 rounded font-mono text-[9.5px] space-y-2">
                          <span className="text-neutral-500 font-bold block uppercase border-b border-neutral-850 pb-1">Migration Utilities:</span>
                          <p className="text-neutral-400 font-sans font-normal leading-relaxed">
                            Once configured and populated, click below to generate and download a standard SQL dump that you can import with a single click inside cPanel's phpMyAdmin workspace.
                          </p>
                          <a 
                            href={getApiUrl("/api/mysql/export")} 
                            download="upside_restaurant_mysql_dump.sql"
                            className={`w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-amber-500 hover:text-amber-400 border border-neutral-800 text-[9.5px] font-bold uppercase text-center cursor-pointer transition-all flex items-center justify-center gap-1.5`}
                          >
                            📥 EXPORT CPANEL SQL DUMP (.SQL)
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Schema Control & Environment Key Config */}
                    <div className="xl:col-span-7 space-y-6">
                      <div className="bg-[#121212] border border-neutral-850 p-6 space-y-6 rounded font-bold font-mono">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            ⚙️ MYSQL CONNECTION SETTINGS
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            Enter credentials matching your hosting cPanel MySQL user database attributes. Database operations are run securely on the server side.
                          </p>
                        </div>

                        {mysqlActionError && (
                          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 text-[10px] font-mono font-normal">
                            ⚠️ {mysqlActionError}
                          </div>
                        )}

                        {mysqlActionSuccess && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-[10px] font-mono font-normal">
                            ✓ {mysqlActionSuccess}
                          </div>
                        )}

                        <form onSubmit={handleSaveMySQLConfig} className="space-y-4 text-xs font-mono">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 font-normal">
                            <div className="md:col-span-8 space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Database Host</label>
                              <input
                                type="text"
                                required
                                value={mysqlHost}
                                onChange={(e) => setMysqlHost(e.target.value)}
                                placeholder="e.g. localhost or mysql.yourdomain.com"
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-2.5 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>

                            <div className="md:col-span-4 space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Port</label>
                              <input
                                type="text"
                                required
                                value={mysqlPort}
                                onChange={(e) => setMysqlPort(e.target.value)}
                                placeholder="3306"
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-2.5 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-normal">
                            <div className="space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Database User</label>
                              <input
                                type="text"
                                required
                                value={mysqlUser}
                                onChange={(e) => setMysqlUser(e.target.value)}
                                placeholder="e.g. user_wp"
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-2.5 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-neutral-400 font-bold block uppercase text-[10px]">Database Password</label>
                              <input
                                type="password"
                                value={mysqlPassword}
                                onChange={(e) => setMysqlPassword(e.target.value)}
                                placeholder="••••••••••••"
                                className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-2.5 font-mono focus:border-amber-500 outline-none rounded"
                              />
                            </div>
                          </div>

                          <div className="space-y-1 font-normal">
                            <label className="text-neutral-400 font-bold block uppercase text-[10px]">Database Name (Schema)</label>
                            <input
                              type="text"
                              required
                              value={mysqlDatabase}
                              onChange={(e) => setMysqlDatabase(e.target.value)}
                              placeholder="e.g. database_name"
                              className="w-full bg-[#1e1e1e] border border-neutral-800 text-white text-[11px] p-2.5 font-mono focus:border-amber-500 outline-none rounded"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isMysqlLoading}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-850 disabled:text-neutral-500 text-black font-extrabold uppercase tracking-wider text-[10px] transition-all cursor-pointer rounded"
                          >
                            {isMysqlLoading ? "SAVING DB PARAMETERS..." : "✓ SAVE CONNECTION PARAMETERS"}
                          </button>
                        </form>

                        <div className="border-t border-neutral-850 pt-6 space-y-4">
                          <div>
                            <h3 className="text-[11px] font-mono font-bold uppercase text-amber-500 tracking-wider">
                              🛠️ ADMINISTRATIVE OPERATIONS
                            </h3>
                            <p className="text-[10px] text-neutral-500 font-sans font-normal">
                              Installs target table structure (categories, menu items, shipping zones, orders, transactions, users profiles) and seeds static products to prepare the server schema.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                              onClick={handleMySQLSchemaSetup}
                              disabled={mysqlStatus !== "connected" || isSchemaSetupWorking}
                              className="py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-white hover:text-amber-500 disabled:bg-neutral-950/40 disabled:text-neutral-600 disabled:border-neutral-900 font-bold uppercase text-[9.5px] cursor-pointer rounded transition-all select-none"
                            >
                              {isSchemaSetupWorking ? "EXECUTING CONSOLE DDL..." : "🚀 CREATE TABLES & STATIC SEEDS"}
                            </button>

                            <button
                              onClick={handleMySQLDataSync}
                              disabled={mysqlStatus !== "connected" || isDataSyncWorking}
                              className="py-3 bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-white hover:text-amber-500 disabled:bg-neutral-950/40 disabled:text-neutral-600 disabled:border-neutral-900 font-bold uppercase text-[9.5px] cursor-pointer rounded transition-all select-none"
                            >
                              {isDataSyncWorking ? "LIVE REPLICATING DATA..." : "🔄 SYNC & REPLICATE FIRESTORE DATA"}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Logged out visual gate setup */
          <div className="max-w-md mx-auto bg-[#121212] border border-neutral-850 shadow-2xl p-8 space-y-6 text-center" id="dashboard-logged-out-gate">
            <div className="w-16 h-16 bg-neutral-900/80 border border-neutral-800 flex items-center justify-center mx-auto relative">
              <ShieldCheck className="w-8 h-8 text-amber-500/80" />
              <div className="absolute inset-0 border border-amber-500/10 animate-ping rounded-full scale-105" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] tracking-[0.3em] text-amber-500 font-mono font-bold uppercase block">
                Dashboard Portal Gate
              </span>
              <h3 className="text-xl font-bold font-mono text-white tracking-wider uppercase">
                AUTHENTICATION REQUIRED
              </h3>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed max-w-sm mx-auto">
                Sign in to check past order completions, monitor cooking progress, and keep your custom wishlist dishes saved.
              </p>
            </div>

            <div className="pt-1.5 space-y-3">
              <button
                onClick={onAuthClick}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs tracking-widest uppercase transition-colors shadow-lg cursor-pointer flex items-center justify-center gap-2"
                id="dashboard-unauth-login-trigger"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN / CREATE ACCOUNT</span>
              </button>
              
              <button
                onClick={onBackToLobby}
                className="w-full py-3.5 bg-[#181818] hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white font-mono text-xs tracking-widest uppercase transition-colors cursor-pointer"
              >
                <span>RETURN TO FOOD EXPLORE</span>
              </button>
            </div>

            {/* Privacy note */}
            <p className="text-[9px] text-neutral-600 font-sans">
              🔒 Safe identity encryption verified under standard security guidelines.
            </p>
          </div>
        )}

        {/* 📧 CUSTOM EMAIL DESK MODAL POPUP */}
        {emailModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn" id="custom-email-desk-modal">
            <div className="bg-[#121212] border border-neutral-800 w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl rounded-none text-left">
              
              {/* Header */}
              <div className="p-5 border-b border-neutral-850 flex justify-between items-center bg-neutral-900">
                <div className="space-y-1">
                  <h3 className="text-sm font-mono font-bold tracking-widest text-amber-500 uppercase flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>Email Dispatch Desk</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-sans">
                    Direct client messaging channel. Real-time SMTP or simulation fallback delivery.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setEmailModalOrder(null)}
                  className="p-1.5 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white transition-all cursor-pointer font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSendEmail} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Recipient Details */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-950 p-4 border border-neutral-900">
                  <div>
                    <label className="block text-[9px] font-mono tracking-wider uppercase text-neutral-500 mb-1">
                      Customer Name
                    </label>
                    <p className="text-xs font-bold text-neutral-200">
                      {emailModalOrder.customerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono tracking-wider uppercase text-neutral-500 mb-1">
                      Destination E-mail
                    </label>
                    <p className="text-xs font-mono font-bold text-amber-500 truncate">
                      {emailModalOrder.email || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Update regarding your premium gourmet menu selection"
                    className="w-full bg-neutral-950 border border-neutral-800 font-sans text-xs p-3 focus:outline-none focus:border-amber-500 text-white"
                    disabled={isSendingEmail}
                  />
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-mono tracking-wider uppercase text-neutral-400">
                    Email Content (Markdown/HTML structure will be automatically formatted)
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Type your official message details here..."
                    className="w-full bg-neutral-950 border border-neutral-800 font-sans text-xs p-3 focus:outline-none focus:border-amber-500 text-white leading-relaxed resize-none"
                    disabled={isSendingEmail}
                  />
                </div>

                {/* Status Signals */}
                {emailSuccessMessage && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{emailSuccessMessage}</span>
                  </div>
                )}

                {emailErrorMessage && (
                  <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-500 text-xs font-mono flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{emailErrorMessage}</span>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-2 border-t border-neutral-850 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEmailModalOrder(null)}
                    className="px-4 py-2.5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 font-mono text-[10px] tracking-wider uppercase transition-colors cursor-pointer"
                    disabled={isSendingEmail}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail || !emailSubject.trim() || !emailMessage.trim()}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-mono text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-2"
                  >
                    {isSendingEmail ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Email</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
