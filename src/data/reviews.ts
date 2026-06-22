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
    id: "g-review-1",
    name: "Damilola Adegbite",
    role: "Local Guide",
    date: "1 week ago",
    text: "I absolutely love Upside! The vibe is unmatched. By day it is a very calm and aesthetic cafe work spot with great coffee (the caramel macchiato is perfect), and by night it transforms into a stunning fine dining space. The lemon butter salmon and signature steaks are to die for. Definitely one of the best spots in Lekki!",
    rating: 5
  },
  {
    id: "g-review-2",
    name: "Kelechi Nnamdi",
    role: "Local Guide",
    date: "2 weeks ago",
    text: "Amazing customer service and top notch gastronomy. We held a small private dinner here and the team was extremely helpful. The cocktail menu is very creative and the food plating is a work of art. Highly recommend the loaded waffles and the ribeye steaks.",
    rating: 5
  },
  {
    id: "g-review-3",
    name: "Femi Alao",
    role: "Local Guide",
    date: "a month ago",
    text: "Hands down the best coffee shop and dynamic lounge in Lagos right now. The ambiance is very modern, elegant, and high-end. The wifi is fast and the workspace is perfect for meetings during the day. Their OPay/WhatsApp order options are incredibly swift.",
    rating: 5
  },
  {
    id: "g-review-4",
    name: "Temitope Balogun",
    role: "Local Guide",
    date: "3 weeks ago",
    text: "Upside is a beautifully curated aesthetic sanctuary. Every corner is picture-perfect. Had their breakfast pancakes, prawns spring rolls, and a refreshing mocktail. The staff are polite, and safety is excellent. Will definitely make this my weekly routine.",
    rating: 5
  },
  {
    id: "g-review-5",
    name: "Chinedu Okafor",
    role: "Local Guide",
    date: "2 months ago",
    text: "A remarkable culinary experience in Lekki. The fusion of fine dining and a daytime café is done beautifully. Their steaks have the perfect sear, and the mocktails are so refreshing. A 10/10 venue for both casual work and upscale dates.",
    rating: 5
  }
];
