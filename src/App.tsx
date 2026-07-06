import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import CartDrawer from "./components/CartDrawer";
import ReservationSection from "./components/ReservationSection";
import AboutAndReviews from "./components/AboutAndReviews";
import ScanSection from "./components/ScanSection";
import HomeReservation from "./components/HomeReservation";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import DedicatedMenu from "./components/DedicatedMenu";
import DedicatedExperience from "./components/DedicatedExperience";
import DedicatedDashboard from "./components/DedicatedDashboard";
import DedicatedAuth from "./components/DedicatedAuth";
import DedicatedTrack from "./components/DedicatedTrack";
import DedicatedLegal from "./components/DedicatedLegal";
import DedicatedRiderDashboard from "./components/DedicatedRiderDashboard";
import SupportChatWidget from "./components/SupportChatWidget";
import TawkSupportWidget from "./components/TawkSupportWidget";
import AIChatbotWidget from "./components/AIChatbotWidget";
import { CartItem, ShippingLocation, LAGOS_AREAS, getApiUrl } from "./types";
import { MenuItem, MENU_ITEMS, Category, CATEGORIES } from "./data/menu";
import { getBranding, auth, db } from "./firebase";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, onSnapshot } from "firebase/firestore";
import { logCustomEvent } from "./utils/analytics";

export default function App() {
  const [isMySQLActive, setIsMySQLActive] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [userDisabled, setUserDisabled] = useState<boolean>(false);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [allCategories, setAllCategories] = useState<Category[]>(CATEGORIES);
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>(LAGOS_AREAS);

  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

// 1. MySQL connection status — check once, then every 5 minutes
useEffect(() => {
  const checkMySQL = async () => {
    try {
      const res = await fetch(getApiUrl("/api/mysql/status"));
      if (res.ok) {
        const data = await res.json();
        setIsMySQLActive(!!data.connected);
        if (data.connected) {
          console.log("MySQL active.");
        }
      } else {
        setIsMySQLActive(false);
      }
    } catch (_) {
      setIsMySQLActive(false);
    }
  };

  checkMySQL();

  // Only recheck every 5 minutes — not every 8 seconds
  const intv = setInterval(checkMySQL, 5 * 60 * 1000);
  return () => clearInterval(intv);
}, []);

  // 2. MySQL Auth Loader
  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("upside_mysql_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setCurrentUser(u);
          setUserRole(u.role || "user");
          setUserDisabled(!!u.disabled);
        } catch (_) {}
      }
    };

    if (isMySQLActive) {
      syncUser();
    }

    window.addEventListener("mysql-login", syncUser);
    return () => window.removeEventListener("mysql-login", syncUser);
  }, [isMySQLActive]);
// 3. MySQL Background Data Synchronization — fetch once only
const fetchMySQLData = async () => {
  if (!isMySQLActive) return;
  try {
    const [mRes, cRes, sRes] = await Promise.all([
      fetch(getApiUrl("/api/mysql/menus")),
      fetch(getApiUrl("/api/mysql/categories")),
      fetch(getApiUrl("/api/mysql/shipping-areas")),
    ]);

    if (mRes.ok) setAllMenuItems(await mRes.json());
    if (cRes.ok) setAllCategories(await cRes.json());
    if (sRes.ok) setShippingLocations(await sRes.json());
  } catch (err) {
    console.warn("MySQL sync error:", err);
  }
};

