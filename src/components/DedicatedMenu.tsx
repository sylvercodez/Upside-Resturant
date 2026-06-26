import React, { useState, useRef } from "react";
import { Search, Heart, ShoppingBag, Check, Plus, Minus, ArrowLeft, Grid, Sparkles, Filter, Ticket } from "lucide-react";
import { CATEGORIES, MENU_ITEMS, MenuItem, Category } from "../data/menu";

interface DedicatedMenuProps {
  onBackToLobby: () => void;
  onAddToCart: (item: MenuItem, variant?: string, extras?: string[], notes?: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  menuItems?: MenuItem[];
  categories?: Category[];
}

export default function DedicatedMenu({
  onBackToLobby,
  onAddToCart,
  favorites,
  onToggleFavorite,
  menuItems,
  categories
}: DedicatedMenuProps) {
  const finalMenuItems = menuItems || MENU_ITEMS;
  const displayCategories = (categories || CATEGORIES).filter(c => !(c as any).disabled);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  // Variant/Option config
  const [chosenVariant, setChosenVariant] = useState<string>("");
  const [chosenExtras, setChosenExtras] = useState<string[]>([]);
  const [customItemNotes, setCustomItemNotes] = useState<string>("");

  // Get all unique tags from MENU_ITEMS
  const allTags = ["all", ...Array.from(new Set(finalMenuItems.flatMap(item => item.tags || [])))];

  // Filter items safely
  const getFilteredItems = () => {
    let list = finalMenuItems;

    // Filter out any items whose category is disabled
    const disabledCategoryIds = new Set((categories || CATEGORIES).filter(c => (c as any).disabled).map(c => c.id));
    list = list.filter(item => !disabledCategoryIds.has(item.category));

    // Filter by general category
    if (selectedCategory !== "all") {
      list = list.filter((item) => item.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== "all") {
      list = list.filter((item) => item.tags?.includes(selectedTag));
    }

    // Search query match
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      );
    }

    return list;
  };

  const filteredItems = getFilteredItems();

  const handleOpenItemDetails = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setCustomItemNotes("");

    if (item.category === "grills" || item.id.includes("steak") || item.id.includes("salmon")) {
      setChosenVariant("Medium Well Done");
    } else if (item.category === "breakfast" || item.id.includes("breakfast")) {
      setChosenVariant("Scrambled Eggs");
    } else if (item.category === "pasta" || item.id.includes("pasta")) {
      setChosenVariant("Authentic Tomato Base");
    } else if (item.category === "coffee" || item.id.includes("latte") || item.id.includes("cappuccino")) {
      setChosenVariant("Whole Milk");
    } else {
      setChosenVariant("");
    }

