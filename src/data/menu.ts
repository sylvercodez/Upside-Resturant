export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags?: string[];
  specs?: string[]; // e.g. details
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "best-sellers", name: "Best Sellers", icon: "Flame", description: "Upside's most celebrated creations" },
  { id: "coffee", name: "Coffee & Espresso", icon: "Coffee", description: "Artisanal espresso & slow bar brew" },
  { id: "cocktails", name: "Signature Cocktails", icon: "GlassWater", description: "Curated mixology & late-night energy" },
  { id: "breakfast", name: "Breakfast & Brunch", icon: "Egg", description: "Start the day with luxury hospitality" },
  { id: "starters", name: "Starters & Soups", icon: "Soup", description: "Light bites & authentic Nigerian pepper soups" },
  { id: "burgers", name: "Burgers", icon: "Salad", description: "Handcrafted gourmet brioche burgers" },
  { id: "grills", name: "Grills & Steaks", icon: "Beef", description: "High-grade steaks & masterfully grilled salmon" },
  { id: "grilled-fish", name: "Grilled Fish", icon: "Fish", description: "Traditional Lagos style slow-charred local fish" },
  { id: "pasta", name: "Pasta & Noodles", icon: "UtensilsCrossed", description: "Artisan fresh pasta with rich bases" },
  { id: "pizza", name: "Gourmet Pizza", icon: "Pizza", description: "Woodfired profile & decadent toppings" },
  { id: "cookies", name: "Cookies & Bakery", icon: "Cookie", description: "Freshly baked daily boutique delights" },
  { id: "beverages", name: "Beverages & Teas", icon: "CupSoda", description: "Healthy smoothies, juices, mocktails & herbal teas" }
];

