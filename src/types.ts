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
  seatingArea: "Standard" | "VIP Lounge" | "Terrace Garden" | "Bar Counter";
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

export const LAGOS_AREAS = [
  { name: "Ikoyi", fee: 3500 },
  { name: "Victoria Island", fee: 3000 },
  { name: "Lekki Phase 1", fee: 4000 },
  { name: "Lekki Phase 2", fee: 4500 },
  { name: "Banana Island", fee: 5000 },
  { name: "Ikeja GRA", fee: 6000 },
  { name: "Maryland / Gbagada", fee: 5500 }
];
