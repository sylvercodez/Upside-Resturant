export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags?: string[];
  specs?: string[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "coffee", name: "Coffee", icon: "Coffee", description: "Freshly brewed hot espresso and milk selections" },
  { id: "ice-coffee", name: "Ice Coffee", icon: "GlassWater", description: "Chilled espresso iced coffee treats" },
  { id: "frappuccino", name: "Frappuccino", icon: "IceCream", description: "Blended ice, milk, espresso and decadent syrups" },
  { id: "smoothie", name: "Smoothie", icon: "CupSoda", description: "Thick, creamy blends of fresh fruits and purees" },
  { id: "milkshake", name: "Milkshake", icon: "Dessert", description: "Rich ice cream milkshakes topped with whipped cream" },
  { id: "fruit-juice", name: "Fruit Juice", icon: "Citrus", description: "Freshly squeezed natural fruit juices" },
  { id: "signature-drinks", name: "Signature Drinks", icon: "Sparkles", description: "Exclusive Upside mocktails and local custom blends" },
  { id: "cocktail", name: "Cocktail", icon: "Wine", description: "Premium spirits mixed with fresh ingredients" },
  { id: "mocktail", name: "Mocktail", icon: "GlassWater", description: "Alcohol-free refreshing juices and mixers" },
  { id: "teas", name: "Teas", icon: "Soup", description: "Hot aromatic leaf teas infused with honey and sugar" },
  { id: "extras", name: "Extras", icon: "PlusCircle", description: "Additional sides, toppings, syrup, and extra shots" }
];