export const MENU_ITEMS: MenuItem[] = [
  // BEST SELLERS (Selections for landing page highlight)
  {
    id: "mopheth-burger",
    name: "Classic Mopheth Burger",
    description: "Toasted bun, sunny side up egg, bacon, double cheddar cheese, double grilled beef patty, tomato, and lettuce.",
    price: 15200,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature", "Best Seller", "Chef's Special"]
  },
  {
    id: "gourmet-pepperoni-pizza",
    name: "Pepperoni Pizza",
    description: "Flour, yeast, tomato sauce, mozzarella cheese, pepperoni, and fresh oregano baked in high temperature.",
    price: 12500,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    tags: ["Best Seller", "Classic"]
  },
  {
    id: "lemon-butter-salmon",
    name: "Lemon Butter Salmon",
    description: "Pan-seared premium Salmon fillet glaced with fresh lemon juice, butter, roasted garlic, and fine parsley.",
    price: 25500,
    category: "grills",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Luxury", "Best Seller"]
  },
  {
    id: "gizdodo-luxury",
    name: "Upside Gizdodo",
    description: "A decadent Nigerian classic: caramelized sweet plantain cubes, tender gizzards, sauteed onions, garlic, ginger paste, and fragrant scotch bonnet peppers.",
    price: 10000,
    category: "starters",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Lagos Heritage", "Spicy"]
  },
  {
    id: "seafood-pasta",
    name: "Seafood Pasta Especial",
    description: "Linguine, pan-seared sea scallops, calamari, jumbo shrimp, and mussels with a premium garlic bread. Available in white wine cream or tomato base.",
    price: 21000,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Luxury", "Best Seller"]
  },
  {
    id: "espresso-martini-cocktail",
    name: "Espresso Martini",
    description: "Vodka, fresh single shot of house espresso, simple syrup, Baileys, shake with ice blocks and garnished with toasted coffee beans.",
    price: 10000,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Popular", "Late Night"]
  },
  {
    id: "caramel-frappuccino-premium",
    name: "Caramel Frappuccino",
    description: "House espresso blended with cream, authentic vanilla bean ice cream, milk, and sweet golden caramel syrup layer.",
    price: 8000,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800",
    tags: ["Best Seller", "Boutique Brew"]
  },

  // COFFEE & ESPRESSO
  {
    id: "espresso-single",
    name: "Espresso Single",
    description: "Rich full-bodied single shot extraction of premium direct-trade roasted beans.",
    price: 3500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1510972527409-cca19de31749?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "espresso-double",
    name: "Espresso Double",
    description: "Double extraction for deep smoky complexity and intense energy kick.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "americano",
    name: "Americano",
    description: "House espresso lengthened with hot water for a smooth clean profile.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1551046548-53fcdec3a218?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    description: "Equal parts espresso, steamed milk, and velvety rich milk foam.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "cafe-latte",
    name: "Cafe Latte",
    description: "Silky steamed milk poured delicately over a shot of intense house espresso.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    description: "House espresso with steamed milk, sweet French vanilla syrup, and signature caramel drizzle.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "flat-white",
    name: "Flat White",
    description: "Ristretto espresso shots topped with velvety microfinish steamed milk.",
    price: 6500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    description: "Premium stone-ground Japanese matcha whisked with creamy steamed milk.",
    price: 7000,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "ice-coffee-vanilla",
    name: "Iced Coffee Vanilla",
    description: "Double espresso, cold milk, dynamic vanilla pod syrup served over crystal ice.",
    price: 7500,
    category: "coffee",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=800"
  },

  // SIGNATURE COCKTAILS
  {
    id: "long-island",
    name: "Long Island Iced Tea",
    description: "A strong classic: Gin, Tequila, Vodka, Triple Sec, Rum, lemon juice, ice, and a splash of cola.",
    price: 10000,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "mojito",
    name: "Mojito Premium",
    description: "Muddled fresh mint leaves, white rum, lime wedges, simple cane syrup, topped with sparkling club soda.",
    price: 10000,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "classic-margarita",
    name: "Classic Margarita",
    description: "Premium tequila, dynamic triple sec, fresh squeezed lime juice, salted rim, with lemon wheel garnish.",
    price: 10000,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "pina-colada",
    name: "Pina Colada",
    description: "White rum, rich coconut cream or puree, fresh pineapple juice, blended smoothly with ice and garnished.",
    price: 10000,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&q=80&w=800"
  },

  // BREAKFAST
  {
    id: "classic-english-breakfast",
    name: "Classic English Breakfast",
    description: "Premium bacon, gourmet sausages, eggs of your choice (scrambled or sunny side up), golden butter toast, grilled mushroom, plum tomatoes, hash browns, and baked beans.",
    price: 15500,
    category: "breakfast",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Brunch"]
  },
  {
    id: "classic-american-breakfast",
    name: "Classic American Breakfast",
    description: "Bacon strips, gourmet eggs, golden hash browns, and toasted premium bread slice with butter.",
    price: 17200,
    category: "breakfast",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "french-breakfast",
    name: "French Breakfast",
    description: "Warm flaky butter croissant, café au lait (coffee with milk), toasted baguette, premium butter, preserves jam, and seasonal fresh fruit bowl.",
    price: 18500,
    category: "breakfast",
    image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&q=80&w=800"
  },

  // STARTERS & SOUPS
  {
    id: "prawns-spring-roll",
    name: "Prawns Spring Roll",
    description: "Fresh prawns, spring onion, ginger, garlic, light soy sauce, sesame oil, white pepper in crispy wrap, served with house special garlic mayonnaise.",
    price: 4000,
    category: "starters",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "chicken-lemon-salad",
    name: "Chicken Lemon Salad",
    description: "Seared chicken breast, citrus lemon juice vinaigrette, olive oil dressing, Dijon mustard, mixed field greens, cherry tomatoes, premium feta crumbs, and fresh parsley.",
    price: 10000,
    category: "starters",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "asun-dodo",
    name: "Asun Dodo Deluxe",
    description: "Zesty peppered goat meat cubes tossed with sweet fried plantain wedges, red onion, garlic, ginger paste, and native scotch bonnet pepper.",
    price: 10000,
    category: "starters",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Lagos Crowd Best"]
  },
  {
    id: "catfish-pepper-soup",
    name: "Catfish Pepper Soup",
    description: "Slow-simmered local catfish in native broth infused with ground uziza seeds, ginger, garlic, scent leaves, and scotch bonnet peppers. Deeply aromatic.",
    price: 20000,
    category: "starters",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Traditional"]
  },

  // BURGERS
  {
    id: "beef-burger-premium",
    name: "Elite Beef Burger",
    description: "Artisan blue cheese, caramelized sweet onions, smoked bacon, double flame-grilled beef, fresh arugula, and rich garlic infusion mayo on potato bun.",
    price: 13350,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "crispy-burger-special",
    name: "Crispy Golden Burger",
    description: "Toasted brioche bun, house-made crispy onion rings, succulent beef patty, sweet BBQ glaze, and spicy garlic mayo.",
    price: 15200,
    category: "burgers",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800"
  },

  // GRILLS & STEAKS
  {
    id: "garlic-honey-salmon",
    name: "Garlic Honey Glazed Salmon",
    description: "Salmon fillet cooked in sweet wild honey and garlic glaze with soy sauce, fresh ginger, and olive oil.",
    price: 27300,
    category: "grills",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
    tags: ["Glazed Luxury"]
  },
  {
    id: "ribeye-steak-house",
    name: "Gourmet Ribeye Steak",
    description: "350g of premium dry-aged Ribeye beef flame-grilled to order with garlic, sprigs of wild thyme, rosemary butter, served with seasonal grilled veg, mashed potato, and house mushroom gravy.",
    price: 32500,
    category: "grills",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800",
    tags: ["Steakhouse Choice", "Prime Cut"]
  },
  {
    id: "lamb-chops",
    name: "Rosemary Lamb Chops",
    description: "Delicate lamb chops pan-seared in rich olive oil, fresh garlic, rosemary thyme butter, served with steamed asparagus and seasoned rice.",
    price: 35000,
    category: "grills",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
  },

  // GRILLED FISH
  {
    id: "grilled-tilapia",
    name: "Grilled Tilapia Fish",
    description: "Whole fresh Tilapia slow charred on hot griddle, brushed with pepper sauce, served with roasted skin-on potato wedges or sweet fried dodo and fresh side salad.",
    price: 21500,
    category: "grilled-fish",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "grilled-croaker",
    name: "Grilled Croaker Fish",
    description: "Premium large Croaker fish marinated in Lagos spice blend, charcoal grilled, served with native steamed white rice or crispy French fries.",
    price: 35200,
    category: "grilled-fish",
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Sea Grill"]
  },

  // PASTA
  {
    id: "fettuccine-alfredo",
    name: "Fettuccine Alfredo Pasta",
    description: "Tender fettuccine tossed in a rich, velvety butter and aged parmesan reduction cream, with chicken breast and garlic toasted bread.",
    price: 18500,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "spaghetti-carbonara",
    name: "Spaghetti Carbonara",
    description: "Authentic style with fettuccine, shaved premium parmesan cheese, cured pancetta strips, fresh cream, egg yolk emulsification, and garlic bread.",
    price: 15200,
    category: "pasta",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800"
  },

  // PIZZA
  {
    id: "veg-pizza",
    name: "Veggie Feast Pizza",
    description: "Rustic tomato sauce base, grilled onions, capsicum peppers, button mushrooms, black olives, sweet corn kernels, and wild herbs.",
    price: 10000,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "bbq-chicken-pizza",
    name: "BBQ Chicken Pizza",
    description: "Smokey house BBQ sauce layer, flame shredded chicken breast, melted mozzarella cheese, red onions, and sweet bell peppers.",
    price: 14000,
    category: "pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800"
  },

  // COOKIES & BAKERY
  {
    id: "walnut-cookie-boutique",
    name: "Chocolate Chip Walnut Cookie",
    description: "Thick freshly baked cookie with French butter, cane sugar, egg, toasted walnuts, and premium dark chocolate chunks.",
    price: 4000,
    category: "cookies",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Freshly Baked"]
  },
  {
    id: "dark-chocolate-cookie",
    name: "Dark Chocolate Chip Cookie",
    description: "Rich dark cocoa flour base with decadent Belgian deep cocoa chocolate chips and butter profile.",
    price: 4000,
    category: "cookies",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f1f?auto=format&fit=crop&q=80&w=800"
  },

  // BEVERAGES, TEAS, HEALTH
  {
    id: "strawberry-smoothie",
    name: "Strawberry Smoothie Boost",
    description: "Blend of frozen strawberry puree, pure squeezed orange juice, and cold ice cubes.",
    price: 6500,
    category: "beverages",
    image: "https://images.unsplash.com/photo-1553530979-7ee52a2670c4?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "zobo-delight",
    name: "Zobo Delight Signature",
    description: "Special brewed premium Hibiscus flower tea infused with fresh pineapple skin, cloves, spicy ginger extract, sweetened with wild local honey.",
    price: 7000,
    category: "beverages",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&q=80&w=800",
    tags: ["Heritage Drink", "Organic Selection"]
  },
  {
    id: "green-tea-organic",
    name: "Green Tea Organic Ritual",
    description: "Premium whole leaf green tea served hot with natural wildflower honey, pure cane sugar, and a shot of warm milk.",
    price: 3500,
    category: "beverages",
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&q=80&w=800"
  }
];

