import React, { useState } from "react";
import { X, Trash2, Ticket, ArrowRight, ShoppingCart, MessageSquare, Check, CreditCard, Sparkles, Minus, Plus, AlertCircle, HelpCircle, Store, MapPin, User } from "lucide-react";
import { CartItem, CheckoutDetails, PromoCode, AVAILABLE_PROMOS, LAGOS_AREAS, ShippingLocation, getApiUrl } from "../types";
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
  isPage?: boolean;
  shippingLocations?: ShippingLocation[];
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
  menuItems,
  isPage = false,
  shippingLocations = []
}: CartDrawerProps) {
  const [activeTab, setActiveTab] = useState<"checkout">("checkout");
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

  // Log cart view metrics
  React.useEffect(() => {
    if (isOpen) {
      logCustomEvent("cart_view", { itemsCount: cartItems.length });
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
    paymentMethod: "opay",
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
        const response = await fetch(getApiUrl("/api/opay/verify-payment"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ reference: ref })
        });
        const data = await response.json();
        console.log("[OPay Verification Polling]", data);
        if (data.paymentStatus === "PAID" || data.paymentStatus === "SUCCESS" || data.paymentStatus === "payment_successful") {
          setPollingStatus("passed");
          setCheckoutStep("success");
          onClearCart();

          // Log conversion / transaction analysis
          try {
            const savedOrderRaw = localStorage.getItem("upside_active_order");
            let analyticPrice = finalTotal;
            let analyticItemsCount = cartItems.length;
            let analyticType = formData.type || "delivery";
            if (savedOrderRaw) {
              const parsed = JSON.parse(savedOrderRaw);
              if (parsed.totalPrice) analyticPrice = parsed.totalPrice;
              if (parsed.items) {
                analyticItemsCount = Array.isArray(parsed.items) 
                  ? parsed.items.length 
                  : Object.keys(parsed.items).length;
              }
              if (parsed.type) analyticType = parsed.type;
            }
            logCustomEvent("checkout_success", {
              price: analyticPrice,
              itemsCount: analyticItemsCount,
              type: analyticType,
              method: "opay"
            });
          } catch (analyticsLogErr) {
            console.warn("OPay checkout success analytics logging failed:", analyticsLogErr);
          }
          
          // Hydrate success state and synchronize database status securely on Frontend
          try {
            let orderPayload: any = {};
            const savedOrderRaw = localStorage.getItem("upside_active_order");
            if (savedOrderRaw) {
              try {
                orderPayload = JSON.parse(savedOrderRaw);
              } catch (_) {}
            }
            const cleanOrder = {
              id: ref,
              userId: orderPayload?.userId || auth.currentUser?.uid || "guest",
              customerName: orderPayload?.customerName || "Vanguard Guest",
              email: orderPayload?.email || "guest@example.com",
              phone: orderPayload?.phone || "",
              totalPrice: orderPayload?.totalPrice || 0,
              items: orderPayload?.items || [],
              address: orderPayload?.address || "Boutique Self-Pickup",
              status: orderPayload?.status || "Prepping",
              timestamp: orderPayload?.timestamp || Date.now(),
              type: orderPayload?.type || "delivery",
              orderStatus: "payment_successful",
              paymentStatus: "payment_successful",
              updatedAt: new Date().toISOString()
            };
            // Ensure full record is securely written on OPay verification success
            await setDoc(doc(db, "orders", ref), cleanOrder, { merge: true });
            
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

  // Determining active dynamic locations list
  const locationsList = (shippingLocations && shippingLocations.length > 0) ? shippingLocations : LAGOS_AREAS;

  // Dynamically align selected area with first available valid area if list shifts
  React.useEffect(() => {
    if (formData.type === "delivery" && locationsList.length > 0) {
      const isAreaValid = locationsList.some((a) => a.name === formData.area);
      if (!isAreaValid) {
        setFormData(prev => ({ ...prev, area: locationsList[0].name }));
      }
    }
  }, [locationsList, formData.type, formData.area]);

  // Pricing & Logistics Calculators
  const subtotal = cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const activeDeliveryArea = locationsList.find((a) => a.name === formData.area);
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
          const errStr = String(err.code || err.message || "").toLowerCase();
          if (errStr.includes("operation-not-allowed") || errStr.includes("operation not allowed") || errStr.includes("identitytoolkit") || errStr.includes("identity toolkit")) {
            throw new Error("Firebase Setup Missing: The 'Email/Password' login method has not been enabled or the Identity Toolkit API is disabled in your Firebase console. ACTION: Log in to your Firebase Console > Authentication > Sign-in method, click 'Email/Password' and enable it. Also ensure the Google Cloud Identity Toolkit API is enabled.");
          } else if (errStr.includes("unauthorized-domain") || errStr.includes("unauthorized domain")) {
            throw new Error("Unauthorized Domain: The domain '" + window.location.hostname + "' has not been authorized in your Firebase console. ACTION: Go to Firebase Console > Authentication > Settings and add '" + window.location.hostname + "' to your 'Authorized domains' list.");
          } else {
            throw new Error((err.code ? `[${err.code}] ` : "") + (err.message || "Auto-signup failed. Please verify credentials."));
          }
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

    // Direct payment intent tracking initialization.
    // Instead of pre-creating an order record, we persist details on the payment intent itself,
    // only instantiating the formal Order document once a successful payment response is fetched.
    try {
      await setDoc(doc(db, "payments", orderId), {
        orderId: orderId,
        userId: currentUserId,
        amount: finalTotal,
        currency: "NGN",
        paymentMethod: "OPay",
        transactionReference: orderId,
        paymentStatus: "PENDING",
        customerName: formData.customerName,
        email: formData.email || "guest@example.com",
        phone: formData.phone,
        items: activeOrderPayload.items,
        address: activeOrderPayload.address,
        type: formData.type
      });
      console.log("[FRONTEND SYNCHRONIZATION] Pre-persisted payment intent reference successfully:", orderId);
    } catch (fsErr: any) {
      console.warn("[FRONTEND SYNCHRONIZATION] Could not pre-persist Firestore payment record:", fsErr.message || fsErr);
    }

    const opayPayload = {
      amount: finalTotal,
      customerName: formData.customerName,
      email: formData.email,
      phone: formData.phone,
      reference: orderId,
      type: formData.type,
      address: activeOrderPayload.address,
      items: activeOrderPayload.items,
      userId: currentUserId
    };

    console.log("=================== OPAY DEBUG PAYLOAD LOGGER ===================");
    console.log("Exact payload structure being transmitted to /api/opay/create-payment API:");
    console.log(JSON.stringify(opayPayload, null, 2));
    console.log("=================================================================");

    try {
      const response = await fetch(getApiUrl("/api/opay/create-payment"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(opayPayload)
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
    <div 
      className={isPage ? "w-full max-w-4xl mx-auto flex flex-col justify-between" : "fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"} 
      id={isPage ? "cart-page-container" : "cart-overlay-wrapper"}
    >
      <div 
        className={isPage ? "bg-white border border-neutral-200 w-full flex flex-col justify-between shadow-sm overflow-hidden rounded-xl min-h-[650px] relative text-neutral-900" : `bg-white border-l border-neutral-200 w-full h-full flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-500 ease-in-out ${
          checkoutStep === "details" ? "max-w-4xl" : checkoutStep === "success" ? "max-w-2xl" : "max-w-lg"
        }`}
        id="cart-drawer-container"
      >
        {/* HEADER BRAND BAR */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50" id="cart-header-ribbon">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-mono tracking-widest uppercase font-bold text-neutral-900">
              {checkoutStep === "cart" && "YOUR SHOPPING BASKET"}
              {checkoutStep === "details" && "SECURE CHECKOUT"}
              {checkoutStep === "success" && "ORDER TRANSACTION COMPLETED"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={isPage ? "px-3 py-1.5 hover:bg-neutral-100 text-neutral-600 hover:text-black hover:border-neutral-300 border border-neutral-200 rounded-none transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono tracking-widest font-bold uppercase" : "p-2 hover:bg-neutral-150 text-neutral-500 hover:text-black rounded-full transition-colors cursor-pointer"}
            id="close-cart-drawer-btn"
          >
            {isPage ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>EXIT CART</span>
              </>
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* WIZARD PROCESS TRACKER (Highly UX-Friendly) */}
        {checkoutStep !== "success" && (
          <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-200 flex items-center justify-center select-none" id="checkout-progress-timeline-wrapper">
            <div className="w-full max-w-md flex items-center justify-between relative">
              
              {/* Connecting Background Line */}
              <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-neutral-200 -translate-y-1/2 -z-10" />
              
              {/* Animated/Colored active line */}
              <div 
                className="absolute top-1/2 left-4 h-0.5 bg-amber-600 -translate-y-1/2 -z-10 transition-all duration-500" 
                style={{ width: checkoutStep === "details" ? "100%" : "0%" }}
              />

              {/* Step 1: Cart */}
              <button 
                onClick={() => {
                  if (checkoutStep === "details") handleBackToCart();
                }}
                disabled={checkoutStep === "cart"}
                className="flex flex-col items-center gap-1 bg-neutral-50/50 px-2 cursor-pointer focus:outline-none disabled:cursor-default"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  checkoutStep === "cart" 
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-sm ring-4 ring-neutral-950/10" 
                    : "border-amber-600 bg-amber-600 text-white"
                }`}>
                  {checkoutStep === "details" ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                </div>
                <span className={`text-[9px] font-mono tracking-widest uppercase font-bold transition-colors ${
                  checkoutStep === "cart" ? "text-neutral-950 font-extrabold" : "text-neutral-500"
                }`}>1. My Basket</span>
              </button>

              {/* Step 2: Details */}
              <div className="flex flex-col items-center gap-1 bg-neutral-50/50 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  checkoutStep === "details" 
                    ? "border-neutral-950 bg-neutral-950 text-white shadow-sm ring-4 ring-neutral-950/10" 
                    : "border-neutral-200 bg-white text-neutral-400"
                }`}>
                  <MapPin className="w-4 h-4" />
                </div>
                <span className={`text-[9px] font-mono tracking-widest uppercase font-bold transition-colors ${
                  checkoutStep === "details" ? "text-neutral-950 font-extrabold" : "text-neutral-500"
                }`}>2. Billing</span>
              </div>

              {/* Step 3: Success */}
              <div className="flex flex-col items-center gap-1 bg-neutral-50/50 px-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-neutral-200 bg-white text-neutral-400 transition-all duration-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono tracking-widest uppercase font-bold text-neutral-400">3. Splendor</span>
              </div>

            </div>
          </div>
        )}

        {/* MAIN INTERACTIVE DISPLAY VIEW */}
        <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 bg-white text-neutral-950" id="cart-main-body">

          {pollingStatus === "polling" ? (
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
                  <div className="space-y-4" id="cart-items-wrapper">
                    {cartItems.map((item, index) => (
                      <div
                        key={`${item.itemId}-${index}`}
                        className="group flex gap-4 bg-white p-5 border border-neutral-100 rounded-xl transition-all duration-300 hover:border-amber-600/30 hover:shadow-md text-left relative overflow-hidden"
                        id={`cart-item-row-${item.itemId}`}
                      >
                        {/* Elite background flare */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/0 to-amber-500/5 pointer-events-none duration-300 rounded-bl-full group-hover:scale-110" />

                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200/80 shadow-sm bg-neutral-50 flex items-center justify-center">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-grow flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <h4 className="text-xs font-sans font-extrabold text-neutral-900 uppercase tracking-tight group-hover:text-amber-600 transition-colors duration-200">
                                {item.name}
                              </h4>
                              
                              {/* Option and extras detail tag lines */}
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.selectedVariant && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-500/10">
                                    {item.selectedVariant}
                                  </span>
                                )}

                                {(item.selectedExtras || []).map((ex, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono bg-neutral-100 text-neutral-600 border border-neutral-200">
                                    +{ex}
                                  </span>
                                ))}

                                {item.notes && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-sans italic bg-neutral-50 text-neutral-600 truncate max-w-[150px]" title={item.notes}>
                                    💬 &ldquo;{item.notes}&rdquo;
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-mono font-extrabold text-neutral-950 flex-shrink-0">
                              ₦{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>

                          {/* WooCommerce style qty manager and trash trigger */}
                          <div className="flex items-center justify-between pt-3 mt-1">
                            <div className="inline-flex items-center p-0.5 bg-neutral-155 border border-neutral-200/60 rounded-full shadow-inner bg-neutral-50">
                              <button
                                onClick={() => onUpdateQuantity(item.itemId, item.quantity - 1, item.selectedVariant)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-white transition-all cursor-pointer shadow-sm active:scale-90"
                                title="Decrease"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-8 text-center text-xs text-neutral-950 font-mono font-bold select-none">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.itemId, item.quantity + 1, item.selectedVariant)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-white transition-all cursor-pointer shadow-sm active:scale-90"
                                title="Increase"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.itemId, item.selectedVariant)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
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
                  <div className="bg-neutral-50 px-5 py-5 border border-neutral-200/80 rounded-xl space-y-4 text-left shadow-sm" id="cart-coupon-zone">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 flex items-center gap-1.5 font-bold">
                      <Ticket className="w-3.5 h-3.5 text-amber-600" />
                      <span>Have a promo coupon?</span>
                    </label>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon code (e.g. UPSIDELUXE)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="flex-grow bg-white border border-neutral-300 text-black font-mono uppercase text-xs px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                      <button
                        onClick={handleApplyPromo}
                        className="px-5 bg-black hover:bg-neutral-900 text-white text-xs font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer rounded-lg shadow-sm"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Highly Interactive Recommended Available Promos */}
                    <div className="pt-2">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 mb-2 font-bold">Recommended Coupons (Tap to Apply):</p>
                      <div className="grid grid-cols-1 gap-2">
                        {AVAILABLE_PROMOS.map((promo) => {
                          const isCurrentlyApplied = activePromo?.code === promo.code;
                          return (
                            <button
                              key={promo.code}
                              onClick={() => {
                                if (isCurrentlyApplied) {
                                  handleRemovePromo();
                                } else {
                                  setPromoInput(promo.code);
                                  // Directly apply
                                  setActivePromo(promo);
                                  setPromoSuccess(`"${promo.code}" coupon applied successfully!`);
                                  setPromoError("");
                                  logCustomEvent("promo_applied", { code: promo.code });
                                }
                              }}
                              className={`text-left p-3 border transition-all duration-300 rounded-lg text-xs flex justify-between items-center cursor-pointer ${
                                isCurrentlyApplied 
                                  ? "bg-amber-500/10 border-amber-500 text-amber-950 shadow-sm font-extrabold" 
                                  : "bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50/50"
                              }`}
                            >
                              <div className="font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold tracking-wider text-neutral-900">{promo.code}</span>
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-full font-sans">
                                    {promo.discountPercentage}% OFF
                                  </span>
                                </div>
                                <span className="block text-[10px] text-neutral-500 font-sans mt-0.5 font-semibold">{promo.description}</span>
                              </div>
                              {isCurrentlyApplied ? (
                                <span className="bg-amber-600 text-white rounded-full p-0.5 shadow-sm">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-neutral-400 hover:text-neutral-900 font-extrabold uppercase">Apply</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Promotion validations notifications */}
                    {promoError && (
                      <p className="text-[10px] font-mono text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-100 p-2 rounded-lg font-bold">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{promoError}</span>
                      </p>
                    )}
                    {promoSuccess && (
                      <div className="bg-amber-55 text-amber-900 border border-amber-500/20 p-3 text-[10px] font-mono flex justify-between items-center rounded-lg shadow-sm" id="coupon-active-badge">
                        <span>🎉 {promoSuccess}</span>
                        <button onClick={handleRemovePromo} className="underline text-amber-950 font-extrabold hover:text-rose-600 transition-colors cursor-pointer text-[10px]">
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
                <div className="md:col-span-7 space-y-6">
                  <div className="border-b border-neutral-200 pb-2 flex items-center justify-between">
                    <h3 className="text-sm font-sans font-extrabold tracking-wider text-neutral-900 uppercase">1. Checkout Details</h3>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded-full uppercase">Step 2 of 3</span>
                  </div>

                  {/* Segment: Fulfillment type layout (UX-Friendly Pill Slider) */}
                  <div className="relative flex p-1 bg-neutral-100 rounded-xl border border-neutral-200/80" id="fulfillment-selector">
                    <button
                      type="button"
                      onClick={() => switchCheckoutType("delivery")}
                      className={`relative z-10 flex-1 py-3 text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-300 flex items-center justify-center gap-2 rounded-lg ${
                        formData.type === "delivery" ? "text-white bg-black shadow-sm" : "text-neutral-600 hover:text-black cursor-pointer"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                      <span>Luxury Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => switchCheckoutType("pickup")}
                      className={`relative z-10 flex-1 py-3 text-xs font-mono uppercase tracking-wider font-extrabold transition-all duration-300 flex items-center justify-center gap-2 rounded-lg ${
                        formData.type === "pickup" ? "text-white bg-black shadow-sm" : "text-neutral-600 hover:text-black cursor-pointer"
                      }`}
                    >
                      <Store className="w-3.5 h-3.5" />
                      <span>Boutique Pickup</span>
                    </button>
                  </div>

                  {/* Profile & Account Details Bento Box */}
                  <div className="bg-neutral-50/40 border border-neutral-200/85 rounded-xl p-5 space-y-4 shadow-sm">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 font-extrabold border-b border-neutral-200/60 pb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      <span>Personal Profile</span>
                    </h4>

                    <div className="space-y-4">
                      {/* Customer Name */}
                      <div className="space-y-1 text-left">
                        <label className="text-[11px] text-neutral-600 font-mono block font-bold">Guest Full Name *</label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          </span>
                          <input
                            type="text"
                            name="customerName"
                            required
                            value={formData.customerName}
                            onChange={handleDetailsInputChange}
                            placeholder="E.g., Tosin Otenaike"
                            className="w-full bg-white border border-neutral-300 text-black font-mono text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-lg shadow-sm animate-scaleIn"
                          />
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 text-left">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Mobile Phone Line *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </span>
                            <input
                              type="tel"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleDetailsInputChange}
                              placeholder="Phone number"
                              className="w-full bg-white border border-neutral-300 text-black font-mono text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-lg shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Email Address *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </span>
                            <input
                              type="email"
                              name="email"
                              required
                              value={formData.email}
                              onChange={handleDetailsInputChange}
                              placeholder="E.g., tosin@example.com"
                              className="w-full bg-white border border-neutral-300 text-black font-mono text-xs pl-10 pr-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-lg shadow-sm"
                            />
                          </div>
                          {currentUser ? (
                            <span className="text-[10px] text-emerald-600 font-mono font-extrabold mt-1.5 block">⭐ Logged in as {currentUser.displayName || currentUser.email || "Client"}</span>
                          ) : (
                            <span className="text-[9px] text-neutral-400 font-mono block mt-1.5">Not logged in. Join below or proceed as guest.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Optional Auto-Signup Block if Guest is not logged in */}
                    {!currentUser && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3 mt-4" id="checkout-auth-conversion-promo">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono tracking-widest text-[#ff6b00] uppercase font-extrabold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] animate-pulse" />
                            🔑 Upside Lounge Account (Optional)
                          </span>
                          <button
                            type="button"
                            onClick={onAuthClick}
                            className="text-[9px] font-mono text-amber-800 hover:text-neutral-900 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1 rounded-full uppercase font-bold transition-all cursor-pointer shadow-sm animate-pulse"
                          >
                            Sign In / Log In
                          </button>
                        </div>
                        <p className="text-[10px] text-neutral-600 font-sans leading-relaxed">
                          Provide a password to register your email and instantly create your premium lounge account, securely saving your order transactions and tracking histories.
                        </p>
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] text-neutral-700 font-mono block font-bold">Desired Account Password</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </span>
                            <input
                              type="password"
                              value={checkoutPassword}
                              onChange={(e) => setCheckoutPassword(e.target.value)}
                              placeholder="Min. 6 characters to register"
                              className="w-full bg-white border border-neutral-300 text-black font-mono text-xs pl-10 pr-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-lg shadow-sm"
                            />
                          </div>
                          {registrationMessage && (
                            <p className="text-[9px] font-mono text-[#ff6b00] uppercase tracking-wider mt-1 font-extrabold animate-pulse">
                              ✨ {registrationMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fulfillment & Destination Card */}
                  <div className="bg-neutral-50/40 border border-neutral-200/85 rounded-xl p-5 space-y-4 shadow-sm text-left">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 font-extrabold border-b border-neutral-200/60 pb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>{formData.type === "delivery" ? "Delivery Destination" : "Pickup Location Details"}</span>
                    </h4>

                    {formData.type === "delivery" ? (
                      <div className="space-y-4 animate-fadeIn duration-500">
                        <div className="space-y-1">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Lagos Neighborhood Area *</label>
                          <div className="relative">
                            <select
                              name="area"
                              value={formData.area}
                              onChange={handleDetailsInputChange}
                              className="w-full bg-white border border-neutral-300 text-black font-mono text-xs px-4 py-3.5 focus:outline-none focus:border-amber-500 transition-all font-bold rounded-lg shadow-sm cursor-pointer appearance-none"
                            >
                              {locationsList.map((area) => (
                                <option key={area.id || area.name} value={area.name} className="bg-white text-black font-semibold">
                                  {area.name} (Delivery Fee: ₦{area.fee.toLocaleString()}) {area.isMainland ? "— [Mainland]" : "— [Island]"}
                                </option>
                              ))}
                            </select>
                            <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-neutral-500 font-bold">&#9662;</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-neutral-600 font-mono block font-bold">Full Street Address & Gate Details *</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </span>
                            <input
                              type="text"
                              name="address"
                              required
                              value={formData.address || ""}
                              onChange={handleDetailsInputChange}
                              placeholder="E.g., Apt 4B, 32A Admiralty Way, Lekki 1"
                              className="w-full bg-white border border-neutral-300 text-black font-mono text-xs pl-10 pr-4 py-3.5 focus:outline-none focus:border-amber-500 transition-all font-semibold rounded-lg shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1.5 animate-fadeIn">
                        <span className="text-[10px] font-mono text-[#ff6b00] font-extrabold uppercase">📍 Bayside Sanctuary Lounge Pickup</span>
                        <p className="text-[11px] text-neutral-600 leading-relaxed font-sans font-semibold">
                          Your premium order will be freshly prepped and await your collection directly at the VIP reception desk of **Upside Lekki Bayside sanctuary Lounge**. No delivery charges applied.
                        </p>
                      </div>
                    )}

                    {/* Kitchen Remarks */}
                    <div className="space-y-1 pt-1">
                      <label className="text-[11px] text-neutral-600 font-mono block font-bold">Kitchen Instructions & Remarks</label>
                      <textarea
                        name="customNotes"
                        value={formData.customNotes}
                        onChange={handleDetailsInputChange}
                        placeholder="E.g., Level 5 spicy, extra dressing, leave with concierge reception..."
                        className="w-full bg-white border border-neutral-350 text-black font-mono text-xs px-4 py-3 focus:outline-none focus:border-amber-500 transition-all font-semibold h-20 resize-none rounded-lg shadow-sm"
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
                  <div className="bg-neutral-50/50 border border-neutral-200/85 p-5 rounded-xl space-y-4 shadow-sm" id="woocommerce-payment-box">
                    <h4 className="text-[10px] uppercase font-mono tracking-widest text-neutral-400 font-extrabold border-b border-neutral-200/60 pb-2 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                      <span>Secured Payment Gateways</span>
                    </h4>

                    {/* OPay Interactive Premium Card */}
                    <div 
                      onClick={() => setFormData({ ...formData, paymentMethod: "opay" })}
                      className={`group p-4 border rounded-xl cursor-pointer transition-all duration-300 select-none ${
                        formData.paymentMethod === "opay" 
                          ? "border-[#ff6b00] bg-[#ff6b00]/5 shadow-sm ring-2 ring-[#ff6b00]/5" 
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.paymentMethod === "opay" ? "border-[#ff6b00] bg-[#ff6b00]" : "border-neutral-300"
                          }`}>
                            {formData.paymentMethod === "opay" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-sans font-extrabold text-neutral-900 uppercase tracking-tight block">
                              Pay Securely via OPay
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block font-bold">
                              OPay Wallet • Bank Transfer • Debit Cards
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-[#ff6b00] text-white font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex-shrink-0">
                          OPay
                        </span>
                      </div>
                      <div className={`transition-all duration-500 overflow-hidden ${
                        formData.paymentMethod === "opay" ? "max-h-24 mt-3" : "max-h-0"
                      }`}>
                        <p className="text-[10.5px] text-neutral-600 leading-relaxed font-sans border-t border-[#ff6b00]/10 pt-2.5">
                          Directly initiate an official checkout Cashier Session on OPay's high-speed checkout servers. Pay securely with your secure bank-app transfer or debit card.
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Interactive Premium Card */}
                    <div 
                      onClick={() => setFormData({ ...formData, paymentMethod: "whatsapp" })}
                      className={`group p-4 border rounded-xl cursor-pointer transition-all duration-300 select-none ${
                        formData.paymentMethod === "whatsapp" 
                          ? "border-emerald-600 bg-emerald-500/5 shadow-sm ring-2 ring-emerald-50/10" 
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.paymentMethod === "whatsapp" ? "border-emerald-600 bg-emerald-600" : "border-neutral-300"
                          }`}>
                            {formData.paymentMethod === "whatsapp" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="text-xs font-sans font-extrabold text-neutral-900 uppercase tracking-tight block">
                              Deliver Order via WhatsApp
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block font-bold">
                              Send Direct Invoice Receipt Script
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 flex-shrink-0">
                          <MessageSquare className="w-2.5 h-2.5" /> WA
                        </span>
                      </div>
                      <div className={`transition-all duration-500 overflow-hidden ${
                        formData.paymentMethod === "whatsapp" ? "max-h-24 mt-3" : "max-h-0"
                      }`}>
                        <p className="text-[10.5px] text-neutral-600 leading-relaxed font-sans border-t border-emerald-600/10 pt-2.5">
                          Review complete details and compile an official receipt invoice routed inside WhatsApp to our concierge desk, useful for direct boutique collection.
                        </p>
                      </div>
                    </div>

                    {/* Loading feedback if OPay is active */}
                    {formData.paymentMethod === "opay" && isProcessingOpay && (
                      <div className="text-center py-4 bg-[#ff6b00]/5 border border-[#ff6b00]/25 rounded-xl space-y-2 pt-4" id="opay-processing-indicator">
                        <div className="w-6 h-6 border-2 border-[#ff6b00] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-[10px] uppercase tracking-wider font-mono text-[#ff6b00] font-bold">Contacting OPay Gateway Cashier...</p>
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
                  {formData.paymentMethod === "opay" ? (
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
