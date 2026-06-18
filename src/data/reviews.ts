export interface Review {
  id: string;
  name: string;
  role: string;
  date: string;
  text: string;
}

export const REVIEWS: Review[] = [
  {
    id: "review-1",
    name: "Kunle A.",
    role: "Managing Partner",
    date: "June 2026",
    text: "The signature Espresso Sensation paired with the Warm Croissant is my absolute daily routine. Hands down the finest craft coffee lounge and artisanal roastery in Lekki, Lagos."
  },
  {
    id: "review-2",
    name: "Amara O.",
    role: "Creative Director",
    date: "May 2026",
    text: "Their Grilled T-Bone Steak and buttery Lemon Butter Salmon are phenomenal. The minimalist, high-contrast concrete design of Upside lounge elevated the entire gourmet dining experience."
  },
  {
    id: "review-3",
    name: "Tunde W.",
    role: "Tech Founder",
    date: "June 2026",
    text: "A true sanctuary of gastronomy and premium Arabica beans. The flat white is incredibly smooth, and the hospitality plus fast Wi-Fi make it my go-to executive workspace."
  },
  {
    id: "review-4",
    name: "Zainab Y.",
    role: "Lifestyle Curator",
    date: "June 2026",
    text: "I love the tropical Mango Smoothie and the hand-wrapped Prawns Spring Roll. Every culinary detail—from aesthetic curation, plating to ingredient freshness—is exceptionally high-caliber."
  }
];
