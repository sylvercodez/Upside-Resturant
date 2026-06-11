import React, { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { MenuItem, MENU_ITEMS, CATEGORIES, Category } from "../data/menu";
import OrderHistory from "./OrderHistory";
import OrderTracker from "./OrderTracker";
import AdminAnalyticsPanel from "./AdminAnalyticsPanel";
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
  Award
} from "lucide-react";
import { collection, query, updateDoc, doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { ShippingLocation, getApiUrl } from "../types";

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
}

const PRESET_IMAGES = [
  { name: "Gourmet Burger", url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800" },
  { name: "Premium Steak", url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800" },
  { name: "Charred Salmon", url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800" },
  { name: "Fresh Pasta", url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800" },
  { name: "Woodfired Pizza", url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800" },
  { name: "Artisanal Coffee", url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800" },
  { name: "Craft Cocktail", url: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800" },
  { name: "Heritage Appetizer", url: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800" }
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
  shippingLocations = []
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
  const [ordersSearchText, setOrdersSearchText] = useState("");
  const [selectedOrderTab, setSelectedOrderTab] = useState<string>("all");

  // Form states to create customized menu items
  const [newMenuData, setNewMenuData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    category: "starters",
    image: PRESET_IMAGES[0].url,
    tags: "Chef's Special, Spicy",
    specs: "Contains premium native spices"
  });
  const [menuFormError, setMenuFormError] = useState("");
  const [menuFormSuccess, setMenuFormSuccess] = useState("");

  // IMAGE LIBRARY STATES
  const [customImages, setCustomImages] = useState<{ id: string, name: string, url: string }[]>([]);
  const [newImageName, setNewImageName] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imageFormSuccess, setImageFormSuccess] = useState("");
  const [imageFormError, setNewImageFormError] = useState("");

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
    if (currentUser && userRole === "admin") {
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
    if (currentUser && userRole === "admin") {
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
    if (currentUser && userRole === "admin") {
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
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "assets", parsedId), payload);
      setImageFormSuccess(`Image "${newImageName}" successfully registered to library.`);
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
      await deleteDoc(doc(db, "assets", imgId));
      setImageFormSuccess(`"${imgName}" was deleted from the dynamic library.`);
    } catch (err: any) {
      console.error("Delete image failed:", err);
      alert(`Failed to delete image: ${err.message}`);
      handleFirestoreError(err, OperationType.DELETE, `assets/${imgId}`);
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
      await setDoc(doc(db, "categories", parsedId), payload);
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
      await deleteDoc(doc(db, "categories", cat.id));
      setCatFormSuccess(`"${cat.name}" has been enabled/unhidden successfully!`);
    } catch (err: any) {
      console.error("Unhide category failed:", err);
      alert(`Could not unhide category: ${err.message}`);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(`Are you absolutely sure you want to delete Category "${cat.name}"? This won't delete menu items but will remove the category filter.`)) return;
    try {
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

  // Handle setting order progress state
  const handleSetOrderStatus = async (orderId: string, statusText: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: statusText });
    } catch (e: any) {
      console.error("Order status shift failed:", e);
      alert(`Could not transition order progress: ${e.message}`);
    }
  };

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Handle deleting of menu items (only allowed to admin)
  const handleDeleteMenuItem = async (item: MenuItem) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${item.name}" from the menu?`)) return;
    try {
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
          specs: "Contains premium native spices"
        });
      }
    } catch (e: any) {
      console.error("Menu item deletion failure:", e);
      alert(`Failed to delete menu item: ${e.message}`);
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
        setMenuFormError("Gourmet Slug Id must contain valid small case alpha-numeric characters only.");
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
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "menus", parsedId), itemPayload);
      
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
        specs: "Contains premium native spices"
      });
    } catch (err: any) {
      console.error("Menu save error:", err);
      setMenuFormError(`Failed to save gourmet item to database: ${err.message}`);
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
    // Stage check
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
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80" 
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
                  {isPrivileged && (
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
                  )}

                  {/* Admin-only user manager and dynamic menu creator */}
                  {userRole === "admin" && (
                    <>
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
                        onClick={() => setActiveTab("analytics_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "analytics_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                        }`}
                      >
                        📊 Analytics & Conversions
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
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
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
                        {["all", "Prepping", "In Oven", "Out for Delivery", "Delivered"].map((st) => (
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
                                  <span className="text-[9px] text-neutral-500 uppercase">
                                    {ord.type}
                                  </span>
                                </div>

                                {/* Main client Info grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] bg-neutral-950/40 p-3 border border-neutral-850">
                                  <div>
                                    <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Client</p>
                                    <p className="text-neutral-200 mt-0.5">{ord.customerName}</p>
                                    <p className="text-[9px] text-neutral-400 mt-0.5">{ord.email}</p>
                                    <p className="text-[9px] text-neutral-400">{ord.phone}</p>
                                  </div>
                                  <div className="md:col-span-2">
                                    <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">Fulfillment Sanctuary</p>
                                    <p className="text-neutral-200 mt-0.5 line-clamp-2">{ord.address}</p>
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
                                            {(it?.quantity || 1)}x <span className="font-sans text-white">{it?.name || "Gourmet Dish"}</span>
                                          </span>
                                          <span className="text-neutral-400">₦{((it?.price || 5000) * (it?.quantity || 1)).toLocaleString()}</span>
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
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
                                    <button
                                      disabled={ordStatus === "Prepping"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Prepping")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ordStatus === "Prepping" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      Prepping
                                    </button>
                                    <button
                                      disabled={ordStatus === "In Oven"}
                                      onClick={() => handleSetOrderStatus(ord.id, "In Oven")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ordStatus === "In Oven" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      In Oven
                                    </button>
                                    <button
                                      disabled={ordStatus === "Out for Delivery"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Out for Delivery")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ordStatus === "Out for Delivery" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      Out for Delivery
                                    </button>
                                    <button
                                      disabled={ordStatus === "Delivered"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Delivered")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ordStatus === "Delivered" 
                                          ? "bg-emerald-600/15 text-emerald-400 border-emerald-500/25 font-extrabold" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-emerald-400"
                                      }`}
                                    >
                                      Delivered ✓
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

                {/* TAB 5S: GLOBAL MENU CREATE MANAGEMENT (Admins Only) */}
                {userRole === "admin" && activeTab === "menus_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-menus-control-panel-grid">
                    
                    {/* Add/Edit Menu Item Form */}
                    <div className="xl:col-span-5 bg-[#121212] border border-neutral-850 p-6 space-y-4">
                      <div className="flex justify-between items-start border-b border-neutral-850 pb-2">
                        <div>
                          <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                            {editingItemId ? `📝 Edit Menu Item: ${editingItemId}` : "🍜 Create New Menu Item"}
                          </h2>
                          <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                            {editingItemId ? "Modify and update this gourmet dish parameters in real-time." : "Define a luxury gourmet dish from scratch. Auto-updates immediately on save."}
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
                                specs: "Contains premium native spices"
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
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Gourmet Food Name *</label>
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

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Image Cover URL *</label>
                          <input
                            type="url"
                            required
                            placeholder="https://images.unsplash.com/..."
                            value={newMenuData.image}
                            onChange={(e) => setNewMenuData(prev => ({ ...prev, image: e.target.value }))}
                            className="w-full bg-neutral-950 border border-neutral-850 p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-[9px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] text-neutral-400 uppercase tracking-widest block font-bold">Short Elegant Description</label>
                          <textarea
                            rows={3}
                            placeholder="State gourmet spices, flavors, textures..."
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

                        <button
                          type="submit"
                          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-widest uppercase transition-colors rounded-none cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{editingItemId ? "SAVE PRODUCT CHANGES" : "PUBLISH GOURMET ITEM"}</span>
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
                                    <img 
                                      src={item.image} 
                                      alt={item.name} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-xs font-bold text-white uppercase truncate max-w-[220px]">{item.name}</h4>
                                      <span className="text-[8px] font-mono text-neutral-500 uppercase bg-neutral-900 px-1 border border-neutral-850">
                                        {item.id}
                                      </span>
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
                                        specs: Array.isArray(item.specs) ? item.specs.join(", ") : (item.specs || "")
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

                {userRole === "admin" && activeTab === "categories_panel" && (
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

                {userRole === "admin" && activeTab === "images_panel" && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 text-left" id="dashboard-images-control">
                    {/* Add Image Form */}
                    <div className="xl:col-span-4 bg-[#121212] border border-neutral-850 p-6 space-y-4 font-mono">
                      <div>
                        <h2 className="text-xs font-mono font-bold tracking-widest text-amber-500 uppercase">
                          🖼️ Add Custom Image
                        </h2>
                        <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                          Optionally upload local device files (converted securely to base64) or enter any external web image URL. Adds immediate click-friendly shortcut presets to the menu item creator.
                        </p>
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
                                  (e.target as any).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800";
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
                    </div>

                    {/* Custom and static images display gallery */}
                    <div className="xl:col-span-8 bg-[#121212] border border-neutral-850 p-6 space-y-4">
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

                {userRole === "admin" && activeTab === "instagram_panel" && (
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

                {userRole === "admin" && activeTab === "opay_panel" && (
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
                        <span className="font-bold">Operational Scope Info:</span> We only operate in Lagos Island neighborhoods (Ikoyi, V.I., Lekki, Banana Island) and designated Mainland neighborhoods (Ikeja, Gbagada, etc.) to ensure rapid gourmet express delivery.
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

                {userRole === "admin" && activeTab === "analytics_panel" && (
                  <AdminAnalyticsPanel />
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
      </div>
    </div>
  );
}