useEffect(() => {
  fetchMySQLData(); // run once, no interval
}, [isMySQLActive]);
  // Firebase listeners (only active if MySQL is not active)
  useEffect(() => {
    if (isMySQLActive) return;

    // Build real-time custom menu items observer
    const q = query(collection(db, "menus"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customMenus: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        customMenus.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
      });
      const nonDeletedCustom = customMenus.filter(item => !(item as any).deleted);
      const deletedCustomIds = new Set(customMenus.filter(item => (item as any).deleted).map(item => item.id));
      
      const customIds = new Set(nonDeletedCustom.map(item => item.id));
      const filteredStatic = MENU_ITEMS.filter(item => !customIds.has(item.id) && !deletedCustomIds.has(item.id));
      setAllMenuItems([...filteredStatic, ...nonDeletedCustom]);
    }, (err) => {
      console.error("Menus loading snap error:", err);
    });
    return () => unsubscribe();
  }, [isMySQLActive]);

  useEffect(() => {
    if (isMySQLActive) return;

    const q = query(collection(db, "categories"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customCats: Category[] = [];
      snapshot.forEach((docSnap) => {
        customCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      const nonDeletedCustom = customCats.filter(item => !(item as any).deleted);
      const deletedCustomIds = new Set(customCats.filter(item => (item as any).deleted).map(item => item.id));
      
      const customIds = new Set(nonDeletedCustom.map(item => item.id));
      const filteredStatic = CATEGORIES.filter(item => !customIds.has(item.id) && !deletedCustomIds.has(item.id));
      setAllCategories([...filteredStatic, ...nonDeletedCustom]);
    }, (err) => {
      console.error("Categories loading snap error:", err);
    });
    return () => unsubscribe();
  }, [isMySQLActive]);

  useEffect(() => {
    if (isMySQLActive) return;

    const q = query(collection(db, "shipping_areas"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customAreas: ShippingLocation[] = [];
      snapshot.forEach((docSnap) => {
        customAreas.push({ id: docSnap.id, ...docSnap.data() } as ShippingLocation);
      });
      
      const nonDeletedCustom = customAreas.filter(item => !item.deleted);
      const deletedCustomIds = new Set(customAreas.filter(item => item.deleted).map(item => item.id));
      
      const customIds = new Set(nonDeletedCustom.map(item => item.id));
      const filteredStatic = LAGOS_AREAS.filter(item => !customIds.has(item.id) && !deletedCustomIds.has(item.id));
      
      setShippingLocations([...filteredStatic, ...nonDeletedCustom]);
    }, (err) => {
      console.error("Shipping areas loading snap error:", err);
    });
    return () => unsubscribe();
  }, [isMySQLActive]);

  useEffect(() => {
    if (isMySQLActive) {
      // For active MySQL, session storage checks represent log in profile state
      const checkProfileSync = () => {
        const stored = localStorage.getItem("upside_mysql_user");
        if (stored) {
          try {
            const u = JSON.parse(stored);
            setCurrentUser(u);
            setUserRole(u.role || "user");
            setUserDisabled(!!u.disabled);
          } catch (_) {}
        } else {
          setCurrentUser(null);
          setUserRole("user");
          setUserDisabled(false);
        }
      };
      checkProfileSync();
      return;
    }

    let unsubUserDoc: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const emailLower = (user.email || "").toLowerCase().trim();
        const isAdminEmail = 
          emailLower === "hello@mophethonline.com" || 
          emailLower === "tobi@gmail.com" || 
          emailLower === "mophethecommerce@gmail.com" ||
          emailLower === "mophethecommerce3@gmail.com" ||
          emailLower.includes("mophethecommerce");
        const targetRole = isAdminEmail ? "admin" : "user";
        
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            const initialProfile = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email?.split("@")[0] || "User",
              role: targetRole,
              disabled: false,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, initialProfile);
          } else {
            const dbData = snap.data();
            if (isAdminEmail && dbData.role !== "admin") {
              await updateDoc(userRef, { role: "admin" });
            }
          }
        } catch (bootstrapErr) {
          console.warn("User bootstrap profile sync warning:", bootstrapErr);
        }

        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserRole(data.role || "user");
            setUserDisabled(!!data.disabled);
          } else {
            setUserRole(targetRole);
            setUserDisabled(false);
          }
        }, (err) => {
          console.error("User document live sync error:", err);
          setUserRole(targetRole);
        });
      } else {
        setUserRole("user");
        setUserDisabled(false);
        if (unsubUserDoc) {
          unsubUserDoc();
          unsubUserDoc = null;
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, [isMySQLActive]);

  const handleLogout = async () => {
    try {
      if (isMySQLActive) {
        localStorage.removeItem("upside_mysql_user");
        setCurrentUser(null);
        setUserRole("user");
        setUserDisabled(false);
      } else {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Sign out fail", err);
    }
  };

  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (hash === "#/menu" || path === "/menu") return "/menu";
    if (hash === "#/experience" || path === "/experience") return "/experience";
    if (hash === "#/dashboard" || path === "/dashboard") return "/dashboard";
    if (hash === "#/auth" || path === "/auth") return "/auth";
    if (hash === "#/cart" || path === "/cart") return "/cart";
    if (hash === "#/track" || path === "/track") return "/track";
    if (hash === "#/rider" || path === "/rider") return "/rider";
    if (hash === "#/terms" || path === "/terms") return "/terms";
    if (hash === "#/privacy" || path === "/privacy") return "/privacy";
    return "/";
  });

  const activeView = currentPath === "/menu" ? "menu" : (currentPath === "/experience" ? "experience" : (currentPath === "/dashboard" ? "dashboard" : (currentPath === "/auth" ? "auth" : (currentPath === "/cart" ? "cart" : (currentPath === "/track" ? "track" : (currentPath === "/rider" ? "rider" : (currentPath === "/terms" || currentPath === "/privacy" ? "legal" : "landing")))))));

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    logCustomEvent("page_view", { path: currentPath, view: activeView });
    if (activeView === "menu") {
      logCustomEvent("menu_view");
    }
  }, [currentPath, activeView]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (hash === "#/menu" || path === "/menu") {
        setCurrentPath("/menu");
      } else if (hash === "#/experience" || path === "/experience") {
        setCurrentPath("/experience");
      } else if (hash === "#/dashboard" || path === "/dashboard") {
        setCurrentPath("/dashboard");
      } else if (hash === "#/auth" || path === "/auth") {
        setCurrentPath("/auth");
      } else if (hash === "#/cart" || path === "/cart") {
        setCurrentPath("/cart");
      } else if (hash === "#/track" || path === "/track") {
        setCurrentPath("/track");
      } else if (hash === "#/rider" || path === "/rider") {
        setCurrentPath("/rider");
      } else if (hash === "#/terms" || path === "/terms") {
        setCurrentPath("/terms");
      } else if (hash === "#/privacy" || path === "/privacy") {
        setCurrentPath("/privacy");
      } else {
        setCurrentPath("/");
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", handlePopState);
    };
  }, []);

  const [branding, setBranding] = useState<{
    logoSvg: string;
    brandName: string;
    tagline: string;
    subText: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getBranding().then((data) => {
      if (isMounted && data) {
        setBranding({
          logoSvg: data.logoSvg || "",
          brandName: data.brandName || "UPSIDE",
          tagline: data.tagline || "RESTAURANT & CAFÉ",
          subText: data.subText || "A Brand of Mopheth",
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  // Global React Persistent Storage with fallback initialization
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("upside_cart_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("upside_favorites_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(() => {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).has("opay_ref");
  });
  const [isReservationOpen, setIsReservationOpen] = useState(false);

  // Sync state modifications safely with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("upside_cart_v1", JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Storage syncing error", e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem("upside_favorites_v1", JSON.stringify(favorites));
    } catch (e) {
      console.warn("Storage syncing error", e);
    }
  }, [favorites]);

  // Detect returning OPay reference callback triggers
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const opayRef = params.get("opay_ref");
      if (opayRef) {
        console.log("[UPSIDE FLOW] Caught return OPay URL reference parameter:", opayRef);
        // Clean sweep cart items
        setCartItems([]);
        // Slide open the cart drawer to exhibit order success summary directly
        setIsCartOpen(true);
      }
    } catch (err) {
      console.warn("OPay redirect catcher crash inside App:", err);
    }
  }, []);

  // SCROLL ANCHORING MECHANISMS
  const handleScrollToElement = (elementId: string) => {
    if (currentPath !== "/") {
      handleNavigate("/");
    }
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        // Offset for sticky navigation headers
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 150);
  };

  // ADD TO CART WITH MULTIPLE CHOSEN VARIANTS & SIDES OR NOTES
  const handleAddToCart = (item: MenuItem, variant?: string, extras?: string[], notes?: string) => {
    setCartItems((prev) => {
      // Find matching index where Id AND selected variant match exactly
      const existingIdx = prev.findIndex(
        (c) => c.itemId === item.id && c.selectedVariant === variant
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        // Merge notes or extras if present
        if (notes) updated[existingIdx].notes = `${updated[existingIdx].notes || ""} | ${notes}`;
        return updated;
      } else {
        return [
          ...prev,
          {
            itemId: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1,
            selectedVariant: variant,
            selectedExtras: extras,
            notes: notes
          }
        ];
      }
    });

    // Automatically navigate to standalone cart page on add to simulate modern app feedback
    handleNavigate("/cart");
  };

  // Direct upsell click adder helper
  const handleAddToCartDirect = (item: MenuItem) => {
    handleAddToCart(item);
  };

  // Reorder past items from Order History into the active basket
  const handleReorder = (itemsInput: any) => {
    let items: any[] = [];
    if (Array.isArray(itemsInput)) {
      items = itemsInput;
    } else if (itemsInput && typeof itemsInput === "object") {
      items = Object.values(itemsInput);
    } else if (typeof itemsInput === "string") {
      try {
        const parsed = JSON.parse(itemsInput);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && typeof parsed === "object") {
          items = Object.values(parsed);
        }
      } catch {
        items = [];
      }
    }

    items.forEach((pastItem: any) => {
      if (!pastItem || !pastItem.name) return;
      const menuItem = MENU_ITEMS.find((m) => m.name.toLowerCase() === pastItem.name.toLowerCase());
      if (menuItem) {
        setCartItems((prev) => {
          const existingIdx = prev.findIndex((c) => c.itemId === menuItem.id);
          if (existingIdx > -1) {
            const updated = [...prev];
            updated[existingIdx].quantity += pastItem.quantity;
            return updated;
          } else {
            return [
              ...prev,
              {
                itemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                image: menuItem.image,
                quantity: pastItem.quantity,
              }
            ];
          }
        });
      }
    });
    handleNavigate("/cart");
  };

  // Track simulated order status by copying to localStorage and focusing tracker tab
  const handleTrackOrder = async (order: any) => {
    if (!order) return;

    // Detect if order uses OPay (either checked out via OPay, or type is opay explicitly)
    const isOpay = order.paymentMethod === "opay" || order.paymentMethod === "OPay" || order.type === "opay";

    if (isOpay && order.id) {
      try {
        console.log("[handleTrackOrder] Initiating robust payment verification check for:", order.id);
        const response = await fetch(getApiUrl("/api/opay/verify-payment"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reference: order.id })
        });
        
        let data: any;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          let excerpt = text.trim();
          if (excerpt.includes("<pre>")) {
            const preMatch = excerpt.match(/<pre>([\s\S]*?)<\/pre>/i);
            if (preMatch && preMatch[1]) {
              excerpt = preMatch[1].trim();
            }
          } else if (excerpt.includes("<title>")) {
            const titleMatch = excerpt.match(/<title>([\s\S]*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
              excerpt = `Page Title: ${titleMatch[1].trim()}`;
            }
          }
          if (excerpt.length > 350) {
            excerpt = excerpt.substring(0, 350) + "...";
          }
          throw new Error(`Server returned non-JSON error (status ${response.status}). Diagnostic details: ${excerpt || "No response body returned."}`);
        }
        
        if (!response.ok) {
          throw new Error(data.error || "Unable to reach OPay verification API");
        }
        
        console.log("[handleTrackOrder] OPay verification API response:", data);

        // Check if status returned is PAID / SUCCESS / payment_successful
        if (data.paymentStatus === "PAID" || data.paymentStatus === "SUCCESS" || data.paymentStatus === "payment_successful") {
          const verifiedOrderPayload = {
            id: order.id,
            userId: order.userId || auth.currentUser?.uid || "guest",
            customerName: order.customerName || "Vanguard Guest",
            email: order.email || "guest@example.com",
            phone: order.phone || "",
            totalPrice: order.totalPrice || 0,
            items: order.items || [],
            address: order.address || "Boutique Self-Pickup",
            status: order.status || "Prepping",
            timestamp: order.timestamp || Date.now(),
            type: order.type || "delivery",
            paymentStatus: "payment_successful",
            orderStatus: "payment_successful",
            updatedAt: new Date().toISOString()
          };

          try {
            await setDoc(doc(db, "orders", order.id), verifiedOrderPayload);
            console.log("[handleTrackOrder] Successfully verified & wrote order to 'orders' collection:", order.id);
          } catch (dbErr) {
            console.error("Failed to commit verified order to Firestore:", dbErr);
          }

          localStorage.setItem("upside_active_order", JSON.stringify(verifiedOrderPayload));
          handleNavigate("/dashboard");
        } else {
          // Block the track operation and notify the user about unsuccessful payment status
          setToast({
            message: `Unable to track order: OPay payment status is non-successful ("${data.paymentStatus || 'PENDING'}"). Only successfully paid orders can be tracked.`,
            type: "error"
          });
          console.warn(`[handleTrackOrder] Order tracking blocked for ref ${order.id}. Non-successful payment status:`, data.paymentStatus);
        }
      } catch (err: any) {
        console.error("OPay payment track validation failed:", err);
        setToast({
          message: `Payment validation check error: ${err.message || 'Verification system offline. Please retry.'}`,
          type: "error"
        });
      }
    } else {
      // For standard orders / non-OPay checkouts, track normally
      localStorage.setItem("upside_active_order", JSON.stringify(order));
      handleNavigate("/dashboard");
    }
  };

  // MANAGE ORDER QUANTITIES
  const handleUpdateQuantity = (itemId: string, qty: number, variant?: string) => {
    setCartItems((prev) => {
      if (qty <= 0) {
        return prev.filter((c) => !(c.itemId === itemId && c.selectedVariant === variant));
      }
      return prev.map((c) =>
        c.itemId === itemId && c.selectedVariant === variant ? { ...c, quantity: qty } : c
      );
    });
  };

  const handleRemoveItem = (itemId: string, variant?: string) => {
    setCartItems((prev) =>
      prev.filter((c) => !(c.itemId === itemId && c.selectedVariant === variant))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // FAVORITES LIKES BOOKMARKS TOGGLER
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Calculate distinct counts
  const cartTotalQuantity = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="bg-black min-h-screen text-white select-none selection:bg-amber-500 selection:text-black antialiased ">
      {/* Luxury Navigation Header */}
      {activeView !== "rider" && (
        <Header
          onOpenCart={() => handleNavigate("/cart")}
          onScrollToElement={handleScrollToElement}
          onOpenReservations={() => handleScrollToElement("home-reservation-section")}
          cartCount={cartTotalQuantity}
          favoritesCount={favorites.length}
          branding={branding}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onAuthClick={() => handleNavigate("/auth")}
          onLogout={handleLogout}
        />
      )}

      {/* Conditionally mount Active page context */}
      {activeView === "landing" && (
        <>
          {/* Cinematic Cover Showcase Hero Section */}
          <Hero
            onOrderNow={() => handleScrollToElement("menu-fast")}
            onExploreMenu={() => {
              handleScrollToElement("qr-ordering-section");
            }}
            onBookTable={() => handleScrollToElement("home-reservation-section")}
            onAddToCart={handleAddToCart}
          />

          {/* FAST INSTANT MENU & CULINARY PLATFORM */}
          <MenuSection
            onAddToCart={handleAddToCart}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onViewAllMenu={() => {
              handleNavigate("/menu");
            }}
            menuItems={allMenuItems.filter(item => item.available !== false)}
            categories={allCategories}
          />

          {/* INSTANT PHONE ORDERING QR CODE SCAN SECTION */}
          <ScanSection
            onViewMenu={() => {
              handleNavigate("/menu");
            }}
          />

          {/* DETAILED BRAND LEGACY & LIVE EVENTS */}
          <AboutAndReviews
            onReadMoreExperience={() => {
               handleNavigate("/experience");
            }}
            onViewMenu={() => {
               handleNavigate("/menu");
            }}
          />

          {/* INLINE DIGITAL TABLE RESERVATION FORM */}
          <HomeReservation />
        </>
      )}

      {activeView === "menu" && (
        <DedicatedMenu
          onBackToLobby={() => {
            handleNavigate("/");
          }}
          onAddToCart={handleAddToCart}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          menuItems={allMenuItems.filter(item => item.available !== false)}
          categories={allCategories}
        />
      )}

      {activeView === "experience" && (
        <DedicatedExperience
          onBackToLobby={() => {
            handleNavigate("/");
          }}
          onOpenReservations={() => handleScrollToElement("home-reservation-section")}
        />
      )}

      {activeView === "dashboard" && (
        <DedicatedDashboard
          currentUser={currentUser}
          userRole={userRole}
          menuItems={allMenuItems}
          isMySQLActive={isMySQLActive}
          onRefreshMySQLData={fetchMySQLData}
          onBackToLobby={() => {
            handleNavigate("/");
          }}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onAuthClick={() => handleNavigate("/auth")}
          onLogout={handleLogout}
          onTrackOrder={handleTrackOrder}
          onReorder={handleReorder}
          categories={allCategories}
          shippingLocations={shippingLocations}
        />
      )}

      {activeView === "auth" && (
        <DedicatedAuth
          currentUser={currentUser}
          onBackToLobby={() => handleNavigate("/")}
          onNavigate={handleNavigate}
        />
      )}

      {activeView === "cart" && (
        <div className="bg-neutral-50 min-h-screen pt-28 pb-12 px-4 text-neutral-900 font-sans" id="dedicated-cart-page">
          <CartDrawer
            isOpen={true}
            onClose={() => handleNavigate("/")}
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onAddToCartDirect={handleAddToCartDirect}
            currentUser={currentUser}
            onAuthClick={() => handleNavigate("/auth")}
            menuItems={allMenuItems}
            isPage={true}
            shippingLocations={shippingLocations}
            isMySQLActive={isMySQLActive}
          />
        </div>
      )}

      {activeView === "track" && (
        <DedicatedTrack
          onBackToLobby={() => handleNavigate("/")}
        />
      )}

      {activeView === "legal" && (
        <DedicatedLegal
          onBackToLobby={() => handleNavigate("/")}
          initialTab={currentPath === "/privacy" ? "privacy" : "terms"}
        />
      )}

      {activeView === "rider" && (
        <DedicatedRiderDashboard />
      )}

      {/* LUXURY COMPREHENSIVE FOOTER */}
      {activeView !== "dashboard" && activeView !== "auth" && activeView !== "cart" && activeView !== "rider" && (
        <Footer
          onScrollToElement={handleScrollToElement}
          onOpenReservations={() => handleScrollToElement("home-reservation-section")}
          branding={branding}
          onNavigate={handleNavigate}
        />
      )}

      {/* MOBILE THUMB NAVIGATION CONTROLS */}
      {activeView !== "rider" && (
        <BottomNav
          onOpenCart={() => handleNavigate("/cart")}
          onOpenReservations={() => handleScrollToElement("home-reservation-section")}
          onScrollToElement={handleScrollToElement}
          cartCount={cartTotalQuantity}
          favoritesCount={favorites.length}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          onAuthClick={() => handleNavigate("/auth")}
        />
      )}

      {/* USER DISABLED GATEWAY BLOCK */}
      {userDisabled && (
        <div className="fixed inset-0 bg-neutral-950 z-[9999] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="max-w-md bg-neutral-900 border border-red-500/30 p-8 md:p-10 space-y-6 shadow-2xl relative">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-955/40 border border-red-500/50 flex items-center justify-center text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12-5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl md:text-2xl font-sans font-bold tracking-tight text-red-400">Profile Suspended</h1>
              <p className="text-xs md:text-sm text-neutral-400 font-mono leading-relaxed">
                Your Upside restaurant guest profile or partner dashboard credentials have been disabled by system security administrators.
              </p>
            </div>

            <div className="border-t border-neutral-800 pt-6 space-y-3">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer shadow"
              >
                Sign Out Account
              </button>
              <p className="text-[10px] text-neutral-500 font-mono">
                Session ID block ID: {currentUser?.uid.substring(0,8)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TABLE RESERVATION ALLOCATION DIALOG */}
      <ReservationSection
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />

      {/* Dynamic Luxury System Alert / Webhook Response Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-4 md:right-8 z-[10000] max-w-sm md:max-w-md w-[calc(100vw-2rem)] bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded shadow-2xl p-4 font-sans text-left"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full ${
                toast.type === "error" ? "bg-red-955/40 border border-red-500/30 text-red-400" :
                toast.type === "success" ? "bg-emerald-955/40 border border-emerald-500/30 text-emerald-400" :
                "bg-amber-955/40 border border-amber-500/30 text-amber-400"
              }`}>
                {toast.type === "error" ? (
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : toast.type === "success" ? (
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-neutral-200">
                  {toast.type === "error" ? "OPay / OTP Gateway Notice" : "System Notification"}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                  {toast.message}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">Upside Restaurant Diagnostics</span>
                </div>
              </div>

              <button
                onClick={() => setToast(null)}
                className="text-neutral-500 hover:text-neutral-300 font-bold transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Live Helpdesk Support Chat widget */}
      {activeView !== "rider" && (
        <>
          <SupportChatWidget currentUser={currentUser} />
          <TawkSupportWidget />
          <AIChatbotWidget />
        </>
      )}

    </div>
  );
}
