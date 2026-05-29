import React, { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { MenuItem, MENU_ITEMS, CATEGORIES, Category } from "../data/menu";
import OrderHistory from "./OrderHistory";
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
  categories
}: DedicatedDashboardProps) {
  const finalMenuItems = menuItems || MENU_ITEMS;
  const displayCategories = categories || CATEGORIES;
  const isPrivileged = userRole === "admin" || userRole === "sales" || userRole === "chef";

  // State Tabs depending on profile roles
  const [activeTab, setActiveTab] = useState<string>("history");

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
      if (file.size > 1024 * 1024) {
        setNewImageFormError("File size is too large (max 1MB for Firestore). Please select a smaller or compressed image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
        setImageFormSuccess("Local image file converted to secure base64 successfully!");
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
    if (selectedOrderTab !== "all" && ord.status !== selectedOrderTab) return false;
    
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
    <div className="bg-[#0b0b0b] min-h-screen text-white pb-24" id="dedicated-dashboard-spa">
      {/* Visual Ambient Banner */}
      <div className="relative h-64 w-full overflow-hidden bg-neutral-900 border-b border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/40 to-black/60 z-10" />
        
        {/* Decorative image */}
        <img 
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80" 
          alt="Dining banner background" 
          className="w-full h-full object-cover scale-105 filter blur-xs"
        />

        {/* Back Link Overlay */}
        <div className="absolute top-10 left-6 md:left-12 z-20">
          <button
            onClick={onBackToLobby}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/85 border border-neutral-850 hover:border-amber-500/50 text-neutral-400 hover:text-amber-500 transition-all font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            id="dashboard-back-lobby-btn"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Menu</span>
          </button>
        </div>

        {/* User Identity Overlay */}
        <div className="absolute bottom-6 left-6 md:left-12 z-20 text-left">
          {currentUser && (
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.3em] text-amber-500 font-mono font-bold uppercase block">
                {userRole.toUpperCase()} OPERATIONS PORTAL
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold font-mono text-white tracking-wide uppercase">
                Welcome back, {currentUser.displayName || currentUser.email?.split("@")[0] || "Staff Member"}
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                {userRole === "admin" && "Total system clearance. You can manage user roles and add menu options dynamically."}
                {userRole === "sales" && "Review user orders, transition cook pipelines, and handle client dispatch stages."}
                {userRole === "chef" && "Elite kitchen monitor tracker. Review and update cooking preparations."}
                {userRole === "user" && "Manage your historical orders, active deliveries, and saved items in Lagos."}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-8 space-y-8">
        {currentUser ? (
          <>
            {/* Standard Account KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="account-metrics-dashboard-grid">
              
              {/* Metric 1 */}
              <div className="bg-[#121212] border border-neutral-850 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-850">
                  <UserIcon className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Profile Clearance</span>
                <span className="text-sm font-bold font-mono text-amber-500 uppercase mt-4 block">{userRole}</span>
                <span className="text-[9px] font-mono text-neutral-400 mt-1 block">Account authority level</span>
              </div>

              {/* Metric 2 */}
              <div className="bg-[#121212] border border-neutral-850 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-850">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Wishlist Bookmarks</span>
                <span className="text-2xl font-black font-mono text-white mt-4 block">{favorites.length} <span className="text-xs font-normal text-neutral-400">ITEM(S)</span></span>
                <span className="text-[9px] font-mono text-neutral-400 mt-1 block">Custom personal choices</span>
              </div>

              {/* Metric 3 */}
              <div className="bg-[#121212] border border-neutral-850 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-850">
                  <Utensils className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Preferred Taste</span>
                <span className="text-sm font-bold font-mono text-amber-500 uppercase truncate mt-4 block">{getFavCategory()}</span>
                <span className="text-[9px] font-mono text-neutral-400 mt-1 block">Most wishlisted category</span>
              </div>

              {/* Metric 4 */}
              <div className="bg-[#121212] border border-neutral-850 p-5 flex flex-col justify-between text-left relative overflow-hidden group transition-all">
                <div className="absolute top-4 right-4 text-neutral-850">
                  <Compass className="w-8 h-8" />
                </div>
                <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase block">Database Network</span>
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase mt-4 block">Connected Live</span>
                <span className="text-[9px] font-mono text-neutral-450 mt-1 block">Zero delay client syncs</span>
              </div>
            </div>

            {/* Core Workspace double-column containing dynamic tabs based on clearance levels */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Dynamic Interactive Panel Workspace */}
              <div className="lg:col-span-12 space-y-6">
                
                {/* Visual Premium Unified Tab Switcher Navigation */}
                <div className="flex flex-wrap gap-1 border-b border-neutral-850 bg-neutral-900/40 p-1 font-mono">
                  {/* Standard Tabs */}
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "history"
                        ? "bg-amber-600 text-white"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-[#151515]"
                    }`}
                  >
                    📜 My Orders ({userRole === "user" ? "Client" : "Personal"})
                  </button>
                  <button
                    onClick={() => setActiveTab("wishlist")}
                    className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "wishlist"
                        ? "bg-amber-600 text-white"
                        : "text-neutral-500 hover:text-neutral-300 hover:bg-[#151515]"
                    }`}
                  >
                    💖 Wishlist ({favorites.length})
                  </button>

                  {/* Privileged pipeline (Sales, Chef, Admin) */}
                  {isPrivileged && (
                    <button
                      onClick={() => setActiveTab("orders_pipeline")}
                      className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeTab === "orders_pipeline"
                          ? "bg-amber-600 text-white border-l-2 border-amber-400"
                          : "text-amber-500 hover:text-amber-400 hover:bg-amber-950/10"
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
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-[#151515]"
                        }`}
                      >
                        👥 User Directory ({allUsers.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("menus_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "menus_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-[#151515]"
                        }`}
                      >
                        🍜 Dynamic Menu Manager
                      </button>
                      <button
                        onClick={() => setActiveTab("categories_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "categories_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-[#151515]"
                        }`}
                      >
                        📂 Category Manager
                      </button>
                      <button
                        onClick={() => setActiveTab("images_panel")}
                        className={`px-6 py-3 text-xs tracking-wider uppercase font-bold text-center transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeTab === "images_panel"
                            ? "bg-amber-600 text-white"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-[#151515]"
                        }`}
                      >
                        🖼️ Image Library ({customImages.length + PRESET_IMAGES.length})
                      </button>
                    </>
                  )}
                </div>

                {/* TAB 1: USER ORDER HISTORY */}
                {activeTab === "history" && (
                  <div className="bg-[#121212] border border-neutral-850 p-6 space-y-4" id="dashboard-history-tab">
                    <OrderHistory 
                      onTrackClick={onTrackOrder}
                      onReorderClick={onReorder}
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
                                    {ord.status.toUpperCase()}
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
                                    {ord.items.map((it: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center bg-black/30 px-2 py-1 select-text">
                                        <span className="text-neutral-300">
                                          {it.quantity}x <span className="font-sans text-white">{it.name}</span>
                                        </span>
                                        <span className="text-neutral-400">₦{(it.price * it.quantity).toLocaleString()}</span>
                                      </div>
                                    ))}
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
                                      disabled={ord.status === "Prepping"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Prepping")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ord.status === "Prepping" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      Prepping
                                    </button>
                                    <button
                                      disabled={ord.status === "In Oven"}
                                      onClick={() => handleSetOrderStatus(ord.id, "In Oven")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ord.status === "In Oven" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      In Oven
                                    </button>
                                    <button
                                      disabled={ord.status === "Out for Delivery"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Out for Delivery")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ord.status === "Out for Delivery" 
                                          ? "bg-amber-600/15 text-amber-500 border-amber-500/20" 
                                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                                      }`}
                                    >
                                      Out for Delivery
                                    </button>
                                    <button
                                      disabled={ord.status === "Delivered"}
                                      onClick={() => handleSetOrderStatus(ord.id, "Delivered")}
                                      className={`py-1.5 px-2.5 text-center border cursor-pointer ${
                                        ord.status === "Delivered" 
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
                            <th className="p-3.5 text-center">Change Permission Level</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-850 select-text">
                          {filteredUsers.map((usr) => (
                            <tr key={usr.id} className="hover:bg-neutral-900/40 transition-colors">
                              <td className="p-3.5 font-sans font-semibold text-white">
                                {usr.displayName || "Anonymous Staff"}
                              </td>
                              <td className="p-3.5 text-neutral-300 font-mono">
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
                        {displayCategories.map((cat) => {
                          const isStatic = CATEGORIES.some(s => s.id === cat.id);
                          return (
                            <div key={cat.id} className="p-3.5 bg-neutral-950/60 border border-neutral-850 flex items-start justify-between gap-3">
                              <div className="text-left space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap text-left justify-start">
                                  <span className="text-xs font-bold font-mono text-white tracking-wide uppercase truncate">{cat.name}</span>
                                  <span className="text-[8px] font-mono text-amber-500 px-1 border border-amber-900/40 bg-amber-950/10">
                                    {cat.id}
                                  </span>
                                  {isStatic ? (
                                    <span className="text-[8px] font-mono text-neutral-500 uppercase">Static Core</span>
                                  ) : (
                                    <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold">Dynamic Custom</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">{cat.description}</p>
                                <p className="text-[9px] text-neutral-500 font-mono">Icon representation: <code className="text-amber-500 font-bold">{cat.icon || "Utensils"}</code></p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isStatic && (
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
                                <button
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="py-1 px-2 border border-red-900/40 text-red-400 hover:text-white text-[8px] font-mono uppercase bg-red-950/20 hover:bg-red-900 shrink-0"
                                >
                                  {isStatic ? "Hide (Disable)" : "Delete"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
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
