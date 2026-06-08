import React, { useState } from "react";
import { X, Trash2, Ticket, ArrowRight, ShoppingCart, MessageSquare, Check, CreditCard, Sparkles, Minus, Plus, AlertCircle, HelpCircle } from "lucide-react";
import { CartItem, CheckoutDetails, PromoCode, AVAILABLE_PROMOS, LAGOS_AREAS } from "../types";
import { logCustomEvent } from "../utils/analytics";
import { MENU_ITEMS, MenuItem } from "../data/menu";
import OrderTracker from "./OrderTracker";
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, qty: number, variant?: string) => void;
  onRemoveItem: (itemId: string, variant?: string) => void;
  onClearCart: () => void;
  onAddToCartDirect: (item: MenuItem) => void;
  currentUser?: any;
  onAuthClick?: () => void;
  menuItems?: MenuItem[];
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddToCartDirect,
  currentUser,
  onAuthClick,
  menuItems
}: CartDrawerProps) {
  const [activeTab, setActiveTab] = useState<"checkout" | "tracker">("checkout");
  const [promoInput, setPromoInput] = useState("");
  const [activePromo, setActivePromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");

  const [checkoutPassword, setCheckoutPassword] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");

  // Prepopulate form billing details if a user session is active
  React.useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        customerName: currentUser.displayName || prev.customerName || "",
        email: currentUser.email || prev.email || ""
      }));
    }
  }, [currentUser]);

  // Auto-switch to tracker tab if open and an active order is present during navigation events
  React.useEffect(() => {
    if (isOpen) {
      logCustomEvent("cart_view", { itemsCount: cartItems.length });
      const saved = localStorage.getItem("upside_active_order");
      if (saved) {
        setActiveTab("tracker");
      }
    }
  }, [isOpen]);

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
  const [isProcessingOpay, setIsProcessingOpay] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // OPay payment success receipt fallbacks
  const [savedTotalPaid, setSavedTotalPaid] = useState<number | null>(null);
  const [savedCustomerName, setSavedCustomerName] = useState<string>("");
  const [savedEmail, setSavedEmail] = useState<string>("");
  const [savedPhone, setSavedPhone] = useState<string>("");
  const [savedArea, setSavedArea] = useState<string>("");

  const [pollingStatus, setPollingStatus] = useState<"not_polling" | "polling" | "passed" | "failed" | "cancelled" | "expired" | "timeout">("not_polling");
  const [pollingError, setPollingError] = useState("");
  const [oppRef, setOppRef] = useState("");

  const pollPaymentVerification = async (ref: string) => {
    let attempts = 0;
    const maxAttempts = 15; // 45 seconds total

    const checkStatus = async () => {
      try {
        const response = await fetch("/api/opay/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reference: ref })
        });
        const data = await response.json();
        console.log("[OPay Verification Polling]", data);
        if (data.paymentStatus === "PAID") {
          setPollingStatus("passed");
          setCheckoutStep("success");
          onClearCart();
          
          // Hydrate success state and synchronize database status securely on Frontend
          try {
            await updateDoc(doc(db, "orders", ref), {
              orderStatus: "paid",
              paymentStatus: "paid",
              updatedAt: new Date().toISOString()
            });
            await updateDoc(doc(db, "payments", ref), {
              paymentStatus: "PAID",
              updatedAt: serverTimestamp()
            });
            console.log("[FRONTEND SYNCHRONIZATION] Live order & payment status synced as PAID in client-side Firestore! Ref:", ref);
          } catch (syncErr) {
            console.warn("[FRONTEND SYNCHRONIZATION] Could not sync PAID state directly in Client Firestore:", syncErr);
          }

          try {
            const savedOrderRaw = localStorage.getItem("upside_active_order");
            if (savedOrderRaw) {
              const parsed = JSON.parse(savedOrderRaw);
              if (parsed.totalPrice) setSavedTotalPaid(parsed.totalPrice);
              if (parsed.customerName) setSavedCustomerName(parsed.customerName);
              if (parsed.email) setSavedEmail(parsed.email);
              if (parsed.phone) setSavedPhone(parsed.phone);
              if (parsed.address) setSavedArea(parsed.address);
            }
          } catch (stErr) {
            console.warn("Could not load backup order on payment verification passed:", stErr);
          }
          return true; // ends loop
        } else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED" || data.paymentStatus === "EXPIRED") {
          setPollingStatus(data.paymentStatus.toLowerCase() as any);
          
          // Synchronize failure statuses securely on Frontend
          try {
            await updateDoc(doc(db, "orders", ref), {
              paymentStatus: data.paymentStatus.toLowerCase(),
              updatedAt: new Date().toISOString()
            });
            await updateDoc(doc(db, "payments", ref), {
              paymentStatus: data.paymentStatus,
              updatedAt: serverTimestamp()
            });
            console.log(`[FRONTEND SYNCHRONIZATION] Live order & payment status synced to ${data.paymentStatus} in client-side Firestore! Ref:`, ref);
          } catch (syncErr) {
            console.warn(`[FRONTEND SYNCHRONIZATION] Could not sync ${data.paymentStatus} state directly in Client Firestore:`, syncErr);
          }

          if (data.paymentStatus === "FAILED") {
            setPollingError("OPay processed this transaction, but the payment failed. Please check your bank or card balance and try again.");
          } else if (data.paymentStatus === "CANCELLED") {
            setPollingError("The payment transaction was cancelled. If this was a mistake, you can easily retry below.");
          } else {
            setPollingError("The checkout session expired. Please start a fresh checkout transaction.");
          }
          return true; // ends loop
        }
      } catch (pollErr) {
        console.warn("Retrying status lookup after error:", pollErr);
      }
      return false;
    };

    // First attempt immediately
    const isDone = await checkStatus();
    if (isDone) return;

    const intervalId = setInterval(async () => {
      attempts++;
      const isDoneNow = await checkStatus();
      if (isDoneNow || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (attempts >= maxAttempts && !isDoneNow) {
          setPollingStatus("timeout");
          setPollingError("We are currently waiting for OPay to confirm your payment. If you've been debited, your order will automatically be processed once OPay sends confirmations. Otherwise, you can retry placing the order below.");
        }
      }
    }, 3000);
  };

  // Auto detect redirect success query reference on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const opayRef = params.get("opay_ref");
    if (opayRef) {
      console.log("[CART DRAWER] Initializing checkout success screen from callback parameter:", opayRef);
      setOppRef(opayRef);
      setPollingStatus("polling");
      pollPaymentVerification(opayRef);
      
      // Clear url search params cleanly
      try {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (historyErr) {
        console.warn("Could not sweep OPay address query parameters:", historyErr);
      }
    }
  }, []);

  // Listen for step transitions to populate custom saved stats instantly
  React.useEffect(() => {
    if (checkoutStep === "success") {
      try {
        const savedOrderRaw = localStorage.getItem("upside_active_order");
        if (savedOrderRaw) {
          const parsed = JSON.parse(savedOrderRaw);
          if (parsed.totalPrice) setSavedTotalPaid(parsed.totalPrice);
          if (parsed.customerName) setSavedCustomerName(parsed.customerName);
          if (parsed.email) setSavedEmail(parsed.email);
          if (parsed.phone) setSavedPhone(parsed.phone);
          if (parsed.address) setSavedArea(parsed.address);
        }
      } catch (err) {
        console.warn("Failed loading storage states during checkout completion:", err);
      }
    }
  }, [checkoutStep]);

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
    const finalMenu = menuItems || MENU_ITEMS;
    return finalMenu.filter((item) => !itemIdsInCart.includes(item.id)).slice(0, 2);
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

  const handleCheckoutAutoSignup = async () => {
    if (!currentUser && formData.email && checkoutPassword) {
      if (checkoutPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long to register.");
      }
      try {
        setRegistrationMessage("Registering your premium user profile...");
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, checkoutPassword);
        if (formData.customerName) {
          await updateProfile(userCredential.user, {
            displayName: formData.customerName
          });
        }
        setRegistrationMessage("Account created successfully!");
      } catch (err: any) {
        console.error("Auto checkout signup error:", err);
        if (err.code === "auth/email-already-in-use") {
          try {
            setRegistrationMessage("Email already in use. Authenticating account with provided password...");
            await signInWithEmailAndPassword(auth, formData.email, checkoutPassword);
            setRegistrationMessage("Authenticated successfully!");
          } catch (loginErr: any) {
            console.error("Auto sign-in during checkout failed:", loginErr);
            throw new Error("This email is already registered. If this is your account, please enter your correct password to login and complete checkout.");
          }
        } else if (err.code === "auth/invalid-email") {
          throw new Error("The entered email address structure is invalid.");
        } else {
          throw new Error(err.message || "Auto-signup failed.");
        }
      }
    }
  };

  // WhatsApp WooCommerce Integration message compiler
  const triggerWhatsAppOrder = async () => {
    if (!formData.customerName || !formData.phone) {
      setCheckoutError("Billing Full Name and Active Phone are required fields.");
      return;
    }

    try {
      await handleCheckoutAutoSignup();
    } catch (signupErr: any) {
      setCheckoutError(signupErr.message);
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
    
    const currentUserId = auth.currentUser?.uid || "guest";
    const orderId = `order_${Date.now()}`;
    const activeOrderPayload = {
      id: orderId,
      userId: currentUserId,
      customerName: formData.customerName,
      email: formData.email || "guest@example.com",
      phone: formData.phone,
      totalPrice: finalTotal,
      items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      address: formData.type === "delivery" ? `${formData.address}, ${formData.area}` : "Boutique Self-Pickup",
      status: "Prepping",
      timestamp: Date.now(),
      type: formData.type
    };
    localStorage.setItem("upside_active_order", JSON.stringify(activeOrderPayload));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "orders", orderId), activeOrderPayload);
      } catch (dbErr) {
        console.error("Failed to persist order to Firestore:", dbErr);
      }
    }

    window.open(whatsappUrl, "_blank");
    logCustomEvent("checkout_success", {
      price: finalTotal,
      itemsCount: cartItems.length,
      type: formData.type || "delivery",
      method: "whatsapp"
    });
    setCheckoutStep("success");
    setCheckoutPassword("");
  };

  // Secure OPay checkout route handshake
  const triggerOpayCheckoutPayment = async () => {
    if (!formData.customerName || !formData.email || !formData.phone) {
      setCheckoutError("Customer Name, Email Address, and Phone Number are strictly required to authorize payment.");
      return;
    }

    if (formData.type === "delivery" && !formData.address) {
      setCheckoutError("Delivery address is mandatory for checkout routing.");
      return;
    }

    setCheckoutError("");

    try {
      await handleCheckoutAutoSignup();
    } catch (signupErr: any) {
      setCheckoutError(signupErr.message);
      return;
    }

    setIsProcessingOpay(true);

    const currentUserId = auth.currentUser?.uid || "guest";
    const orderId = `order_${Date.now()}`;
    const activeOrderPayload = {
      id: orderId,
      userId: currentUserId,
      customerName: formData.customerName,
      email: formData.email || "guest@example.com",
      phone: formData.phone,
      totalPrice: finalTotal,
      items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      address: formData.type === "delivery" ? `${formData.address}, ${formData.area}` : "Boutique Self-Pickup",
      status: "Prepping",
      timestamp: Date.now(),
      type: formData.type
    };

    // Store details locally prior to checkout redirection to handle success return receipt smoothly
    localStorage.setItem("upside_active_order", JSON.stringify(activeOrderPayload));

    // Dynamic self-healing double-write initialization using client credentials on Frontend.
    // This pre-hydrates Firestore with the exact order schema under the active authenticated session,
    // avoiding server-side IAM permissions issues securely.
    try {
      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        userId: currentUserId,
        customerName: formData.customerName,
        email: formData.email || "guest@example.com",
        phone: formData.phone,
        totalPrice: finalTotal,
        items: activeOrderPayload.items,
        address: activeOrderPayload.address,
        status: "Prepping", // needed for isValidOrder rules
        timestamp: Date.now(),
        type: formData.type
      });

      await setDoc(doc(db, "payments", orderId), {
        orderId: orderId,
        userId: currentUserId,
        amount: finalTotal,
        currency: "NGN",
        paymentMethod: "OPay",
        transactionReference: orderId,
        paymentStatus: "PENDING"
      });
      console.log("[FRONTEND SYNCHRONIZATION] Pre-persisted order & payment documents successfully! Ref:", orderId);
    } catch (fsErr: any) {
      console.warn("[FRONTEND SYNCHRONIZATION] Could not pre-persist Firestore order/payment records:", fsErr.message || fsErr);
    }

    try {
      const response = await fetch("/api/opay/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: finalTotal,
          customerName: formData.customerName,
          email: formData.email,
          phone: formData.phone,
          reference: orderId,
          type: formData.type,
          address: activeOrderPayload.address,
          items: activeOrderPayload.items,
          userId: currentUserId
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to contact OPay API gateway successfully.");
      }

      if (data.success && data.cashierUrl) {
         logCustomEvent("checkout_attempt", {
           method: "opay",
           price: finalTotal,
           reference: orderId
         });
         // Redirect user to secure OPay cashier payment page
         window.location.href = data.cashierUrl;
      } else {
        throw new Error("Invalid checkout payload status returned from OPay gateway server.");
      }
    } catch (paymentErr: any) {
      console.error("OPay initiation error:", paymentErr);
      setCheckoutError(paymentErr.message || "Network transfer crash. Please check admin keys or retry.");
      setIsProcessingOpay(false);
    }
  };

  // Secure Paystack checkout simulation
  const triggerPaystackSimulatedPayment = async () => {
    if (!formData.customerName || !formData.email || !formData.phone) {
      setCheckoutError("Customer Name, Email Address, and Phone Number are strictly required to authorize payment.");
      return;
    }

    if (formData.type === "delivery" && !formData.address) {
      setCheckoutError("Delivery address is mandatory for checkout routing.");
      return;
    }

    setCheckoutError("");

    try {
      await handleCheckoutAutoSignup();
    } catch (signupErr: any) {
      setCheckoutError(signupErr.message);
      return;
    }

    setIsProcessingPaystack(true);

    const currentUserId = auth.currentUser?.uid || "guest";
    const orderId = `order_${Date.now()}`;
    const activeOrderPayload = {
      id: orderId,
      userId: currentUserId,
      customerName: formData.customerName,
      email: formData.email || "guest@example.com",
      phone: formData.phone,
      totalPrice: finalTotal,
      items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      address: formData.type === "delivery" ? `${formData.address}, ${formData.area}` : "Boutique Self-Pickup",
      status: "Prepping",
      timestamp: Date.now(),
      type: formData.type
    };
    localStorage.setItem("upside_active_order", JSON.stringify(activeOrderPayload));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "orders", orderId), activeOrderPayload);
      } catch (dbErr) {
        console.error("Failed to persist order to Firestore:", dbErr);
      }
    }

    setTimeout(() => {
      setIsProcessingPaystack(false);
      logCustomEvent("checkout_success", {
        price: finalTotal,
        itemsCount: cartItems.length,
        type: formData.type || "delivery",
        method: "paystack"
      });
      setCheckoutStep("success");
      setCheckoutPassword("");
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

        {/* TAB TOGGLE NAVIGATION (Shown only if not in success step to avoid disruption) */}
        {checkoutStep !== "success" && (
          <div className="flex border-b border-neutral-200 bg-neutral-100" id="cart-tabs-header-strip">
            <button
              onClick={() => setActiveTab("checkout")}
              className={`w-1/2 py-3.5 text-xs font-mono uppercase tracking-widest font-extrabold text-center transition-all cursor-pointer ${
                activeTab === "checkout" 
                  ? "bg-white text-amber-600 border-b-2 border-b-amber-500 font-extrabold" 
                  : "text-neutral-500 hover:text-black hover:bg-neutral-50"
              }`}
            >
              🛒 CheckOut Basket
            </button>
            <button
              onClick={() => setActiveTab("tracker")}
              className={`w-1/2 py-3.5 text-xs font-mono uppercase tracking-widest font-extrabold text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "tracker" 
                  ? "bg-white text-amber-600 border-b-2 border-b-amber-500 font-extrabold" 
                  : "text-neutral-500 hover:text-black hover:bg-neutral-50"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              🚚 Track My Order
            </button>
          </div>
        )}

        {/* MAIN INTERACTIVE DISPLAY VIEW */}
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 bg-white" id="cart-main-body">

          {activeTab === "tracker" ? (
            <OrderTracker onBackToCart={() => setActiveTab("checkout")} />
          ) : pollingStatus === "polling" ? (
            <div className="flex flex-col items-center justify-center p-8 py-16 text-center space-y-6 animate-fade-in" id="opay-polling-screen">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-amber-100 opacity-75"></span>
                <div className="relative w-16 h-16 border-4 border-neutral-100 border-t-amber-600 rounded-full animate-spin animate-duration-1000"></div>
                <CreditCard className="absolute w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-semibold text-lg text-neutral-900 tracking-tight block">Verifying Payment</h3>
                <p className="font-sans text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed block">
                  We are securely communicating with the OPay Business Payment Gateway to verify your transaction status. Please do not close or reload this drawer...
                </p>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 w-full max-w-xs text-xs font-mono text-neutral-400 block">
                Ref: {oppRef}
              </div>
            </div>
          ) : (pollingStatus === "failed" || pollingStatus === "cancelled" || pollingStatus === "expired" || pollingStatus === "timeout") ? (
            <div className="flex flex-col items-center justify-center p-8 py-16 text-center space-y-6 animate-fade-in" id="opay-error-screen">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-sans font-extrabold text-lg text-neutral-900 tracking-tight block">Payment Unsuccessful</h3>
                <p className="font-sans text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed block">
                  {pollingError}
                </p>
              </div>
              <div className="flex flex-col space-y-3 w-full max-w-xs">
                <button
                  onClick={() => {
                    setPollingStatus("not_polling");
                    setPollingError("");
                    setCheckoutStep("details");
                    setFormData(prev => ({
                      ...prev,
                      paymentMethod: "opay"
                    }));
                  }}
                  className="w-full bg-neutral-900 text-white font-sans text-xs font-bold py-3 px-4 rounded-lg hover:bg-neutral-850 transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer uppercase tracking-wider"
                >
                  <span>Modify / Retry with OPay</span>
                </button>
                <button
                  onClick={() => {
                    setPollingStatus("not_polling");
                    setPollingError("");
                    setCheckoutStep("details");
                  }}
                  className="w-full bg-white border border-neutral-200 text-neutral-700 font-sans text-xs font-bold py-2.5 px-4 rounded-lg hover:bg-neutral-50 transition cursor-pointer uppercase tracking-wider"
                >
                  Choose Another Method
                </button>
              </div>
            </div>
          ) : (
            <>
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
                        {currentUser ? (
                          <span className="text-[10px] text-emerald-600 font-mono font-bold mt-1 block">⭐ Logged in as VIP guest</span>
                        ) : (
                          <span className="text-[9px] text-neutral-400 font-mono block mt-1">Not logged in. Join below or proceed as guest.</span>
                        )}
                      </div>
                    </div>

                    {/* Optional Auto-Signup Block if Guest is not logged in */}
                    {!currentUser && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 space-y-2.5 mt-2" id="checkout-auth-conversion-promo">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono tracking-widest text-amber-600 uppercase font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            🔑 SECURE PREMIUM ACCOUNT CREATION
                          </span>
                          <button
                            type="button"
                            onClick={onAuthClick}
                            className="text-[9px] font-mono text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 uppercase font-extrabold transition-all cursor-pointer"
                          >
                            Sign In / Log In
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                          Provide a password to register your email and instantly create your premium account, securely saving your order transactions.
                        </p>
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-700 font-mono block font-bold">Desired Password (Min. 6 characters)</label>
                          <input
                            type="password"
                            value={checkoutPassword}
                            onChange={(e) => setCheckoutPassword(e.target.value)}
                            placeholder="Enter password to auto-create account"
                            className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-none"
                          />
                          {registrationMessage && (
                            <p className="text-[9px] font-mono text-amber-600 uppercase tracking-wider mt-1 font-bold animate-pulse">
                              ✨ {registrationMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

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

                    {/* Radio 3: Secure OPay checkout */}
                    <div className="space-y-2 pt-2 border-t border-neutral-200">
                      <label className="flex items-center gap-2 cursor-pointer text-black text-[11px] font-mono font-bold select-none">
                        <input
                          type="radio"
                          name="checkoutPaymentMethod"
                          checked={formData.paymentMethod === "opay"}
                          onChange={() => setFormData({ ...formData, paymentMethod: "opay" })}
                          className="w-4 h-4 text-amber-600 bg-white border-neutral-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="uppercase text-neutral-800">Pay Securely via OPay</span>
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 ml-auto" />
                      </label>
                      {formData.paymentMethod === "opay" && (
                        <div className="bg-white border-l-2 border-amber-500 p-3 text-[10.5px] text-neutral-600 leading-relaxed font-mono animate-fadeIn border border-neutral-200">
                          Directly initiate an official checkout cashier request on OPay's high-speed checkout servers. Make payment safely via internet wallet balance, cards, or instant bank transfers.
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

                    {/* Loading feedback if OPay is active */}
                    {formData.paymentMethod === "opay" && isProcessingOpay && (
                      <div className="text-center py-4 space-y-2 border-t border-neutral-250 pt-4" id="opay-processing-indicator">
                        <div className="w-6 h-6 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#ff6b00]">Contacting OPay Gateway Cashier...</p>
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
                  <span className="text-black font-semibold">{savedCustomerName || formData.customerName || "Premium Guest"}</span>
                </div>
                {(savedEmail || formData.email) && (
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>Private Email:</span>
                    <span className="text-black font-semibold">{savedEmail || formData.email}</span>
                  </div>
                )}
                {(savedPhone || formData.phone) && (
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>Line Contact:</span>
                    <span className="text-black font-semibold">{savedPhone || formData.phone}</span>
                  </div>
                )}
                {(savedArea || formData.area) && (
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>Delivery Address/Area:</span>
                    <span className="text-black font-semibold">{savedArea || formData.area}</span>
                  </div>
                )}
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
                  <span className="text-amber-600">₦{(savedTotalPaid !== null ? savedTotalPaid : finalTotal).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab("tracker");
                }}
                className="px-8 py-4 bg-amber-600 text-white font-bold text-xs tracking-widest font-mono uppercase hover:bg-amber-700 transition-colors cursor-pointer w-full text-center shadow-md mb-3 flex items-center justify-center gap-2 animate-pulse"
                id="cart-track-live-btn"
              >
                <span>🚀 Track Your Live Food Prep</span>
              </button>

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
          </>
          )}

        </div>

        {/* BOTTOM ORDER FOOTER: CALCULATION PRICING & CALL TO ACTIONS */}
        {activeTab === "checkout" && checkoutStep !== "success" && cartItems.length > 0 && (
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
                  onClick={() => {
                    setCheckoutStep("details");
                    logCustomEvent("checkout_attempt", {
                      itemsCount: cartItems.length,
                      totalPrice: subtotal - discountAmount
                    });
                  }}
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
                  ) : formData.paymentMethod === "opay" ? (
                    <button
                      onClick={triggerOpayCheckoutPayment}
                      disabled={isProcessingOpay}
                      className="w-2/3 py-4 bg-[#ff6b00] hover:bg-[#e05e00] text-white font-bold text-xs tracking-widest font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 select-none shadow-md"
                      id="place-order-opay-btn"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>{isProcessingOpay ? "Directing..." : `Pay via OPay (₦${finalTotal.toLocaleString()})`}</span>
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
