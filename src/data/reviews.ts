export interface Review {
  id: string;
  name: string;
  role: string;
  date: string;
  text: string;
  rating?: number;
}

export const REVIEWS: Review[] = [
  {
    id: "g-review-drew",
    name: "Drew Foeva",
    role: "Local Guide",
    date: "a month ago",
    text: "Upside Restaurant & Cafe serves some of the best pastries and coffee in Lekki. The croissants were fresh, the coffee was rich and perfectly brewed. Highly recommend for a relaxed breakfast or coffee break.",
    rating: 5
  },
  {
    id: "g-review-fredrick",
    name: "Umukoro Fredrick Ohwofasa",
    role: "Verified Guest",
    date: "a month ago",
    text: "Your burger was so juicy, well seasoned and filling.",
    rating: 5
  },
  {
    id: "g-review-3",
    name: "Chidinma Egwu",
    role: "Verified Guest",
    date: "2 weeks ago",
    text: "Beautiful layout, great ambience, and excellent plating. Perfect space for remote work during the day and elite dining at night.",
    rating: 4.5
  },
  {
    id: "g-review-4",
    name: "Akinola Peters",
    role: "Elite Diner",
    date: "3 weeks ago",
    text: "Very cozy spot in Lekki for cocktails and upscale breakfast. The service is polite and fast. Will definitely visit again.",
    rating: 4.8
  },
  {
    id: "g-review-5",
    name: "Bolanle Cole",
    role: "Local Guide",
    date: "a month ago",
    text: "Love the aesthetic here! Outstanding service and top-tier presentations. The loaded waffles and caramel latte were perfect.",
    rating: 5
  }
];
