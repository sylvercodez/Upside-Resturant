import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import CartDrawer from "./components/CartDrawer";
import ReservationSection from "./components/ReservationSection";
import AboutAndReviews from "./components/AboutAndReviews";
import HomeReservation from "./components/HomeReservation";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import DedicatedMenu from "./components/DedicatedMenu";
import DedicatedExperience from "./components/DedicatedExperience";
import DedicatedDashboard from "./components/DedicatedDashboard";
import AuthModal from "./components/AuthModal";
import { CartItem } from "./types";
import { MenuItem, MENU_ITEMS, Category, CATEGORIES } from "./data/menu";
import { getBranding, auth, db } from "./firebase";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, onSnapshot } from "firebase/firestore";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [allCategories, setAllCategories] = useState<Category[]>(CATEGORIES);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");

  useEffect(() => {
    // Build real-time custom menu items observer
    const q = query(collection(db, "menus"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customMenus: MenuItem[] = [];
      snapshot.forEach((docSnap) => {
        customMenus.push({ id: docSnap.id, ...docSnap.data() } as MenuItem);
      });
      // Combine stable static MENU_ITEMS with retrieved custom menus, avoiding duplicates and deleted items
      const nonDeletedCustom = customMenus.filter(item => !(item as any).deleted);
      const deletedCustomIds = new Set(customMenus.filter(item => (item as any).deleted).map(item => item.id));
      
      const customIds = new Set(nonDeletedCustom.map(item => item.id));
      const filteredStatic = MENU_ITEMS.filter(item => !customIds.has(item.id) && !deletedCustomIds.has(item.id));
      setAllMenuItems([...filteredStatic, ...nonDeletedCustom]);
    }, (err) => {
      console.error("Menus loading snap error:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Build real-time custom categories observer
    const q = query(collection(db, "categories"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customCats: Category[] = [];
      snapshot.forEach((docSnap) => {
        customCats.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });
      // Combine stable static CATEGORIES with retrieved custom categories, avoiding duplicates and deleted items
      const nonDeletedCustom = customCats.filter(item => !(item as any).deleted);
      const deletedCustomIds = new Set(customCats.filter(item => (item as any).deleted).map(item => item.id));
      
      const customIds = new Set(nonDeletedCustom.map(item => item.id));
      const filteredStatic = CATEGORIES.filter(item => !customIds.has(item.id) && !deletedCustomIds.has(item.id));
      setAllCategories([...filteredStatic, ...nonDeletedCustom]);
    }, (err) => {
      console.error("Categories loading snap error:", err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const emailLower = (user.email || "").toLowerCase().trim();
        const isAdminEmail = emailLower === "tosinotenaike3@gmail.com" || emailLower === "tobi@gmail.com";
        const targetRole = isAdminEmail ? "admin" : "user";
        
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const currentRoleInDb = snap.data().role || "user";
            if (isAdminEmail && currentRoleInDb !== "admin") {
              // Auto-correct any legacy record that existed before setting role to admin
              try {
                await setDoc(userRef, { role: "admin" }, { merge: true });
              } catch (writeErr) {
                console.warn("Could not sync admin role to users collection:", writeErr);
              }
            }
            setUserRole(targetRole);
          } else {
            const initialProfile = {
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email?.split("@")[0] || "User",
              role: targetRole,
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, initialProfile);
            setUserRole(targetRole);
          }
        } catch (e) {
          console.error("Failed to map / sync user role with db, checking bootstrap:", e);
          setUserRole(targetRole);
        }
      } else {
        setUserRole("user");
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
    return "/";
  });

  const activeView = currentPath === "/menu" ? "menu" : (currentPath === "/experience" ? "experience" : (currentPath === "/dashboard" ? "dashboard" : "landing"));

  const handleNavigate = (path: string) => {
    window.history.pushState(null, "", path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

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

  const [isCartOpen, setIsCartOpen] = useState(false);
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

    // Automatically trigger cart slide-over on add to simulate modern app feedback
    setIsCartOpen(true);
  };

  // Direct upsell click adder helper
  const handleAddToCartDirect = (item: MenuItem) => {
    handleAddToCart(item);
  };

  // Reorder past items from VIP Order History into the active basket
  const handleReorder = (items: { name: string, quantity: number, price: number }[]) => {
    items.forEach((pastItem) => {
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
    setIsCartOpen(true);
  };

  // Track simulated order status by copying to localStorage and focusing tracker tab
  const handleTrackOrder = (order: any) => {
    localStorage.setItem("upside_active_order", JSON.stringify(order));
    setIsCartOpen(true);
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
    <div className="bg-black min-h-screen text-white select-none selection:bg-amber-500 selection:text-black antialiased">
      {/* Luxury Navigation Header */}
      <Header
        onOpenCart={() => setIsCartOpen(true)}
        onScrollToElement={handleScrollToElement}
        onOpenReservations={() => handleScrollToElement("home-reservation-section")}
        cartCount={cartTotalQuantity}
        favoritesCount={favorites.length}
        branding={branding}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onAuthClick={() => { setAuthModalMode("signin"); setIsAuthModalOpen(true); }}
        onLogout={handleLogout}
      />

      {/* Conditionally mount Active page context */}
      {activeView === "landing" && (
        <>
          {/* Cinematic Cover Showcase Hero Section */}
          <Hero
            onOrderNow={() => handleScrollToElement("menu-fast")}
            onExploreMenu={() => {
              handleNavigate("/menu");
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
            menuItems={allMenuItems}
            categories={allCategories}
          />

          {/* DETAILED BRAND LEGACY & LIVE EVENTS */}
          <AboutAndReviews
            onReadMoreExperience={() => {
               handleNavigate("/experience");
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
          menuItems={allMenuItems}
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
          onBackToLobby={() => {
            handleNavigate("/");
          }}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onAuthClick={() => { setAuthModalMode("signin"); setIsAuthModalOpen(true); }}
          onLogout={handleLogout}
          onTrackOrder={handleTrackOrder}
          onReorder={handleReorder}
          categories={allCategories}
        />
      )}

      {/* LUXURY COMPREHENSIVE FOOTER */}
      {activeView !== "dashboard" && (
        <Footer
          onScrollToElement={handleScrollToElement}
          onOpenReservations={() => handleScrollToElement("home-reservation-section")}
          branding={branding}
        />
      )}

      {/* MOBILE THUMB NAVIGATION CONTROLS */}
      <BottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReservations={() => handleScrollToElement("home-reservation-section")}
        onScrollToElement={handleScrollToElement}
        cartCount={cartTotalQuantity}
        favoritesCount={favorites.length}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onAuthClick={() => { setAuthModalMode("signin"); setIsAuthModalOpen(true); }}
      />

      {/* SLIDE-OVER CHECKOUT CART DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onAddToCartDirect={handleAddToCartDirect}
        currentUser={currentUser}
        onAuthClick={() => { setAuthModalMode("signin"); setIsAuthModalOpen(true); }}
        menuItems={allMenuItems}
      />

      {/* TABLE RESERVATION ALLOCATION DIALOG */}
      <ReservationSection
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />

      {/* COMPREHENSIVE AUTH DIALOG */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        currentUser={currentUser}
        onLogout={handleLogout}
        onTrackOrder={handleTrackOrder}
        onReorder={handleReorder}
      />
    </div>
  );
}