export const COMBOS = [
  {
    id: "combo-1",
    name: "Lagos Night Out Feast",
    items: ["Mopheth Platter", "2x Long Island Iced Tea"],
    price: 45000,
    saving: 5600,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "combo-2",
    name: "The Executive Sunrise Brunch",
    items: ["Classic English Breakfast", "Americano", "Zobo Delight Signature"],
    price: 24000,
    saving: 5000,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800"
  }
];

export const REVIEWS = [
  {
    id: "rev-1",
    name: "Tolulope. A",
    role: "Lagos Lifestyle Critic",
    rating: 5,
    text: "The Mopheth Burger is an absolutely incredible work of culinary art. Outstanding luxury ambience and insanely fast home delivery. Truly Lagos' premium hospitality destination.",
    date: "May 2026"
  },
  {
    id: "rev-2",
    name: "Chinedu. O",
    role: "Artisanal Coffee Enthusiast",
    rating: 5,
    text: "World-class baristas. The microfoam on their Flat White is perfection, matching the level of high-end coffee spots in London or Milan. Absolute favorite space in Lekki.",
    date: "April 2026"
  },
  {
    id: "rev-3",
    name: "Funmi. A",
    role: "Vanguard Event Producer",
    rating: 5,
    text: "We hosted an intimate VIP dinner here and the guests were blown away by the Catfish Pepper Soup and the signature cocktails. Luxury at its most authentic.",
    date: "May 2026"
  }
];