export const MENU_ITEMS: MenuItem[] = [
  // ==========================================
  // COFFEE (16 Items)
  // ==========================================
  {
    id: "espresso-single",
    name: "Espresso Single",
    price: 3500,
    category: "coffee",
    description: "Coffee",
    image: "https://images.unsplash.com/photo-151097252790b-af4f42dfbee9?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Strong", "Classic"]
  },
  {
    id: "espresso-double",
    name: "Espresso Double",
    price: 6500,
    category: "coffee",
    description: "Coffee",
    image: "https://images.unsplash.com/photo-151097252790b-af4f42dfbee9?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Double", "Classic"]
  },
  {
    id: "americano",
    name: "Americano",
    price: 6500,
    category: "coffee",
    description: "Coffee and Water",
    image: "https://images.unsplash.com/photo-1551030173-1d2056c14725?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Unsweetened"]
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "https://images.unsplash.com/photo-1571115177098-24ec420971b5?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Frothy"]
  },
  {
    id: "cafe-latte",
    name: "Cafe Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Smooth"]
  },
  {
    id: "macchiato",
    name: "Macchiato",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Milky"]
  },
  {
    id: "cafe-mocha",
    name: "Cafe Mocha",
    price: 6500,
    category: "coffee",
    description: "Coffee, Chocolate Sauce, and Milk",
    image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Chocolate", "Sweet"]
  },
  {
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    price: 6500,
    category: "coffee",
    description: "Coffee, Caramel Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1596426462742-1bf7ebefb3b1?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Caramel", "Creamy"]
  },
  {
    id: "vanilla-latte",
    name: "Vanilla Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Vanilla Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=800",
    tags: ["Vanilla", "Sweet", "Hot"]
  },
  {
    id: "hazelnut-latte",
    name: "Hazelnut Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Hazelnut Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=800",
    tags: ["Hazelnut", "Nutty", "Hot"]
  },
  {
    id: "coconut-mocha-latte",
    name: "Coconut Mocha Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Chocolate Sauce, Coconut Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fc9f?auto=format&fit=crop&q=80&w=800",
    tags: ["Coconut", "Chocolate", "Tropical"]
  },
  {
    id: "flat-white",
    name: "Flat White",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Strong", "Velvety"]
  },
  {
    id: "white-americano",
    name: "White Americano",
    price: 6500,
    category: "coffee",
    description: "Coffee, Milk, and Water",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800",
    tags: ["Hot", "Classic"]
  },
  {
    id: "chai-latte",
    name: "Chai Latte",
    price: 6500,
    category: "coffee",
    description: "Chai Powder and Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Chai Spice", "Aromatic", "Hot"]
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    price: 6500,
    category: "coffee",
    description: "Chocolate Powder and Milk",
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=800",
    tags: ["Rich Coco", "Decadent", "Hot"]
  },
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    price: 7000,
    category: "coffee",
    description: "Matcha Powder and Milk",
    image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=800",
    tags: ["Antioxidant", "Green Tea", "Premium"]
  },

  // ==========================================
  // ICE COFFEE (4 Items)
  // ==========================================
  {
    id: "ice-coffee-vanilla",
    name: "Ice Coffee Vanilla",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Vanilla Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&q=80&w=800",
    tags: ["Cold", "Vanilla", "Espresso"]
  },
  {
    id: "ice-coffee-chocolate",
    name: "Ice Coffee Chocolate",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Chocolate Sauce, and Milk",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=800",
    tags: ["Cold", "Mocha Chocolate", "Rich"]
  },
  {
    id: "ice-coffee-caramel",
    name: "Ice Coffee Caramel",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Caramel Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&q=80&w=800",
    tags: ["Cold", "Caramel Drizzle", "Sweet"]
  },
  {
    id: "hazelnut-ice-coffee",
    name: "Hazelnut Ice Coffee",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Hazelnut Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?auto=format&fit=crop&q=80&w=800",
    tags: ["Cold", "Hazelnut", "Nutty"]
  },

  // ==========================================
  // FRAPPUCCINO (4 Items)
  // ==========================================
  {
    id: "caramel-frappuccino",
    name: "Caramel Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Caramel Ice Cream, and Caramel Syrup",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    tags: ["Blended Ice", "Drizzle", "Ice Cream"]
  },
  {
    id: "vanilla-frappuccino",
    name: "Vanilla Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Vanilla Ice Cream, and Syrup",
    image: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=800",
    tags: ["Blended Ice", "Vanilla Ice Cream"]
  },
  {
    id: "chocolate-frappuccino",
    name: "Chocolate Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Chocolate Ice Cream, and Chocolate Sauce",
    image: "https://images.unsplash.com/photo-1572490122820-a61bd8abf3cc?auto=format&fit=crop&q=80&w=800",
    tags: ["Blended Ice", "Chocolate Overload"]
  },
  {
    id: "hazelnut-frappuccino",
    name: "Hazelnut Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Hazelnut Ice Cream, and Syrup",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    tags: ["Blended Ice", "Nutty Delicacy"]
  },

  // ==========================================
  // SMOOTHIE (5 Items)
  // ==========================================
  {
    id: "strawberry-smoothie",
    name: "Strawberry Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Strawberry Pure, Orange Juice, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800",
    tags: ["Dairy Free", "Real Fruit", "Vibrant"]
  },
  {
    id: "mango-smoothie",
    name: "Mango Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Mango Pure, Orange Juice, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800",
    tags: ["Mango Puree", "Tropical"]
  },
  {
    id: "passion-smoothie",
    name: "Passion Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Passion Pure, Orange Juice, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=800",
    tags: ["Zesty", "Passion Fruit"]
  },
  {
    id: "banana-smoothie",
    name: "Banana Smoothie",
    price: 7000,
    category: "smoothie",
    description: "Banana Pure, Orange Juice, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800",
    tags: ["Banana Puree", "Thick", "Healthy"]
  },
  {
    id: "peach-smoothie",
    name: "Peach Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Peach Pure, Orange Juice, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800",
    tags: ["Peach Puree", "Classic Sweet"]
  },

  // ==========================================
  // MILKSHAKE (6 Items)
  // ==========================================
  {
    id: "strawberry-milkshake",
    name: "Strawberry Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Strawberry, Ice Cream, Whipped Cream, and Milk",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    tags: ["Strawberry Core", "Luxury Cream"]
  },
  {
    id: "vanilla-milkshake",
    name: "Vanilla Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Vanilla Ice Cream, Whipped Cream, Vanilla Syrup, and Milk",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=800",
    tags: ["Creamy Vanilla", "Topped Whipped Cream"]
  },
  {
    id: "caramel-milkshake",
    name: "Caramel Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Caramel Ice Cream, Caramel Syrup, Whipped Cream, and Milk",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    tags: ["Rich Caramel", "Savoury Sweet"]
  },
  {
    id: "chocolate-milkshake",
    name: "Chocolate Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Chocolate Ice Cream, Chocolate Sauce, Whipped Cream, and Milk",
    image: "https://images.unsplash.com/photo-1572490122820-a61bd8abf3cc?auto=format&fit=crop&q=80&w=800",
    tags: ["Fudge Sauce", "Belgium Choco"]
  },
  {
    id: "oreo-banana-milkshake",
    name: "Oreo Banana Milkshake",
    price: 9500,
    category: "milkshake",
    description: "Oreo Ice Cream, Fresh Banana, Oreo, Milk, and Whipped Cream",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800",
    tags: ["Oreo Crumbs", "Fresh Banana Blend"]
  },
  {
    id: "strawberry-banana-milkshake",
    name: "Strawberry Banana Milkshake",
    price: 9500,
    category: "milkshake",
    description: "Strawberry, Fresh Banana, Ice Cream, Whipped Cream, and Milk",
    image: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Fruity", "Gourmet Shake"]
  },

  // ==========================================
  // FRUIT JUICE (8 Items)
  // ==========================================
  {
    id: "apple-juice",
    name: "Apple Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Apples",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Squeezed", "100% Organic"]
  },
  {
    id: "orange-juice",
    name: "Orange Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Orange",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    tags: ["Vitamin C Booster", "Cold Pressed"]
  },
  {
    id: "carrot-juice",
    name: "Carrot Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Carrots",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800",
    tags: ["Detox Beta-Carotene"]
  },
  {
    id: "ginger-juice",
    name: "Ginger Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Ginger",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    tags: ["Immune Kick", "Hot Zesty"]
  },
  {
    id: "watermelon-juice",
    name: "Watermelon Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Watermelon",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    tags: ["Ultra Hydrating", "Sweet Crisp"]
  },
  {
    id: "pineapple-juice",
    name: "Pineapple Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Pineapple",
    image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800",
    tags: ["Tangy", "Tropical"]
  },
  {
    id: "packed-juice",
    name: "Packed Juice(CUP)",
    price: 3500,
    category: "fruit-juice",
    description: "Packed Juice(CUP)",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800",
    tags: ["Cup Format", "Grab & Go"]
  },
  {
    id: "mopheth-water",
    name: "Mopheth Bottle water",
    price: 1500,
    category: "fruit-juice",
    description: "Mopheth Bottle water",
    image: "https://images.unsplash.com/photo-1608885898957-a599fb15ec36?auto=format&fit=crop&q=80&w=800",
    tags: ["Pure Chilled Table Water"]
  },

  // ==========================================
  // SIGNATURE DRINKS (4 Items)
  // ==========================================
  {
    id: "zobo-delight",
    name: "Zobo delight",
    price: 7000,
    category: "signature-drinks",
    description: "Zobo delight",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Hibiscus", "Upside Heritage", "Local Favorite"]
  },
  {
    id: "arizona-sunset",
    name: "Arizona sunset",
    price: 7000,
    category: "signature-drinks",
    description: "Arizona sunset",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Layered Sunset Citrus", "Vibrant Accent"]
  },
  {
    id: "upside-mornings",
    name: "Upside mornings",
    price: 7000,
    category: "signature-drinks",
    description: "Upside mornings",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Day Kickstart", "Fruity Mix"]
  },
  {
    id: "evelyn",
    name: "Evelyn",
    price: 7000,
    category: "signature-drinks",
    description: "Evelyn",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Evelyn Twist", "Aromatic Herb"]
  },

  // ==========================================
  // COCKTAIL (16 Items)
  // ==========================================
  {
    id: "long-island",
    name: "Long Island",
    price: 10000,
    category: "cocktail",
    description: "Gin, Tequila, Vodka, Triple Sec, Rum, Lemon Juice, Ice Cubes, and a Splash of Coke",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Ultimate Blend", "Aqueous Layer", "Strong"]
  },
  {
    id: "mojito",
    name: "Mojito",
    price: 10000,
    category: "cocktail",
    description: "Rum, Lime Wedges, Simple Syrup, Mint Leaf, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Mint Leaf", "Clean Rum", "Classic Mint"]
  },
  {
    id: "classic-margarita",
    name: "Classic Margarita",
    price: 10000,
    category: "cocktail",
    description: "Tequila, Simple Syrup, Triple Sec, Lime Juice, and a Lemon Wheel for Garnish",
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&q=80&w=800",
    tags: ["Lime Rim Salted", "Tequila Gold"]
  },
  {
    id: "whisky-sour",
    name: "Whisky Sour",
    price: 10000,
    category: "cocktail",
    description: "Whisky, Lemon Juice, Simple Syrup, and Egg White (Optional)",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Whisky Bold", "Egg Foam Layer"]
  },
  {
    id: "tequila-sunrise",
    name: "Tequila Sunrise",
    price: 10000,
    category: "cocktail",
    description: "Tequila, Orange Juice, Grenadine Syrup, Ice Cubes, and an Orange Wheel for Garnish",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Grenadine Slump", "Tequila", "Citrus Splash"]
  },
  {
    id: "gin-basil",
    name: "Gin Basil",
    price: 10000,
    category: "cocktail",
    description: "Gin, Lemon Juice, Simple Syrup, Basil Leaf, and Lemon Slice/Basil Leaf for Garnish",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Spiced Basil", "Botanical Gin"]
  },
  {
    id: "virgin-chapman-cocktail",
    name: "Virgin Chapman",
    price: 10000,
    category: "cocktail",
    description: "Orange Juice, Sprite, Fanta, Drops of Angostura Bitters, Grenadine Syrup, and an Orange Wheel/Cucumber for Garnish",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Angostura", "Lagos Sensation"]
  },
  {
    id: "sex-on-the-beach",
    name: "Sex on the Beach",
    price: 10000,
    category: "cocktail",
    description: "Vodka, Peach Schnapps or Puree, Cranberry Juice, Orange Juice, and Ice",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Vodka Selection", "Peach Blend"]
  },
  {
    id: "mai-tai",
    name: "Mai Tai",
    price: 10000,
    category: "cocktail",
    description: "White Rum, Dark Rum, Orange Curacao, Lime Juice, Orgeat Syrup, and Ice Cubes",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Double Rum", "Tropical Orgeat"]
  },
  {
    id: "french-75",
    name: "French 75",
    price: 10000,
    category: "cocktail",
    description: "Gin, Lemon Juice, Simple Syrup, and Champagne",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Gin Core", "Bubbly Champagne"]
  },
  {
    id: "rum-punch",
    name: "Rum Punch",
    price: 10000,
    category: "cocktail",
    description: "Dark Rum, Pineapple Juice, Orange Juice, and Grenadine",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Dark Spiced Rum", "Pineapple Fruity"]
  },
  {
    id: "mimosa",
    name: "Mimosa",
    price: 10000,
    category: "cocktail",
    description: "Orange Juice and Prosecco",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Breakfast Mimosa", "Italian Prosecco"]
  },
  {
    id: "london-mule",
    name: "London Mule",
    price: 10000,
    category: "cocktail",
    description: "Gin, Fresh Ginger Juice, Lemon Juice, Simple Syrup, Angostura Bitters, and Lime Slice for Garnish",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Bold Ginger Kick", "Botanical Gin"]
  },
  {
    id: "ameratour-sour",
    name: "Ameratour Sour",
    price: 10000,
    category: "cocktail",
    description: "Ameratour Liquor, Simple Syrup, Lemon Juice, Angostura Bitters, Ice Cubes, and Lemon Slice/Cherry for Garnish",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    tags: ["Exclusive Ameratour", "Cherry Topped"]
  },
  {
    id: "pina-colada",
    name: "Pina Colada",
    price: 10000,
    category: "cocktail",
    description: "White Rum, Coconut Cream or Puree, Pineapple Juice, Ice Cubes, and Pineapple Slice for Garnish",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Creamy Coconut", "Rum Bliss"]
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    price: 10000,
    category: "cocktail",
    description: "Vodka, Single Espresso Shot, Simple Syrup, Baileys, Ice Cubes, and Coffee Beans for Garnish",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Vodka", "Caffeine Shoot", "Creamy Baileys"]
  },

  // ==========================================
  // MOCKTAIL (10 Items)
  // ==========================================
  {
    id: "fruit-punch-mocktail",
    name: "Fruit Punch",
    price: 7000,
    category: "mocktail",
    description: "Orange Juice, Pineapple Juice, Cranberry Juice, and Grenadine Syrup",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Fruit Fusion", "Alcohol Free"]
  },
  {
    id: "virgin-strawberry-daiquiri",
    name: "Virgin Strawberry Daiquiri",
    price: 7000,
    category: "mocktail",
    description: "Strawberries, Grenadine Syrup, Lime Juice, Simple Syrup, and Ice (Garnished with Strawberry)",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Fruity Slush", "Fresh Berries"]
  },
  {
    id: "mango-mojito",
    name: "Mango Mojito",
    price: 7000,
    category: "mocktail",
    description: "Mango Puree, Mango Pieces, Lemon Juice, Simple Syrup, and a Splash of Sprite",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Mint", "Aromatic Mango"]
  },
  {
    id: "passion-fruit-mojito",
    name: "Passion Fruit Mojito",
    price: 7000,
    category: "mocktail",
    description: "Passion Fruit Puree, Mint Leaves, Lemon Juice, Simple Syrup, and a Splash of Sprite",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Passion", "Bubbly Sprite"]
  },
  {
    id: "passion-boaster",
    name: "Passion Boaster",
    price: 7000,
    category: "mocktail",
    description: "Passion Fruit Puree, Orange Juice, Pineapple Juice, Simple Syrup, blended with Ice",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Immune Fuel", "Triple Juice"]
  },
  {
    id: "virgin-chapman-mocktail",
    name: "Virgin Chapman",
    price: 7000,
    category: "mocktail",
    description: "Orange Juice, Sprite, Fanta, Angostura Bitters, Grenadine Syrup, and Garnish",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Mocktail", "Refreshing"]
  },
  {
    id: "chapman",
    name: "Chapman",
    price: 7000,
    category: "mocktail",
    description: "Fresh Orange Juice, Fanta, Sprite, and Grenadine Syrup",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Double Soda Citrus"]
  },
  {
    id: "lemonade",
    name: "Lemonade",
    price: 7000,
    category: "mocktail",
    description: "Fresh Lemon Juice, Sugar, and Ice",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Sour-Sweet"]
  },
  {
    id: "ice-tea",
    name: "Ice Tea",
    price: 7000,
    category: "mocktail",
    description: "Lipton Tea Bag, Peach Pure, Lemon Juice, and Ice",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Peach Infused Tea", "Refreshing Cold"]
  },
  {
    id: "minted-lemonade",
    name: "Minted Lemonade",
    price: 7000,
    category: "mocktail",
    description: "Fresh Mint Leaves, Fresh Lemon Juice, Sugar, and Ice",
    image: "https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&q=80&w=800",
    tags: ["Muddled Mint", "Cool Zesty"]
  },

  // ==========================================
  // TEAS (9 Items)
  // ==========================================
  {
    id: "green-tea",
    name: "Green Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Warm", "Healthy", "Immunity"]
  },
  {
    id: "english-breakfast",
    name: "English Breakfast",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Breakfast Tea"]
  },
  {
    id: "camomile",
    name: "Camomile",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Relaxation Blend", "Calm Floral"]
  },
  {
    id: "earl-gray-tea",
    name: "Earl Gray Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Bergamot Aroma", "Classic Black"]
  },
  {
    id: "strawberry-tea",
    name: "Strawberry Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Fruity Brew", "Double Berry Flavor"]
  },
  {
    id: "cranberry-tea",
    name: "Cranberry Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Tart Cranberry Blend"]
  },
  {
    id: "mint-tea",
    name: "Mint Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Peppermint Leaves", "Warm Crisp"]
  },
  {
    id: "ginger-and-lemon",
    name: "Ginger and Lemon",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy Ginger", "Vitamin C Lemon"]
  },
  {
    id: "peppermint-tea",
    name: "Peppermint Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800",
    tags: ["Cooling", "Digestive Friendly"]
  },

  // ==========================================
  // EXTRAS (5 Items)
  // ==========================================
  {
    id: "extra-syrup",
    name: "Extra Syrup",
    price: 1500,
    category: "extras",
    description: "Extra sweetening syrup",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Topping Addition"]
  },
  {
    id: "extra-honey",
    name: "Extra honey",
    price: 1200,
    category: "extras",
    description: "Premium extra honey",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Organic Honey Addition"]
  },
  {
    id: "extra-milk",
    name: "Extra milk",
    price: 1000,
    category: "extras",
    description: "Creamy extra milk",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Whole Milk Shot"]
  },
  {
    id: "extra-espresso",
    name: "Extra espresso",
    price: 3500,
    category: "extras",
    description: "Additional boost espresso shot",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Double Shot Boost"]
  },
  {
    id: "whipped-cream-extra",
    name: "Whipped cream",
    price: 1500,
    category: "extras",
    description: "Fluffy rich whipped cream",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Whipped Top-up"]
  }
];

