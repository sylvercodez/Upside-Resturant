import { MenuItem } from "../types";

export const DRINKS: MenuItem[] = [
  // ==========================================
  // COFFEE (16 Items)
  // ==========================================
  {
    id: "espresso-single",
    name: "Espresso Single",
    price: 3500,
    category: "coffee",
    description: "Coffee",
    image: "none",
    tags: ["Hot", "Strong", "Classic"]
  },
  {
    id: "espresso-double",
    name: "Espresso Double",
    price: 6500,
    category: "coffee",
    description: "Coffee",
    image: "none",
    tags: ["Hot", "Double", "Classic"]
  },
  {
    id: "americano",
    name: "Americano",
    price: 6500,
    category: "coffee",
    description: "Coffee and Water",
    image: "none",
    tags: ["Hot", "Unsweetened"]
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "none",
    tags: ["Hot", "Frothy"]
  },
  {
    id: "cafe-latte",
    name: "Cafe Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "none",
    tags: ["Hot", "Smooth"]
  },
  {
    id: "macchiato",
    name: "Macchiato",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "none",
    tags: ["Hot", "Milky"]
  },
  {
    id: "cafe-mocha",
    name: "Cafe Mocha",
    price: 6500,
    category: "coffee",
    description: "Coffee, Chocolate Sauce, and Milk",
    image: "none",
    tags: ["Hot", "Chocolate", "Sweet"]
  },
  {
    id: "caramel-macchiato",
    name: "Caramel Macchiato",
    price: 6500,
    category: "coffee",
    description: "Coffee, Caramel Syrup, and Milk",
    image: "none",
    tags: ["Hot", "Caramel", "Creamy"]
  },
  {
    id: "vanilla-latte",
    name: "Vanilla Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Vanilla Syrup, and Milk",
    image: "none",
    tags: ["Vanilla", "Sweet", "Hot"]
  },
  {
    id: "hazelnut-latte",
    name: "Hazelnut Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Hazelnut Syrup, and Milk",
    image: "none",
    tags: ["Hazelnut", "Nutty", "Hot"]
  },
  {
    id: "coconut-mocha-latte",
    name: "Coconut Mocha Latte",
    price: 6500,
    category: "coffee",
    description: "Coffee, Chocolate Sauce, Coconut Syrup, and Milk",
    image: "none",
    tags: ["Coconut", "Chocolate", "Tropical"]
  },
  {
    id: "flat-white",
    name: "Flat White",
    price: 6500,
    category: "coffee",
    description: "Coffee and Milk",
    image: "none",
    tags: ["Hot", "Strong", "Velvety"]
  },
  {
    id: "white-americano",
    name: "White Americano",
    price: 6500,
    category: "coffee",
    description: "Coffee, Milk, and Water",
    image: "none",
    tags: ["Hot", "Classic"]
  },
  {
    id: "chai-latte",
    name: "Chai Latte",
    price: 6500,
    category: "coffee",
    description: "Chai Powder and Milk",
    image: "none",
    tags: ["Chai Spice", "Aromatic", "Hot"]
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    price: 6500,
    category: "coffee",
    description: "Chocolate Powder and Milk",
    image: "none",
    tags: ["Rich Coco", "Decadent", "Hot"]
  },
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    price: 7000,
    category: "coffee",
    description: "Matcha Powder and Milk",
    image: "none",
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
    image: "none",
    tags: ["Cold", "Vanilla", "Espresso"]
  },
  {
    id: "ice-coffee-chocolate",
    name: "Ice Coffee Chocolate",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Chocolate Sauce, and Milk",
    image: "none",
    tags: ["Cold", "Mocha Chocolate", "Rich"]
  },
  {
    id: "ice-coffee-caramel",
    name: "Ice Coffee Caramel",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Caramel Syrup, and Milk",
    image: "none",
    tags: ["Cold", "Caramel Drizzle", "Sweet"]
  },
  {
    id: "hazelnut-ice-coffee",
    name: "Hazelnut Ice Coffee",
    price: 7500,
    category: "ice-coffee",
    description: "Espresso, Hazelnut Syrup, and Milk",
    image: "none",
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
    image: "none",
    tags: ["Blended Ice", "Drizzle", "Ice Cream"]
  },
  {
    id: "vanilla-frappuccino",
    name: "Vanilla Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Vanilla Ice Cream, and Syrup",
    image: "none",
    tags: ["Blended Ice", "Vanilla Ice Cream"]
  },
  {
    id: "chocolate-frappuccino",
    name: "Chocolate Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Chocolate Ice Cream, and Chocolate Sauce",
    image: "none",
    tags: ["Blended Ice", "Chocolate Overload"]
  },
  {
    id: "hazelnut-frappuccino",
    name: "Hazelnut Frappuccino",
    price: 8000,
    category: "frappuccino",
    description: "Espresso, Milk, Hazelnut Ice Cream, and Syrup",
    image: "none",
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
    image: "none",
    tags: ["Dairy Free", "Real Fruit", "Vibrant"]
  },
  {
    id: "mango-smoothie",
    name: "Mango Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Mango Pure, Orange Juice, and Ice Cubes",
    image: "none",
    tags: ["Mango Puree", "Tropical"]
  },
  {
    id: "passion-smoothie",
    name: "Passion Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Passion Pure, Orange Juice, and Ice Cubes",
    image: "none",
    tags: ["Zesty", "Passion Fruit"]
  },
  {
    id: "banana-smoothie",
    name: "Banana Smoothie",
    price: 7000,
    category: "smoothie",
    description: "Banana Pure, Orange Juice, and Ice Cubes",
    image: "none",
    tags: ["Banana Puree", "Thick", "Healthy"]
  },
  {
    id: "peach-smoothie",
    name: "Peach Smoothie",
    price: 6500,
    category: "smoothie",
    description: "Peach Pure, Orange Juice, and Ice Cubes",
    image: "none",
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
    image: "none",
    tags: ["Strawberry Core", "Luxury Cream"]
  },
  {
    id: "vanilla-milkshake",
    name: "Vanilla Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Vanilla Ice Cream, Whipped Cream, Vanilla Syrup, and Milk",
    image: "none",
    tags: ["Creamy Vanilla", "Topped Whipped Cream"]
  },
  {
    id: "caramel-milkshake",
    name: "Caramel Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Caramel Ice Cream, Caramel Syrup, Whipped Cream, and Milk",
    image: "none",
    tags: ["Rich Caramel", "Savoury Sweet"]
  },
  {
    id: "chocolate-milkshake",
    name: "Chocolate Milkshake",
    price: 8000,
    category: "milkshake",
    description: "Chocolate Ice Cream, Chocolate Sauce, Whipped Cream, and Milk",
    image: "none",
    tags: ["Fudge Sauce", "Belgium Choco"]
  },
  {
    id: "oreo-banana-milkshake",
    name: "Oreo Banana Milkshake",
    price: 9500,
    category: "milkshake",
    description: "Oreo Ice Cream, Fresh Banana, Oreo, Milk, and Whipped Cream",
    image: "none",
    tags: ["Oreo Crumbs", "Fresh Banana Blend"]
  },
  {
    id: "strawberry-banana-milkshake",
    name: "Strawberry Banana Milkshake",
    price: 9500,
    category: "milkshake",
    description: "Strawberry, Fresh Banana, Ice Cream, Whipped Cream, and Milk",
    image: "none",
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
    image: "none",
    tags: ["Fresh Squeezed", "100% Organic"]
  },
  {
    id: "orange-juice",
    name: "Orange Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Orange",
    image: "none",
    tags: ["Vitamin C Booster", "Cold Pressed"]
  },
  {
    id: "carrot-juice",
    name: "Carrot Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Carrots",
    image: "none",
    tags: ["Detox Beta-Carotene"]
  },
  {
    id: "ginger-juice",
    name: "Ginger Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Ginger",
    image: "none",
    tags: ["Immune Kick", "Hot Zesty"]
  },
  {
    id: "watermelon-juice",
    name: "Watermelon Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Watermelon",
    image: "none",
    tags: ["Ultra Hydrating", "Sweet Crisp"]
  },
  {
    id: "pineapple-juice",
    name: "Pineapple Juice",
    price: 7000,
    category: "fruit-juice",
    description: "Fresh Pineapple",
    image: "none",
    tags: ["Tangy", "Tropical"]
  },
  {
    id: "packed-juice",
    name: "Packed Juice(CUP)",
    price: 3500,
    category: "fruit-juice",
    description: "Packed Juice(CUP)",
    image: "none",
    tags: ["Cup Format", "Grab & Go"]
  },
  {
    id: "mopheth-water",
    name: "Mopheth Bottle water",
    price: 1500,
    category: "fruit-juice",
    description: "Mopheth Bottle water",
    image: "none",
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
    image: "none",
    tags: ["Hibiscus", "Upside Heritage", "Local Favorite"]
  },
  {
    id: "arizona-sunset",
    name: "Arizona sunset",
    price: 7000,
    category: "signature-drinks",
    description: "Arizona sunset",
    image: "none",
    tags: ["Layered Sunset Citrus"]
  },
  {
    id: "upside-mornings",
    name: "Upside mornings",
    price: 7000,
    category: "signature-drinks",
    description: "Upside mornings",
    image: "none",
    tags: ["Day Kickstart", "Fruity Mix"]
  },
  {
    id: "evelyn",
    name: "Evelyn",
    price: 7000,
    category: "signature-drinks",
    description: "Evelyn",
    image: "none",
    tags: ["Signature Twist", "Aromatic Herb"]
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
    image: "none",
    tags: ["Ultimate Blend", "Strong"]
  },
  {
    id: "mojito",
    name: "Mojito",
    price: 10000,
    category: "cocktail",
    description: "Rum, Lime Wedges, Simple Syrup, Mint Leaf, and Ice Cubes",
    image: "none",
    tags: ["Fresh Mint Leaf", "Classic Mint"]
  },
  {
    id: "classic-margarita",
    name: "Classic Margarita",
    price: 10000,
    category: "cocktail",
    description: "Tequila, Simple Syrup, Triple Sec, Lime Juice, and a Lemon Wheel for Garnish",
    image: "none",
    tags: ["Lime Rim Salted", "Tequila Gold"]
  },
  {
    id: "whisky-sour",
    name: "Whisky Sour",
    price: 10000,
    category: "cocktail",
    description: "Whisky, Lemon Juice, Simple Syrup, and Egg White (Optional)",
    image: "none",
    tags: ["Whisky Bold", "Egg Foam Layer"]
  },
  {
    id: "tequila-sunrise",
    name: "Tequila Sunrise",
    price: 10000,
    category: "cocktail",
    description: "Tequila, Orange Juice, Grenadine Syrup, Ice Cubes, and an Orange Wheel for Garnish",
    image: "none",
    tags: ["Grenadine Slump", "Tequila", "Citrus Splash"]
  },
  {
    id: "gin-basil",
    name: "Gin Basil",
    price: 10000,
    category: "cocktail",
    description: "Gin, Lemon Juice, Simple Syrup, Basil Leaf, and Lemon Slice/Basil Leaf for Garnish",
    image: "none",
    tags: ["Spiced Basil", "Botanical Gin"]
  },
  {
    id: "virgin-chapman-cocktail",
    name: "Virgin Chapman",
    price: 10000,
    category: "cocktail",
    description: "Orange Juice, Sprite, Fanta, Drops of Angostura Bitters, Grenadine Syrup, and an Orange Wheel/Cucumber for Garnish",
    image: "none",
    tags: ["Classic Angostura", "Lagos Sensation"]
  },
  {
    id: "sex-on-the-beach",
    name: "Sex on the Beach",
    price: 10000,
    category: "cocktail",
    description: "Vodka, Peach Schnapps or Puree, Cranberry Juice, Orange Juice, and Ice",
    image: "none",
    tags: ["Vodka Selection", "Peach Blend"]
  },
  {
    id: "mai-tai",
    name: "Mai Tai",
    price: 10000,
    category: "cocktail",
    description: "White Rum, Dark Rum, Orange Curacao, Lime Juice, Orgeat Syrup, and Ice Cubes",
    image: "none",
    tags: ["Double Rum", "Tropical Orgeat"]
  },
  {
    id: "french-75",
    name: "French 75",
    price: 10000,
    category: "cocktail",
    description: "Gin, Lemon Juice, Simple Syrup, and Champagne",
    image: "none",
    tags: ["Gin Core", "Bubbly Champagne"]
  },
  {
    id: "rum-punch",
    name: "Rum Punch",
    price: 10000,
    category: "cocktail",
    description: "Dark Rum, Pineapple Juice, Orange Juice, and Grenadine",
    image: "none",
    tags: ["Dark Spiced Rum", "Pineapple Fruity"]
  },
  {
    id: "mimosa",
    name: "Mimosa",
    price: 10000,
    category: "cocktail",
    description: "Orange Juice and Prosecco",
    image: "none",
    tags: ["Breakfast Mimosa", "Italian Prosecco"]
  },
  {
    id: "london-mule",
    name: "London Mule",
    price: 10000,
    category: "cocktail",
    description: "Gin, Fresh Ginger Juice, Lemon Juice, Simple Syrup, Angostura Bitters, and Lime Slice for Garnish",
    image: "none",
    tags: ["Bold Ginger Kick", "Botanical Gin"]
  },
  {
    id: "ameratour-sour",
    name: "Ameratour Sour",
    price: 10000,
    category: "cocktail",
    description: "Ameratour Liquor, Simple Syrup, Lemon Juice, Angostura Bitters, Ice Cubes, and Lemon Slice/Cherry for Garnish",
    image: "none",
    tags: ["Exclusive", "Cherry Topped"]
  },
  {
    id: "pina-colada",
    name: "Pina Colada",
    price: 10000,
    category: "cocktail",
    description: "White Rum, Coconut Cream or Puree, Pineapple Juice, Ice Cubes, and Pineapple Slice for Garnish",
    image: "none",
    tags: ["Creamy Coconut", "Rum Bliss"]
  },
  {
    id: "espresso-martini",
    name: "Espresso Martini",
    price: 10000,
    category: "cocktail",
    description: "Vodka, Single Espresso Shot, Simple Syrup, Baileys, Ice Cubes, and Coffee Beans for Garnish",
    image: "none",
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
    image: "none",
    tags: ["Fruit Fusion", "Alcohol Free"]
  },
  {
    id: "virgin-strawberry-daiquiri",
    name: "Virgin Strawberry Daiquiri",
    price: 7000,
    category: "mocktail",
    description: "Strawberries, Grenadine Syrup, Lime Juice, Simple Syrup, and Ice (Garnished with Strawberry)",
    image: "none",
    tags: ["Fruity Slush", "Fresh Berries"]
  },
  {
    id: "mango-mojito",
    name: "Mango Mojito",
    price: 7000,
    category: "mocktail",
    description: "Mango Puree, Mango Pieces, Lemon Juice, Simple Syrup, and a Splash of Sprite",
    image: "none",
    tags: ["Fresh Mint", "Aromatic Mango"]
  },
  {
    id: "passion-fruit-mojito",
    name: "Passion Fruit Mojito",
    price: 7000,
    category: "mocktail",
    description: "Passion Fruit Puree, Mint Leaves, Lemon Juice, Simple Syrup, and a Splash of Sprite",
    image: "none",
    tags: ["Fresh Passion", "Bubbly Sprite"]
  },
  {
    id: "passion-boaster",
    name: "Passion Boaster",
    price: 7000,
    category: "mocktail",
    description: "Passion Fruit Puree, Orange Juice, Pineapple Juice, Simple Syrup, blended with Ice",
    image: "none",
    tags: ["Immune Fuel", "Triple Juice"]
  },
  {
    id: "virgin-chapman-mocktail",
    name: "Virgin Chapman",
    price: 7000,
    category: "mocktail",
    description: "Orange Juice, Sprite, Fanta, Angostura Bitters, Grenadine Syrup, and Garnish",
    image: "none",
    tags: ["Classic Mocktail", "Refreshing"]
  },
  {
    id: "chapman",
    name: "Chapman",
    price: 7000,
    category: "mocktail",
    description: "Fresh Orange Juice, Fanta, Sprite, and Grenadine Syrup",
    image: "none",
    tags: ["Double Soda Citrus"]
  },
  {
    id: "lemonade",
    name: "Lemonade",
    price: 7000,
    category: "mocktail",
    description: "Fresh Lemon Juice, Sugar, and Ice",
    image: "none",
    tags: ["Classic Sour-Sweet"]
  },
  {
    id: "ice-tea",
    name: "Ice Tea",
    price: 7000,
    category: "mocktail",
    description: "Lipton Tea Bag, Peach Pure, Lemon Juice, and Ice",
    image: "none",
    tags: ["Peach Infused", "Refreshing"]
  },
  {
    id: "minted-lemonade",
    name: "Minted Lemonade",
    price: 7000,
    category: "mocktail",
    description: "Fresh Mint Leaves, Fresh Lemon Juice, Sugar, and Ice",
    image: "none",
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
    image: "none",
    tags: ["Warm", "Healthy", "Immunity"]
  },
  {
    id: "english-breakfast",
    name: "English Breakfast",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Classic Breakfast Tea"]
  },
  {
    id: "camomile",
    name: "Camomile",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Relaxation Blend", "Calm Floral"]
  },
  {
    id: "earl-gray-tea",
    name: "Earl Gray Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Bergamot", "Classic Black"]
  },
  {
    id: "strawberry-tea",
    name: "Strawberry Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Fruity Brew", "Berry Flavor"]
  },
  {
    id: "cranberry-tea",
    name: "Cranberry Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Tart Cranberry Blend"]
  },
  {
    id: "mint-tea",
    name: "Mint Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Fresh Mint Leaves", "Warm Crisp"]
  },
  {
    id: "ginger-and-lemon",
    name: "Ginger and Lemon",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Spicy Ginger", "Vitamin C"]
  },
  {
    id: "peppermint-tea",
    name: "Peppermint Tea",
    price: 3500,
    category: "teas",
    description: "Hot Water, Honey, Sugar, and Hot Milk",
    image: "none",
    tags: ["Cooling", "Digestive"]
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
    image: "none",
    tags: ["Topping"]
  },
  {
    id: "extra-honey",
    name: "Extra honey",
    price: 1200,
    category: "extras",
    description: "Premium extra honey",
    image: "none",
    tags: ["Honey Addition"]
  },
  {
    id: "extra-milk",
    name: "Extra milk",
    price: 1000,
    category: "extras",
    description: "Creamy extra milk",
    image: "none",
    tags: ["Whole Milk Shot"]
  },
  {
    id: "extra-espresso",
    name: "Extra espresso",
    price: 3500,
    category: "extras",
    description: "Additional boost espresso shot",
    image: "none",
    tags: ["Double Shot Boost"]
  },
  {
    id: "whipped-cream-extra",
    name: "Whipped cream",
    price: 1500,
    category: "extras",
    description: "Fluffy rich whipped cream",
    image: "none",
    tags: ["Whipped Top-up"]
  }
];
