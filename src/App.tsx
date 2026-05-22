import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import CartDrawer from "./components/CartDrawer";
import ReservationSection from "./components/ReservationSection";
import AboutAndReviews from "./components/AboutAndReviews";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import DedicatedMenu from "./components/DedicatedMenu";
import DedicatedExperience from "./components/DedicatedExperience";
import { CartItem } from "./types";
import { MenuItem } from "./data/menu";

export default function App() {
  const [activeView, setActiveView] = useState<"landing" | "menu" | "experience">("landing");
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
    setActiveView("landing");
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
    }, 100);
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
        onOpenReservations={() => setIsReservationOpen(true)}
        cartCount={cartTotalQuantity}
        favoritesCount={favorites.length}
      />

      {/* Conditionally mount Active page context */}
      {activeView === "landing" && (
        <>
          {/* Cinematic Cover Showcase Hero Section */}
          <Hero
            onOrderNow={() => handleScrollToElement("menu-fast")}
            onExploreMenu={() => handleScrollToElement("menu-fast")}
            onBookTable={() => setIsReservationOpen(true)}
          />

          {/* FAST INSTANT MENU & CULINARY PLATFORM */}
          <MenuSection
            onAddToCart={handleAddToCart}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onViewAllMenu={() => {
              window.scrollTo({ top: 0 });
              setActiveView("menu");
            }}
          />

          {/* DETAILED BRAND LEGACY & LIVE EVENTS */}
          <AboutAndReviews
            onReadMoreExperience={() => {
              window.scrollTo({ top: 0 });
              setActiveView("experience");
            }}
          />
        </>
      )}

      {activeView === "menu" && (
        <DedicatedMenu
          onBackToLobby={() => {
            window.scrollTo({ top: 0 });
            setActiveView("landing");
          }}
          onAddToCart={handleAddToCart}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {activeView === "experience" && (
        <DedicatedExperience
          onBackToLobby={() => {
            window.scrollTo({ top: 0 });
            setActiveView("landing");
          }}
          onOpenReservations={() => setIsReservationOpen(true)}
        />
      )}

      {/* LUXURY COMPREHENSIVE FOOTER */}
      <Footer
        onScrollToElement={handleScrollToElement}
        onOpenReservations={() => setIsReservationOpen(true)}
      />

      {/* MOBILE THUMB NAVIGATION CONTROLS */}
      <BottomNav
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReservations={() => setIsReservationOpen(true)}
        onScrollToElement={handleScrollToElement}
        cartCount={cartTotalQuantity}
        favoritesCount={favorites.length}
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
      />

      {/* TABLE RESERVATION ALLOCATION DIALOG */}
      <ReservationSection
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
      />
    </div>
  );
}
