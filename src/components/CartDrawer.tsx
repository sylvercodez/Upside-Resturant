import React, { useState } from "react";
import { X, Trash2, Ticket, ArrowRight, ShoppingCart, MessageSquare, Check, CreditCard, Sparkles, Minus, Plus, AlertCircle, HelpCircle } from "lucide-react";
import { CartItem, CheckoutDetails, PromoCode, AVAILABLE_PROMOS, LAGOS_AREAS } from "../types";
import { MENU_ITEMS, MenuItem } from "../data/menu";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, qty: number, variant?: string) => void;
  onRemoveItem: (itemId: string, variant?: string) => void;
  onClearCart: () => void;
  onAddToCartDirect: (item: MenuItem) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCartDirect
}: CartDrawerProps) {
  const [promoInput, setPromoInput] = useState("");
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  // Checkout steps matching standard React states to ensure absolute code integrity
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details" | "success">("cart");
  
  // Is coupon open under WooCommerce styled checkout toggle
  const [isCheckoutCouponOpen, setIsCheckoutCouponOpen] = useState(false);

  // WooCommerce-compliant billing checkout fields
  const [formData, setFormData] = useState<CheckoutDetails>({
    customerName: "",
    email: "",
    phone: "",
    type: "delivery",
    address: "",
    area: "Lekki Phase 1",
    paymentMethod: "paystack",
    promoCode: "",
    customNotes: ""
  });

  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  if (!isOpen) return null;

  // Pricing & Logistics Calculators
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const activeDeliveryArea = LAGOS_AREAS.find((a) => a.name === formData.area);
  const deliveryFee = formData.type === "delivery" ? (activeDeliveryArea?.fee || 3500) : 0;
  const discountAmount = activePromo ? Math.round((subtotal * activePromo.discountPercentage) / 100) : 0;
  const finalTotal = subtotal + deliveryFee - discountAmount;

  // Curated Upsell Recommendations
  const getUpsellItems = () => {
    const itemIdsInCart = cartItems.map((c) => c.itemId);
    return MENU_ITEMS.filter((item) => !itemIdsInCart.includes(item.id)).slice(0, 2);
  };

  const upsellRecommendations = getUpsellItems();

  const handleApplyPromo = () => {
    setPromoError("");
    setPromoSuccess("");
    const codeSearched = promoInput.trim().toUpperCase();

    const promoFound = AVAILABLE_PROMOS.find((p) => p.code === codeSearched);
    if (promoFound) {
      setActivePromo(promoFound);
      setPromoSuccess(`"${promoFound.code}" coupon applied!`);
      setPromoInput("");
    } else {
      setPromoError("Invalid coupon code. Try 'UPSIDELUXE', 'LAGOSNIGHTS', or 'KAFE2026'.");
    }
  };

  const handleRemovePromo = () => {
    setActivePromo(null);
    setPromoSuccess("");
  };

  const handleDetailsInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const switchCheckoutType = (type: "delivery" | "pickup") => {
    setFormData((prev) => ({ ...prev, type }));
  };

  // WhatsApp WooCommerce Integration message compiler
  const triggerWhatsAppOrder = () => {
    if (!formData.customerName || !formData.phone) {
      setCheckoutError("Billing Full Name and Active Phone are required fields.");
      return;
    }

    const orderLines = cartItems.map((item) => {
      const variantStr = item.selectedVariant ? ` (${item.selectedVariant})` : "";
      const extrasStr = item.selectedExtras && item.selectedExtras.length > 0 ? ` [Extras: ${item.selectedExtras.join(", ")}]` : "";
      return `• ${item.quantity}x ${item.name}${variantStr}${extrasStr} - ₦${(item.price * item.quantity).toLocaleString()}`;
    });

    const promoStr = activePromo ? `Coupon applied: ${activePromo.code} (-₦${discountAmount.toLocaleString()})` : "Coupon: None";
    const deliveryDetail = formData.type === "delivery" ? `Delivery Area: ${formData.area} (Fee: ₦${deliveryFee.toLocaleString()})\nAddress: ${formData.address}` : "Method: Boutique Self-Pickup at Lekki sanctuary";

    const text = `*UPSIDE RESTAURANT & CAFÉ — WOOCOMMERCE ORDER*\n` +
      `==============================\n` +
      `*CUSTOMER DETAILS:*\n` +
      `👤 Name: ${formData.customerName}\n` +
      `📞 Phone: ${formData.phone}\n` +
      `✉️ Email: ${formData.email || "None"}\n` +
      `==============================\n` +
      `*ORDER SUMMARY:*\n` +
      `${orderLines.join("\n")}\n\n` +
      `==============================\n` +
      `*Subtotal:* ₦${subtotal.toLocaleString()}\n` +
      `*${promoStr}*\n` +
      `*Total Amount:* ₦${finalTotal.toLocaleString()}\n` +
      `==============================\n` +
      `${deliveryDetail}\n` +
      `*Remarks:* ${formData.customNotes || "None"}\n\n` +
      `_This order has been queued directly via WordPress digital web client._`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/2349114646767?text=${encodedText}`;
    
    window.open(whatsappUrl, "_blank");
    setCheckoutStep("success");
  };

  // Secure Paystack checkout simulation
  const triggerPaystackSimulatedPayment = () => {
    if (!formData.customerName || !formData.email || !formData.phone) {
      setCheckoutError("Customer Name, Email Address, and Phone Number are strictly required to authorize payment.");
      return;
    }

    if (formData.type === "delivery" && !formData.address) {
      setCheckoutError("Delivery address is mandatory for checkout routing.");
      return;
    }

    setCheckoutError("");
    setIsProcessingPaystack(true);

    setTimeout(() => {
      setIsProcessingPaystack(false);
      setCheckoutStep("success");
    }, 2000);
  };

  const handleBackToCart = () => {
    setCheckoutStep("cart");
    setCheckoutError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" id="cart-overlay-wrapper">
      <div 
        className={`bg-white border-l border-neutral-200 w-full h-full flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-300 ${
          checkoutStep === "details" ? "max-w-2xl" : "max-w-lg"
        }`}
        id="cart-drawer-container"
      >
        
        {/* HEADER BRAND BAR */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50" id="cart-header-ribbon">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-neutral-900">
              {checkoutStep === "cart" && "YOUR SHOPPING CART"}
              {checkoutStep === "details" && "WOOCOMMERCE SECURE CHECKOUT"}
              {checkoutStep === "success" && "ORDER TRANSACTION COMPLETED"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-150 text-neutral-500 hover:text-black rounded-full transition-colors cursor-pointer"
            id="close-cart-drawer-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN INTERACTIVE DISPLAY VIEW */}
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 bg-white" id="cart-main-body">

          {/* ================= STEP 1: SHOPPING CART PAGE ================= */}
          {checkoutStep === "cart" && (
            <div className="space-y-6" id="shopping-cart-step-view">
              {cartItems.length === 0 ? (
                <div className="text-center py-24 space-y-4" id="empty-cart-state">
                  <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto stroke-1" />
                  <p className="text-sm font-mono text-neutral-500">Your shopping cart is empty.</p>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-normal">
                    Experience Upside's luxury culinary excellence. Browse our single-origin coffee brew bars, artisanal brioche burgers, and masterfully grilled steaks.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-3 bg-black text-white text-xs font-mono uppercase tracking-widest hover:bg-neutral-900 font-bold transition-all cursor-pointer shadow-md"
                  >
                    Browse Our Menu &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Item Loop */}
                  <div className="space-y-3" id="cart-items-wrapper">
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.itemId}-${index}`}
                        className="flex items-center gap-4 bg-white p-4 border border-neutral-200 transition-all hover:border-neutral-300 shadow-sm text-left"
                        id={`cart-item-row-${item.itemId}`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover border border-neutral-200"
                        />
                        <div className="flex-grow space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-mono font-bold text-neutral-900 uppercase">{item.name}</h4>
                              
                              {/* Option and extras detail tag lines */}
                              {item.selectedVariant && (
                                <p className="text-[10px] text-amber-600 font-mono mt-0.5 font-bold">
                                  Option: <span className="underline">{item.selectedVariant}</span>
                                </p>
                              )}

                              {item.selectedExtras && item.selectedExtras.length > 0 && (
                                <p className="text-[10px] text-neutral-500 font-mono">
                                  Extras: {item.selectedExtras.join(", ")}
                                </p>
                              )}

                              {item.notes && (
                                <p className="text-[10px] text-neutral-500 italic font-mono mt-0.5">
                                  &ldquo;{item.notes}&rdquo;
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-900">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>

                          {/* WooCommerce style qty manager and trash trigger */}
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center border border-neutral-200 bg-neutral-50">
                              <button
                                onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1, item.selectedVariant)}
                                className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                                title="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-3 text-xs text-black font-mono font-bold">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1, item.selectedVariant)}
                                className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
                                title="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.itemId, item.selectedVariant)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors p-1 cursor-pointer font-mono"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* WordPress WooCommerce Styled Coupon Code Box */}
                  <div className="bg-neutral-50 p-4 border border-neutral-200 space-y-3 text-left shadow-sm" id="cart-coupon-zone">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 flex items-center gap-1.5 font-bold">
                      <Ticket className="w-3.5 h-3.5 text-amber-600" />
                      <span>Have a promo coupon?</span>
                    </label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. UPSIDELUXE)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-grow bg-white border border-neutral-300 text-black font-mono uppercase text-xs px-3 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-5 bg-black hover:bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all cursor-pointer"
                      >
                        Apply Coupon
                      </button>
                    </div>

                    {/* Promotion validations notifications */}
                    {promoError && (
                      <p className="text-[10px] font-mono text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{promoError}</span>
                      </p>
                    )}
                    {promoSuccess && (
                      <div className="bg-amber-50 border border-amber-500/20 p-2.5 text-[10px] font-mono text-amber-700 flex justify-between items-center" id="coupon-active-badge">
                        <span>🎉 {promoSuccess}</span>
                        <button onClick={handleRemovePromo} className="underline text-black font-bold hover:text-rose-600 transition-colors cursor-pointer text-[10px]">
                          [Remove]
                        </button>
                      </div>
                    )}
                  </div>

                  {/* recommended related products upsells */}
                  {upsellRecommendations.length > 0 && (
                    <div className="bg-white border border-neutral-200 p-4 space-y-3 text-left shadow-sm" id="cart-upsells-zone">
                      <span className="text-[10px] tracking-widest text-amber-700 font-bold font-mono uppercase flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Baristas Recommended Pairings</span>
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {upsellRecommendations.map((up) => (
                          <div
                            key={up.id}
                            onClick={() => onAddToCartDirect(up)}
                            className="bg-white border border-neutral-200 p-2.5 flex flex-col justify-between hover:border-amber-600/40 cursor-pointer transition-all duration-300 shadow-sm"
                            id={`upsell-card-${up.id}`}
                          >
                            <img src={up.image} alt={up.name} className="w-full h-16 object-cover border border-neutral-200 mb-2" />
                            <h5 className="text-[10px] font-mono font-semibold text-neutral-800 truncate uppercase">{up.name}</h5>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-amber-600 font-mono font-bold">₦{up.price.toLocaleString()}</span>
                              <span className="text-[9px] text-neutral-500 hover:text-black underline font-mono">Add +</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2 & 3: UNIFIED SINGLE PAGE WOOCOMMERCE CHECKOUT ================= */}
          {checkoutStep === "details" && (
            <div className="space-y-6 text-left" id="unified-woocommerce-checkout">
              
              {/* WordPress Top Notification Bar */}
              <div className="bg-neutral-50 border-t-2 border-black p-4 font-mono text-xs text-neutral-600 flex flex-col gap-2 shadow-sm">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:text-amber-600 transition-colors"
                  onClick={() => setIsCheckoutCouponOpen(!isCheckoutCouponOpen)}
                >
                  <p className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-600" />
                    <span>Have a coupon? <strong className="underline text-black">Click here to enter your code</strong></span>
                  </p>
                </div>
                {isCheckoutCouponOpen && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-200">
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="bg-white border border-neutral-300 text-black text-xs px-3 py-2 w-full focus:outline-none focus:border-amber-500 uppercase"
                    />
                    <button
                      onClick={handleApplyPromo}
                      className="bg-black hover:bg-neutral-900 text-white font-semibold text-xs px-4 py-2 uppercase tracking-wider"
                    >
                      Apply
                    </button>
                  </div>
                )}
                {activePromo && (
                  <div className="bg-amber-50 border border-amber-500/20 p-2 text-[10px] text-amber-700 flex justify-between items-center mt-2">
                    <span>Coupon <strong>"{activePromo.code}"</strong> was approved (-{activePromo.discountPercentage}%).</span>
                    <button onClick={handleRemovePromo} className="underline text-black hover:text-rose-600 font-bold">Remove</button>
                  </div>
                )}
                {promoError && (
                  <p className="text-[10px] text-rose-600 mt-1">{promoError}</p>
                )}
              </div>

              {/* Master Checkout Columns */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* COLUMN 1: BILLING DETAILS FORM (WooCommerce format) */}
                <div className="md:col-span-7 space-y-4">
                  <div className="border-b border-neutral-200 pb-2">
                    <h3 className="text-sm font-mono font-bold tracking-widest text-neutral-900 uppercase">BILLING DETAILS</h3>
                  </div>

                  {/* Segment: Fulfillment type layout */}
                  <div className="flex border border-neutral-200" id="fulfillment-selector">
                    <button
                      type="button"
                      onClick={() => switchCheckoutType("delivery")}
                      className={`w-1/2 py-3 text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                        formData.type === "delivery" ? "bg-black text-white font-bold" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      Gourmet Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => switchCheckoutType("pickup")}
                      className={`w-1/2 py-3 text-xs font-mono uppercase tracking-wider font-semibold transition-all ${
                        formData.type === "pickup" ? "bg-black text-white font-bold" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      Boutique Self-Pickup
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Customer Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-600 font-mono block font-bold">Guest Full Name *</label>
                      <input
                        type="text"
                        name="customerName"
                        required
                        value={formData.customerName}
                        onChange={handleDetailsInputChange}
                        placeholder="E.g., Tosin Otenaike"
                        className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-none"
                      />
                    </div>

                    {/* Contact details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-neutral-600 font-mono block font-bold">Mobile Phone Line *</label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleDetailsInputChange}
                          placeholder="Phone number"
                          className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-neutral-600 font-mono block font-bold">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleDetailsInputChange}
                          placeholder="E.g., tosin@example.com"
                          className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-none"
                        />
                      </div>
                    </div>

                    {/* Conditional Delivery Address Details */}
                    {formData.type === "delivery" && (
                      <div className="space-y-3 animate-fadeIn duration-500">
                        <div className="space-y-1">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Lagos Neighborhood Area *</label>
                          <select
                            name="area"
                            value={formData.area}
                            onChange={handleDetailsInputChange}
                            className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-bold rounded-none"
                          >
                            {LAGOS_AREAS.map((area) => (
                              <option key={area.name} value={area.name} className="bg-white text-black">
                                {area.name} (Delivery Fee: ₦{area.fee.toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Full Street Address *</label>
                          <input
                            type="text"
                            name="address"
                            required
                            value={formData.address || ""}
                            onChange={handleDetailsInputChange}
                            placeholder="E.g., Apartment 4B, 32A Admiralty Way, Lekki Phase 1"
                            className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Kitchen Remarks */}
                    <div className="space-y-1">
                      <label className="text-[11px] text-neutral-600 font-mono block font-bold">Kitchen Notes & Special Instructions</label>
                      <textarea
                        name="customNotes"
                        value={formData.customNotes}
                        onChange={handleDetailsInputChange}
                        placeholder="E.g., Level 5 spicy, extra milk, leave at reception desk..."
                        className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold h-20 resize-none rounded-none"
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: WOOCOMMERCE ORDER SUMMARY TABLE & PAYMENT METHOD BOX */}
                <div className="md:col-span-5 space-y-6">
                  
                  {/* Your Order Section */}
                  <div className="space-y-3">
                    <div className="border-b border-neutral-200 pb-2">
                      <h3 className="text-sm font-mono font-bold tracking-widest text-neutral-900 uppercase">YOUR ORDER</h3>
                    </div>

                    {/* WooCommerce-style structured order table */}
                    <div className="border border-neutral-200 bg-neutral-50 overflow-hidden shadow-sm">
                      <table className="w-full border-collapse text-left font-mono text-xs">
                        <thead>
                          <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-600 text-[10px] uppercase tracking-wider">
                            <th className="p-3 font-bold">Product</th>
                            <th className="p-3 font-bold text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cartItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-neutral-200/65 hover:bg-neutral-100/30 transition-colors">
                              <td className="p-3 text-neutral-700">
                                <span className="text-black text-[11px] uppercase font-bold">{item.name}</span>
                                <strong className="text-amber-600 font-mono ml-2">×{item.quantity}</strong>
                                {item.selectedVariant && (
                                  <span className="text-[10px] text-neutral-500 block mt-0.5 font-light">
                                    Option: {item.selectedVariant}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-right text-black font-semibold">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Subtotal details */}
                          <tr className="border-b border-neutral-200 bg-neutral-100/10 text-neutral-500">
                            <td className="p-3">Cart Subtotal</td>
                            <td className="p-3 text-right text-black font-bold">
                              ₦{subtotal.toLocaleString()}
                            </td>
                          </tr>

                          {/* Applied Promo discount */}
                          {activePromo && (
                            <tr className="border-b border-neutral-200 text-amber-700 bg-amber-50">
                              <td className="p-3">Coupon [{activePromo.code}]</td>
                              <td className="p-3 text-right font-bold">
                                -₦{discountAmount.toLocaleString()}
                              </td>
                            </tr>
                          )}

                          {/* Shipping row context */}
                          <tr className="border-b border-neutral-200 text-neutral-500">
                            <td className="p-3">Shipping</td>
                            <td className="p-3 text-right text-black font-mono text-[11px]">
                              {formData.type === "delivery" ? (
                                <span>Lagos Delivery: ₦{deliveryFee.toLocaleString()}</span>
                              ) : (
                                <span className="text-amber-600 uppercase text-[9px] font-bold">Boutique Pickup (Free)</span>
                              )}
                            </td>
                          </tr>

                          {/* Absolute WooCommerce Total Row */}
                          <tr className="bg-neutral-100 text-black font-bold text-sm">
                            <td className="p-3 uppercase tracking-wider text-[11px] text-neutral-700">Total</td>
                            <td className="p-3 text-right text-amber-600 text-base font-bold">
                              ₦{finalTotal.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* WooCommerce Enclosed Payment Gateways Box */}
                  <div className="bg-neutral-50 border border-neutral-200 p-4 space-y-4 shadow-sm" id="woocommerce-payment-box">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-bold border-b border-neutral-200 pb-2">
                      Secured Payment Gateways
                    </h4>

                    {/* Radio 1: Secure Paystack Portal */}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer text-black text-[11px] font-mono font-bold select-none">
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={formData.paymentMethod === "paystack"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "paystack" })}
                          className="w-4 h-4 text-amber-600 bg-white border-neutral-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="uppercase text-neutral-800">Standard Card / Bank Transfer</span>
                        <CreditCard className="w-3.5 h-3.5 text-amber-600 ml-auto" />
                      </label>
                      {formData.paymentMethod === "paystack" && (
                        <div className="bg-white border-l-2 border-amber-500 p-3 text-[10.5px] text-neutral-600 leading-relaxed font-mono animate-fadeIn border border-neutral-200">
                          Make your payment directly via premium sandbox Paystack client supporting credit card channels, USSD tokens, and commercial banking transfers. Processing completes instantly.
                        </div>
                      )}
                    </div>

                    {/* Radio 2: WhatsApp Manual integration */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <label className="flex items-center gap-2 cursor-pointer text-black text-[11px] font-mono font-bold select-none">
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={formData.paymentMethod === "whatsapp"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "whatsapp" })}
                          className="w-4 h-4 text-amber-600 bg-white border-neutral-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="uppercase text-neutral-800">Send WhatsApp Invoice Receipt</span>
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 ml-auto" />
                      </label>
                      {formData.paymentMethod === "whatsapp" && (
                        <div className="bg-white border-l-2 border-amber-500 p-3 text-[10.5px] text-neutral-600 leading-relaxed font-mono animate-fadeIn border border-neutral-200">
                          Review details completely and generate an invoice script routed immediately inside WhatsApp to an active customer desk. Excellent for manual or business transfers offline.
                        </div>
                      )}
                    </div>

                    {/* Loading feedback simulation if card paystack is active */}
                    {formData.paymentMethod === "paystack" && isProcessingPaystack && (
                      <div className="text-center py-4 space-y-2 border-t border-neutral-250 pt-4" id="paystack-processing-indicator">
                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] uppercase tracking-wider font-mono text-amber-600">Contacting Paystack gateway...</p>
                      </div>
                    )}
                  </div>

                  {/* Checkout errors warnings label */}
                  {checkoutError && (
                    <div className="bg-rose-50 border border-rose-200 p-3 font-mono text-xs text-rose-600 flex items-start gap-2" id="checkout-err-alert">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-rose-605 flex-shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Standard secure SSL guarantee bar */}
                  <p className="text-[9px] font-mono text-neutral-500 leading-normal">
                    Your luxury order transaction forms are secured under WordPress SSL end-to-end security measures. Customer information handles in accordance with fine hospitality standards.
                  </p>

                </div>
              </div>

            </div>
          )}

          {/* ================= STEP 4: TRANSACTION SUCCESS RECEIPT ================= */}
          {checkoutStep === "success" && (
            <div className="text-center py-16 space-y-6 max-w-md mx-auto" id="checkout-completed-screen">
              <div className="w-16 h-16 bg-neutral-50 border border-amber-500 text-amber-600 flex items-center justify-center rounded-none mx-auto animate-bounce shadow-sm">
                <Check className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-serif italic text-amber-600 font-medium">A Taste of Absolute Splendor.</h4>
                <h3 className="text-xl font-sans text-neutral-900 tracking-widest uppercase font-bold">ORDER RECEIVED</h3>
                <p className="text-xs text-neutral-600 font-mono leading-relaxed">
                  Thank you. Your order has been received and is now being processed by our master chefs inside the main kitchen of our Upside Lekki sanctuary.
                </p>
              </div>

              {/* WordPress Detailed Receipt Table */}
              <div className="bg-neutral-50 border border-neutral-200 p-5 font-mono text-left space-y-3 shadow-inner" id="order-completed-receipt">
                <div className="flex justify-between text-[11px] text-neutral-500 border-b border-neutral-200 pb-2">
                  <span>Merchant:</span>
                  <span className="text-black font-bold">Upside Lagos LLC</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Guest Name:</span>
                  <span className="text-black font-semibold">{formData.customerName}</span>
                </div>
                {formData.email && (
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>Private Email:</span>
                    <span className="text-black font-semibold">{formData.email}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Line Contact:</span>
                  <span className="text-black font-semibold">{formData.phone}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Selected Area:</span>
                  <span className="text-black font-semibold">{formData.area}</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Prep Tracker:</span>
                  <span className="text-amber-600 animate-pulse font-bold uppercase">● Prepping Meals</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500">
                  <span>Delivery Gateway:</span>
                  <span className="text-black font-semibold">Lagos Luxury Express</span>
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 border-t border-neutral-200 pt-2 font-bold text-black animate-pulse">
                  <span>Grand Total Paid:</span>
                  <span className="text-amber-600">₦{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClearCart();
                  onClose();
                  setCheckoutStep("cart");
                }}
                className="px-8 py-4 bg-black text-white font-bold text-xs tracking-widest font-mono uppercase hover:bg-neutral-900 transition-colors cursor-pointer w-full text-center shadow-md"
                id="cart-reset-action-btn"
              >
                Return to Sanctuary Lobby
              </button>
            </div>
          )}

        </div>

        {/* BOTTOM ORDER FOOTER: CALCULATION PRICING & CALL TO ACTIONS */}
        {checkoutStep !== "success" && cartItems.length > 0 && (
          <div className="p-6 bg-neutral-50 border-t border-neutral-200 space-y-4" id="cart-drawer-footer">
            
            {/* Simple Subtotal/Pricing display (shown on both Cart & Checkout appropriately representing WooCommerce) */}
            {checkoutStep === "cart" && (
              <div className="space-y-2 font-mono text-xs text-neutral-500 pb-2 text-left" id="cart-footer-totals">
                <div className="flex justify-between text-neutral-500">
                  <span>Products Subtotal</span>
                  <span className="text-black font-bold">₦{subtotal.toLocaleString()}</span>
                </div>

                {activePromo && (
                  <div className="flex justify-between text-amber-700">
                    <span>Active Coupon &ldquo;{activePromo.code}&rdquo;</span>
                    <span>-₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <p className="text-[10px] text-neutral-500 leading-normal italic pt-1 border-t border-neutral-205">
                   * Shipping fee logistics, address routing, and payment methods will be selected on the next screen.
                </p>
                
                <div className="flex justify-between text-sm font-bold pt-3 border-t border-neutral-200 text-neutral-900">
                  <span>Est. Subtotal</span>
                  <span className="text-amber-600">₦{(subtotal - discountAmount).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Render buttons depending on the checkout steps */}
            <div id="footer-actions-control">
              {checkoutStep === "cart" && (
                <button
                  onClick={() => setCheckoutStep("details")}
                  className="w-full py-4 bg-black text-white font-bold text-xs tracking-widest font-mono uppercase hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  id="proceed-checkout-trigger"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {checkoutStep === "details" && (
                <div className="flex gap-3">
                  <button
                    onClick={handleBackToCart}
                    className="w-1/3 py-4 border border-neutral-200 hover:border-neutral-300 text-neutral-500 hover:text-black text-xs font-mono font-bold tracking-widest uppercase hover:bg-neutral-100 transition-all cursor-pointer"
                    id="checkout-back-step-btn"
                  >
                    Back to Cart
                  </button>
                  {formData.paymentMethod === "paystack" ? (
                    <button
                      onClick={triggerPaystackSimulatedPayment}
                      disabled={isProcessingPaystack}
                      className="w-2/3 py-4 bg-black hover:bg-neutral-900 text-white font-bold text-xs tracking-widest font-mono uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 select-none transition-all shadow-md"
                      id="place-order-paystack-btn"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Place Order (₦{finalTotal.toLocaleString()})</span>
                    </button>
                  ) : (
                    <button
                      onClick={triggerWhatsAppOrder}
                      className="w-2/3 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-widest font-mono uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                      id="place-order-whatsapp-btn"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Place Order via WA</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
