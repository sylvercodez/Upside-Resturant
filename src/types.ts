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
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Direct traffic to our active Cloud Run container backend if the user is visiting from the custom public domain
    if (
      host === "upside-restaurant-cafe.com" || 
      (host && !host.includes("run.app") && !host.includes("localhost") && !host.includes("127.0.0.1"))
    ) {
      return `https://ais-pre-sbzn5bjecas4gnypehx4a5-856555242900.europe-west2.run.app${cleanPath}`;
    }
  }
  return cleanPath;
}