    setChosenExtras([]);
  };

  const handleToggleExtra = (extra: string) => {
    if (chosenExtras.includes(extra)) {
      setChosenExtras(chosenExtras.filter((e) => e !== extra));
    } else {
      setChosenExtras([...chosenExtras, extra]);
    }
  };

  const handleConfirmAddToCart = () => {
    if (selectedItemForModal) {
      onAddToCart(selectedItemForModal, chosenVariant || undefined, chosenExtras, customItemNotes);
      setSelectedItemForModal(null);
    }
  };

  const handleQuickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let val: string | undefined = undefined;
    if (item.category === "grills") val = "Medium Well Done";
    if (item.category === "breakfast") val = "Scrambled Eggs";
    if (item.category === "coffee") val = "Whole Milk";

    onAddToCart(item, val, [], "");
  };

  const renderItemOptions = (item: MenuItem) => {
    if (item.category === "grills" || item.id.includes("steak") || item.id.includes("salmon")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Steak Temperature / Preference</label>
          <div className="grid grid-cols-2 gap-2">
            {["Medium Rare", "Medium", "Medium Well Done", "Fully Cooked / Well Done"].map((temp) => (
              <button
                key={temp}
                onClick={() => setChosenVariant(temp)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  chosenVariant === temp ? "border-amber-600 bg-amber-500/10 text-amber-700" : "border-neutral-200 text-neutral-700"
                }`}
              >
                {temp}
              </button>
            ))}
          </div>

          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider block mt-4">Choice of Included Side</label>
          <div className="grid grid-cols-2 gap-2">
            {["Mashed Potato", "Sweet Yam Fries", "Roasted Potato", "Native Steamed Rice"].map((side) => (
              <button
                key={side}
                onClick={() => setCustomItemNotes(`Included Side: ${side}`)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  customItemNotes.includes(side) ? "border-amber-600 bg-amber-500/10 text-amber-700" : "border-neutral-200 text-neutral-700"
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.category === "breakfast" || item.id.includes("breakfast")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">How would you like your eggs?</label>
          <div className="grid grid-cols-2 gap-2">
            {["Scrambled", "Sunny Side Up", "Well Fried / Over Easy", "Soft Eggs"].map((eggStyle) => (
              <button
                key={eggStyle}
                onClick={() => setChosenVariant(eggStyle)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider ${
                  chosenVariant === eggStyle ? "border-amber-600 bg-amber-500/10 text-amber-700" : "border-neutral-200 text-neutral-700"
                }`}
              >
                {eggStyle}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (item.category === "coffee" || item.id.includes("latte") || item.id.includes("cappuccino")) {
      return (
        <div className="space-y-3">
          <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Select Milk Base</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Whole Milk", price: 0 },
              { name: "Almond Milk", price: 1000 },
              { name: "Oat Milk", price: 1000 },
              { name: "Soy Milk", price: 800 }
            ].map((milkObj) => (
              <button
                key={milkObj.name}
                onClick={() => setChosenVariant(milkObj.name)}
                className={`px-3 py-2 border text-[11px] font-mono tracking-wider text-left flex justify-between items-center ${
                  chosenVariant === milkObj.name ? "border-amber-600 bg-amber-500/10 text-amber-700" : "border-neutral-200 text-neutral-700"
                }`}
              >
                <span>{milkObj.name}</span>
                {milkObj.price > 0 && <span className="text-neutral-500">+₦{milkObj.price.toLocaleString()}</span>}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider">Special Culinary Instructions</label>
        <textarea
          value={customItemNotes}
          onChange={(e) => setCustomItemNotes(e.target.value)}
          placeholder="E.g., No onions, specify spicy levels, or customize toppings..."
          className="w-full bg-neutral-50 border border-neutral-200 p-3 text-xs text-black placeholder-neutral-400 focus:outline-none focus:border-amber-500 h-24 font-mono"
        />
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen pt-12 pb-24 px-4 md:px-8 animate-fadeIn text-black" id="dedicated-menu-page">
      <div className="max-w-[1800px] mx-auto space-y-12">
        
        {/* Navigation Breadcrumb / Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <button
            onClick={onBackToLobby}
            className="group flex items-center gap-2 text-neutral-600 hover:text-amber-600 transition-colors text-xs font-mono uppercase tracking-widest cursor-pointer self-start"
            id="menu-back-to-lobby-btn"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>&larr; Back to Sanctum Lobby</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
            <span>UPSIDE LOBBY</span>
            <span>/</span>
            <span className="text-amber-600">COMPLETE CULINARY CATALOG</span>
          </div>
        </div>

        {/* Cinematic Header */}
        <div className="text-center space-y-3 py-6 relative overflow-hidden bg-neutral-50 border border-neutral-200 p-8">
          <div className="absolute top-2 right-2 animate-pulse text-neutral-300 pointer-events-none uppercase tracking-widest text-[9px] font-mono">
            UP-DIGITAL-CATALOG
          </div>
          <span className="text-xs tracking-[0.4em] font-mono text-amber-600 uppercase block">
            THE EPICUREAN REGISTRY
          </span>
          <h1 className="text-4xl md:text-6xl font-sans font-light tracking-tight text-neutral-900 uppercase">
            Curated <span className="font-serif italic text-amber-600 font-medium lowercase">Boutique</span> Catalog
          </h1>
          <p className="text-xs text-neutral-600 max-w-xl mx-auto font-mono leading-relaxed">
            Browse through our entire selection of micro-batch roasted single origins, woodfired doughs, prime-grade tenderloins, and late-night curated mixology cocktails. Crafted with immaculate dedication in Lagos.
          </p>
        </div>

        {/* Category Selection Sidebar + Ultimate Items Showcase Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Categories Navigation Tab Deck */}
          <div className="lg:col-span-3 bg-neutral-50 p-3 lg:p-4 border border-neutral-200 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible lg:space-y-2 gap-2 scrollbar-none w-full lg:sticky lg:top-24" id="menu-categories-track">
            <h4 className="hidden lg:flex text-xs uppercase font-mono tracking-wider text-amber-600 font-semibold mb-4 items-center gap-2 border-b border-neutral-200 pb-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Categories</span>
            </h4>
            
            <button
              onClick={() => { setSelectedCategory("all"); }}
              className={`text-left px-3.5 py-2.5 lg:px-4 lg:py-3 text-[10px] lg:text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-between gap-2.5 border shrink-0 whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-black text-white font-bold border-transparent"
                  : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:text-black"
              }`}
            >
              <span>[ ] All Entries</span>
              <span className="text-[9px] lg:text-[10px] font-bold bg-neutral-100 text-black px-1.5 py-0.5 leading-none">{finalMenuItems.length}</span>
            </button>

            {displayCategories.filter(c => c.id !== "best-sellers").map((cat) => {
              const isActive = selectedCategory === cat.id;
              const categoryItemsCount = finalMenuItems.filter(it => it.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  className={`text-left px-3.5 py-2.5 lg:px-4 lg:py-3 text-[10px] lg:text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-between gap-2.5 border shrink-0 whitespace-nowrap ${
                    isActive
                      ? "bg-black text-white font-bold border-transparent shadow-md"
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:text-black"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 leading-none ${isActive ? "bg-amber-500 text-black" : "bg-neutral-105 text-neutral-500"}`}>
                    {categoryItemsCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Results Header & Gorgeous Matrix Grid of Culinary Treats */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Banner of Active Filters */}
            <div className="bg-neutral-50 border-l border-amber-500 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-neutral-600 border border-neutral-200">
              <div>
                Showing <strong className="text-black">{filteredItems.length}</strong> luxurious entries listed under{" "}
                <strong className="text-amber-600">
                  {selectedCategory === "all" ? "All Products" : displayCategories.find(c => c.id === selectedCategory)?.name}
                </strong>
              </div>
              
              <button
                onClick={() => { setSelectedCategory("all"); }}
                className="text-[10px] underline text-neutral-500 hover:text-neutral-900 uppercase font-bold"
              >
                Reset Category
              </button>
            </div>

            {/* Grid Box */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-neutral-250 bg-neutral-50">
                <p className="text-sm font-mono text-neutral-500">No match found within our luxury pantry.</p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mt-2 leading-relaxed">
                  Try clearing the category filter to browse the entire collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="menu-dedicated-grid">
                {filteredItems.map((item) => {
                  const isLiked = favorites.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItemDetails(item)}
                      className="group border border-neutral-200 bg-white hover:bg-neutral-50 transition-all duration-300 p-4.5 relative flex flex-col justify-between cursor-pointer"
                    >
                      {/* Image Frame */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-50 mb-4 border border-neutral-200">
                        {/* Absolute Badge tags */}
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                          {item.tags?.map((tg, i) => (
                            <span
                              key={i}
                              className="bg-black/90 text-amber-400 text-[8px] font-mono tracking-widest uppercase px-2 py-0.5 border border-amber-500/20 shadow"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>

                        {/* Absolute Like/Favorite Trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(item.id);
                          }}
                          className="absolute top-2.5 right-2.5 z-10 p-2 bg-white/80 hover:bg-neutral-100 text-neutral-500 hover:text-rose-500 rounded-full transition-colors cursor-pointer border border-neutral-100"
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>

                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-705 opacity-100"
                          loading="lazy"
                        />
                      </div>

                      {/* Content Box */}
                      <div className="space-y-2 flex-grow">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm text-neutral-900 font-sans tracking-tight font-medium group-hover:text-amber-600 transition-colors uppercase">
                            {item.name}
                          </h4>
                        </div>
                        
                        <span className="text-xs font-semibold text-amber-600 font-mono tracking-wider block">
                          ₦{item.price.toLocaleString()}
                        </span>

                        <p className="text-[11px] text-neutral-600 leading-relaxed font-mono font-light">
                          {item.description}
                        </p>
                      </div>

                      {/* Detail triggers */}
                      <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-neutral-200">
                        <span className="text-[9px] text-neutral-400 font-mono tracking-widest uppercase">
                          {item.category.replace("-", " ")}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-amber-600 font-mono hidden sm:inline">
                            Add to Bag +
                          </span>
                          <button
                            onClick={(e) => handleQuickAdd(item, e)}
                            title="Quick Add"
                            className="p-1.5 bg-neutral-100 border border-neutral-200 text-neutral-800 hover:bg-black hover:text-white transition-all rounded-none cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CULINARY VARIATION & EXTRAS DIALOG (MODAL) */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-neutral-200 w-full max-w-lg overflow-y-auto max-h-[95vh] rounded-none shadow-2xl text-black">
            {/* Header banner */}
            <div className="relative h-48 bg-black">
              <img
                src={selectedItemForModal.image}
                alt={selectedItemForModal.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="absolute top-4 right-4 bg-black/80 p-2 text-white hover:text-amber-400 rounded-full cursor-pointer"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <span className="bg-amber-500 text-black text-[9px] font-mono tracking-widest uppercase px-2.5 py-0.5 font-bold">
                  {selectedItemForModal.category.replace("-", " ")}
                </span>
                <h3 className="text-xl md:text-2xl text-white font-serif mt-1.5">{selectedItemForModal.name}</h3>
              </div>
            </div>

            {/* Form details */}
            <div className="p-6 space-y-6 text-left bg-white">
              <div className="flex justify-between items-center bg-amber-50 p-4 border border-amber-200/50">
                <span className="text-xs uppercase font-mono text-neutral-700 font-bold">Base Premium Pricing</span>
                <span className="text-lg font-mono font-bold text-amber-600">₦{selectedItemForModal.price.toLocaleString()}</span>
              </div>

              {/* Dynamic Option Renderer */}
              {renderItemOptions(selectedItemForModal)}

              {/* Extras checkbox layout if available */}
              <div className="space-y-3">
                <label className="text-xs uppercase font-mono text-neutral-500 tracking-wider block font-bold">Select Additional Extras</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: "Extra Syrups / Honey", price: 1500 },
                    { name: "Single Shot Espresso", price: 3500 },
                    { name: "Whipped Cream Layer", price: 1500 },
                    { name: "Gourmet Avocado Portion", price: 2000 },
                    { name: "Fried Sweet Plantain Portion", price: 3000 }
                  ].map((x) => {
                    const hasSelected = chosenExtras.includes(x.name);
                    return (
                      <button
                        key={x.name}
                        onClick={() => handleToggleExtra(x.name)}
                        className={`flex items-center justify-between p-3 border text-xs font-mono select-none ${
                          hasSelected ? "border-amber-600 bg-amber-500/5 text-amber-700 animate-pulse" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                           <div className={`w-3.5 h-3.5 border flex items-center justify-center ${hasSelected ? "border-amber-500 bg-amber-500 text-black" : "border-neutral-350"}`}>
                            {hasSelected && <Check className="w-2.5 h-2.5 text-black" />}
                          </div>
                          <span>{x.name}</span>
                        </div>
                        <span className="text-neutral-500">+₦{x.price.toLocaleString()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Trigger */}
              <div className="pt-2 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="w-full sm:w-1/3 py-3 border border-neutral-200 text-neutral-600 text-xs font-mono tracking-widest uppercase hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAddToCart}
                  className="w-full sm:w-2/3 py-3 bg-black text-white font-semibold text-xs font-mono tracking-widest uppercase hover:bg-neutral-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-4.5 h-4.5" />
                  <span>Configure & Add to Bag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
