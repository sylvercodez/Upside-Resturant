export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedVariant?: string;
  selectedExtras?: string[];
  notes?: string;
}

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  seatingArea: "Standard" | "Executive Lounge" | "Terrace Garden" | "Bar Counter";
  specialOccasion?: string;
  specialRequests?: string;
  status: "pending" | "confirmed";
}

export interface CheckoutDetails {
  customerName: string;
  email: string;
  phone: string;
  type: "delivery" | "pickup";
  address: string;
  area: string;
  paymentMethod: "paystack" | "whatsapp" | "cash" | "opay";
  promoCode: string;
  customNotes?: string;
}

export interface PromoCode {
  code: string;
  discountPercentage: number;
  description: string;
}

export const AVAILABLE_PROMOS: PromoCode[] = [
  { code: "UPSIDELUXE", discountPercentage: 15, description: "15% off first class dining experience" },
  { code: "LAGOSNIGHTS", discountPercentage: 10, description: "10% off signature night drinks" },
  { code: "KAFE2026", discountPercentage: 20, description: "20% special discount on premium bakery & coffee" }
];

export interface ShippingLocation {
  id: string;
  name: string;
  fee: number;
  isMainland?: boolean;
  deleted?: boolean;
}

export const LAGOS_AREAS: ShippingLocation[] = [
  { id: "ikoyi", name: "Ikoyi", fee: 0, isMainland: false },
  { id: "victoria-island", name: "Victoria Island", fee: 3000, isMainland: false },
  { id: "lekki-1", name: "Lekki Phase 1", fee: 4000, isMainland: false },
  { id: "lekki-2", name: "Lekki Phase 2", fee: 4500, isMainland: false },
  { id: "banana-island", name: "Banana Island", fee: 5000, isMainland: false },
  { id: "ikeja-gra", name: "Ikeja GRA", fee: 6000, isMainland: true },
  { id: "gbagada", name: "Maryland / Gbagada", fee: 5500, isMainland: true }
];

export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    // Map standalone dev client (5173 / 3001) to the active backend sandbox port 3000
    if (origin.includes("localhost:5173") || origin.includes("127.0.0.1:5173") || origin.includes(":5173") || origin.includes(":3001")) {
      return `http://localhost:3000${cleanPath}`;
    }
    // Respect custom injected API endpoint boundaries
    const customApiBase = (import.meta as any).env?.VITE_API_BASE_URL;
    if (customApiBase) {
      return `${customApiBase}${cleanPath}`;
    }
  }
  return cleanPath;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  tags?: string[];
  specs?: string[];
  variants?: { name: string; price: number }[];
  extras?: { name: string; price: number }[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}