export const COMBOS = [
  {
    id: "combo-1",
    name: "The Morning Boost Duo",
    items: ["Espresso Double", "Caramel Macchiato"],
    price: 11000,
    saving: 2000,
    image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "combo-2",
    name: "The Ultimate Sweet Summer Combo",
    items: ["Caramel Frappuccino", "Oreo Banana Milkshake"],
    price: 15500,
    saving: 2000,
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800"
  }
];

export const REVIEWS = [
  {
    id: "rev-1",
    name: "Tolulope. A",
    role: "Lagos Café Critic",
    rating: 5,
    text: "The Espresso Martini and Caramel Frappuccino are pure perfection. Upside maintains the premium Lekki standard.",
    date: "June 2026"
  },
  {
    id: "rev-2",
    name: "Chinedu. O",
    role: "Artisanal Coffee Blogger",
    rating: 5,
    text: "Remarkable latte art and smooth beans. The local twist with Zobo Delight and Arizona Sunset is absolutely genius.",
    date: "June 2026"
  },
  {
    id: "rev-3",
    name: "Funmi. A",
    role: "Vanguard Event Planner",
    rating: 5,
    text: "Upside Restaurant & Café is our absolute favorite catering destination. Their cocktails and signature drinks are unmatched.",
    date: "June 2026"
  }
];
