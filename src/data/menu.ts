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
  { id: "starters", name: "Starter", icon: "Soup", description: "Fresh appetizers and pepper soups" },
  { id: "sandwiches", name: "Sandwich", icon: "Salad", description: "Bespoke gourmet sandwiches" },
  { id: "breakfast", name: "Breakfast", icon: "Egg", description: "Every morning classic plate" },
  { id: "burgers", name: "Burger", icon: "Salad", description: "Premium handcrafted brioche burgers" },
  { id: "pasta", name: "Pasta", icon: "UtensilsCrossed", description: "Hearty Italian-style pasta creations" },
  { id: "grills", name: "Grilled & Steaks", icon: "Beef", description: "Steakhouse cuts and fine salmon grills" },
  { id: "grilled-fish", name: "Grilled Fish", icon: "Fish", description: "Traditional slow-charred local fish" },
  { id: "platters", name: "Platters", icon: "Flame", description: "Ultimate sharing platters" },
  { id: "pizza", name: "Pizza", icon: "Pizza", description: "Woodfired profile & decadent toppings" },
  { id: "cookies", name: "Cookies", icon: "Cookie", description: "Bespoke cookies and daily bakery" },
  { id: "salad", name: "Salad", icon: "Salad", description: "Crisp organic salads" }
];

export const MENU_ITEMS: MenuItem[] = [
  // ==========================================
  // STARTERS (13 Items)
  // ==========================================
  {
    id: "prawns-spring-roll",
    name: "Prawns spring roll",
    price: 15000,
    category: "starters",
    description: "Prawns, spring onion, ginger paste, garlic, soy sauce, sesame oil, cornflour, white pepper, spring roll wrapper, and mayonnaise.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    tags: ["Seafood", "Crispy"]
  },
  {
    id: "chicken-lemon-salad",
    name: "Chicken lemon salad",
    price: 10000,
    category: "starters",
    description: "Chicken breast, lemon juice, olive oil, dijon mustard, mixed greens, cherry tomatoes, feta cheese, and fresh parsley.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800",
    tags: ["Zesty", "Healthy"]
  },
  {
    id: "cocktail-prawns",
    name: "Cocktail prawns",
    price: 15000,
    category: "starters",
    description: "Prawns, mayonnaise, ketchup, worcestershire sauce, cayenne pepper, lettuce, lemon wedges, and parsley.",
    image: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&q=80&w=800",
    tags: ["Seafood", "Classic"]
  },
  {
    id: "spicy-chicken-wings",
    name: "Spicy Chicken wings",
    price: 10000,
    category: "starters",
    description: "Chicken wings, hot sauce, garlic powder, paprika, and blue cheese.",
    image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Crowd Favorite"]
  },
  {
    id: "barbeque-chicken-wings",
    name: "Barbeque chicken wings",
    price: 10000,
    category: "starters",
    description: "Chicken wings, BBQ sauce, olive oil, smoked paprika, garlic powder, onion powder, and pepper.",
    image: "https://images.unsplash.com/photo-1527477396000-e2cb8622c2f7?auto=format&fit=crop&q=80&w=800",
    tags: ["BBQ", "Savoury"]
  },
  {
    id: "classic-crispy-chicken-wings",
    name: "Classic Crispy chicken wings",
    price: 10000,
    category: "starters",
    description: "Chicken wings, cornflakes, paprika, garlic powder, onion powder, and black pepper.",
    image: "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=800",
    tags: ["Crispy", "Wings"]
  },
  {
    id: "butterfly-prawns",
    name: "Butterfly Prawns",
    price: 12500,
    category: "starters",
    description: "Prawns, lemon juice, butter, and fresh parsley.",
    image: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&q=80&w=800",
    tags: ["Seafood", "Pan-Seared"]
  },
  {
    id: "crispy-calamari",
    name: "Crispy Calamari",
    price: 13500,
    category: "starters",
    description: "Squid rings, flour, cornstarch, buttermilk, lemon wedges, garlic powder, and paprika.",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=800",
    tags: ["Crispy", "Seafood"]
  },
  {
    id: "gizdodo",
    name: "Gizdodo",
    price: 15500,
    category: "starters",
    description: "Plantain, gizzards, onion, garlic, ginger paste, and scotch bonnet pepper.",
    image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&q=80&w=800",
    tags: ["Lagos Heritage", "Spicy"]
  },
  {
    id: "asun-dodo",
    name: "Asun dodo",
    price: 15000,
    category: "starters",
    description: "Plantain, goat, chicken or beef, onion, garlic, ginger paste, and scotch bonnet pepper.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Traditional"]
  },
  {
    id: "catfish-pepper-soup",
    name: "Catfish pepper soup",
    price: 20000,
    category: "starters",
    description: "Catfish, scotch bonnet pepper, onion, garlic, ginger, ground uziza seeds, and fresh parsley.",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Authentic"]
  },
  {
    id: "chicken-pepper-soup",
    name: "Chicken pepper soup",
    price: 12500,
    category: "starters",
    description: "Chicken, scotch bonnet pepper, onion, garlic, ginger, ground uziza seeds, and fresh parsley.",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Hearty"]
  },
  {
    id: "goat-meat-pepper-soup",
    name: "Goat meat pepper soup",
    price: 10000,
    category: "starters",
    description: "Goat meat, scotch bonnet pepper, onion, garlic, ginger, ground uziza seeds, and fresh parsley.",
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Signature"]
  },

  // ==========================================
  // SANDWICH (10 Items)
  // ==========================================
  {
    id: "classic-grilled-cheese-sandwich",
    name: "Classic Grilled Cheese Sandwich",
    price: 12500,
    category: "sandwiches",
    description: "Bread, cheddar or mozzarella cheese, and butter.",
    image: "https://images.unsplash.com/photo-1525351326368-efbb5cb6814d?auto=format&fit=crop&q=80&w=800",
    tags: ["Vegetarian", "Cheesy"]
  },
  {
    id: "veg-club-sandwich",
    name: "Veg Club Sandwich",
    price: 10000,
    category: "sandwiches",
    description: "Bread, lettuce, tomato, cucumber, onion, and mayonnaise.",
    image: "https://images.unsplash.com/photo-1562059390-a761a084768e?auto=format&fit=crop&q=80&w=800",
    tags: ["Vegetarian", "Fresh"]
  },
  {
    id: "chicken-mayo-sandwich",
    name: "Chicken Mayo Sandwich",
    price: 14500,
    category: "sandwiches",
    description: "Shredded chicken, mayonnaise, and bread.",
    image: "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&q=80&w=800",
    tags: ["Chicken", "Creamy"]
  },
  {
    id: "egg-salad-sandwich",
    name: "Egg Salad Sandwich",
    price: 12500,
    category: "sandwiches",
    description: "Boiled egg, mayonnaise, mustard, and bread.",
    image: "https://images.unsplash.com/photo-1604467707321-70d5ac45adda?auto=format&fit=crop&q=80&w=800",
    tags: ["Savoury", "Morning Choice"]
  },
  {
    id: "tuna-sandwich",
    name: "Tuna Sandwich",
    price: 13200,
    category: "sandwiches",
    description: "Tuna, mayo, onion, lemon juice, and bread.",
    image: "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic", "Seafood"]
  },
  {
    id: "peanut-butter-and-jelly-sandwich",
    name: "Peanut Butter and Jelly Sandwich",
    price: 12200,
    category: "sandwiches",
    description: "Peanut butter, jam/jelly, and bread.",
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&q=80&w=800",
    tags: ["Sweet", "Familiar"]
  },
  {
    id: "paneer-tikka-sandwich",
    name: "Paneer Tikka Sandwich",
    price: 13200,
    category: "sandwiches",
    description: "Grilled paneer, chutney or mayo, onion, capsicum, and bread.",
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Vegetarian"]
  },
  {
    id: "blt-sandwich",
    name: "BLT Sandwich",
    price: 10200,
    category: "sandwiches",
    description: "Bacon, lettuce, tomato, mayo, and toasted bread.",
    image: "https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&q=80&w=800",
    tags: ["Bacon", "Classic"]
  },
  {
    id: "avocado-sandwich",
    name: "Avocado Sandwich",
    price: 10800,
    category: "sandwiches",
    description: "Avocado, lime juice, bread, tomato, and lettuce.",
    image: "https://images.unsplash.com/photo-1603046891744-1f76eb10aec1?auto=format&fit=crop&q=80&w=800",
    tags: ["Healthy", "Vegetarian"]
  },
  {
    id: "chicken-grilled-sandwich",
    name: "Chicken Grilled Sandwich",
    price: 15000,
    category: "sandwiches",
    description: "Chicken breast, olive oil, garlic powder, paprika, bread (ciabatta or baguette), lettuce, tomato, and mayonnaise.",
    image: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?auto=format&fit=crop&q=80&w=800",
    tags: ["Gourmet", "Hearty"]
  },

  // ==========================================
  // BREAKFAST (5 Items)
  // ==========================================
  {
    id: "classic-english-breakfast",
    name: "Classic English Breakfast",
    price: 15500,
    category: "breakfast",
    description: "Bacon, sausages, eggs (scrambled or sunny side up), toast, mushroom, tomatoes, hash browns, and baked beans.",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=800",
    tags: ["Luxury", "Signature"]
  },
  {
    id: "classic-american-breakfast",
    name: "Classic American breakfast",
    price: 17200,
    category: "breakfast",
    description: "Bacon, eggs (scrambled or fried), hash browns, and toasted bread.",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic English"]
  },
  {
    id: "french-breakfast",
    name: "French Breakfast",
    price: 18500,
    category: "breakfast",
    description: "Croissant, cafe au lait, baguette, butter, jam, and yogurt or fresh fruit.",
    image: "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&q=80&w=800",
    tags: ["Elegant", "Continental"]
  },
  {
    id: "fruit-waffles-or-pancakes",
    name: "Fruit waffles or pancakes",
    price: 12500,
    category: "breakfast",
    description: "Waffles or pancakes, vanilla extract, ice cream, fresh fruit (blueberries, strawberry), and maple syrup or honey.",
    image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&q=80&w=800",
    tags: ["Sweet", "Gourmet"]
  },
  {
    id: "breakfast-pancakes",
    name: "Breakfast pancakes",
    price: 14500,
    category: "breakfast",
    description: "Pancakes, prawns cocktail, butter, sunny side up eggs, and fresh juice.",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&q=80&w=800",
    tags: ["Seafood twist", "Creative"]
  },

  // ==========================================
  // BURGER (6 Items)
  // ==========================================
  {
    id: "beef-burger",
    name: "Beef Burger",
    price: 13350,
    category: "burgers",
    description: "Blue cheese, bacon, grilled beef, caramelized onions, arugula, and garlic mayo.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Blue cheese", "Gourmet"]
  },
  {
    id: "southern-style-coleslaw-burger",
    name: "Southern-Style Coleslaw Burger",
    price: 14000,
    category: "burgers",
    description: "Potato bun, southern style coleslaw, grilled beef patty, bbq sauce, and fried tomato.",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800",
    tags: ["Coleslaw", "BBQ Clad"]
  },
  {
    id: "crispy-burger",
    name: "Crispy Burger",
    price: 15200,
    category: "burgers",
    description: "Brioche bun, crispy onion rings, beef patty, bbq sauce, and garlic mayo.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Onion Rings", "BBQ"]
  },
  {
    id: "classic-mopheth-burger-exact",
    name: "Classic Mopheth Burger",
    price: 15200,
    category: "burgers",
    description: "Toasted bun, sunny side up egg, bacon, double cheddar cheese, double grilled beef patty, tomato, and lettuce.",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800",
    tags: ["Egg", "Signature"]
  },
  {
    id: "jalapeno-burger",
    name: "Jalapeno Burger",
    price: 15200,
    category: "burgers",
    description: "Brioche bun, cheddar cheese, tomato, pickled jalapeno, jack cheese, grilled beef patty, iceberg lettuce, chipotle mayo, and red onion rings.",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Jalapeno"]
  },
  {
    id: "dill-pickles-burger",
    name: "Dill Pickles Burger",
    price: 12500,
    category: "burgers",
    description: "Toasted bun, lettuce, bacon, sharp cheddar, burger sauce, red onion, dill pickles, and double grilled beef patty.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Tangy", "Dill Pickles"]
  },

  // ==========================================
  // PASTA (6 Items)
  // ==========================================
  {
    id: "spaghetti-alla-pomodoro",
    name: "Spaghetti Alla Pomodoro",
    price: 18500,
    category: "pasta",
    description: "Spaghetti, fresh tomatoes, parmesan cheese, fresh basil, garlic, and olive oil.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Light", "Italian"]
  },
  {
    id: "fettuccine-alfredo-pasta",
    name: "Fettuccine Alfredo Pasta",
    price: 18500,
    category: "pasta",
    description: "Fettuccine, butter, parmesan cheese, and chicken or mushroom with garlic bread.",
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&q=80&w=800",
    tags: ["Creamy", "Aromatic"]
  },
  {
    id: "spaghetti-carbonara-exact",
    name: "Spaghetti Carbonara",
    price: 15200,
    category: "pasta",
    description: "Fettuccine, parmesan cheese, pancetta, bacon, cream, and garlic bread.",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800",
    tags: ["Rich", "Traditional"]
  },
  {
    id: "penne-allarrabbiata",
    name: "Penne Allarrabbiata",
    price: 18200,
    category: "pasta",
    description: "Penne pasta, tomatoes, garlic, chili, olive oil, parsley, and garlic bread with chicken or beef.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Spicy", "Sharp"]
  },
  {
    id: "spaghetti-bolognese",
    name: "Spaghetti Bolognese",
    price: 18300,
    category: "pasta",
    description: "Ground beef, tomatoes, onion, carrot, celery, red wine, and spaghetti with garlic bread.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Bolognese", "Beef Blend"]
  },
  {
    id: "seafood-pasta-exact",
    name: "Seafood Pasta",
    price: 21000,
    category: "pasta",
    description: "Linguine, sea scallops, calamari, shrimp, mussels, and garlic bread with cream or tomato base.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Luxury", "Seafood Selection"]
  },

  // ==========================================
  // GRILLED & STEAKS (13 Items)
  // ==========================================
  {
    id: "lemon-butter-salmon-exact",
    name: "Lemon Butter Salmon",
    price: 27900,
    category: "grills",
    description: "Salmon, lemon juice, butter, garlic, and parsley.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Premium", "Lemon Butter"]
  },
  {
    id: "garlic-honey-glazed-salmon",
    name: "Garlic Honey Glazed Salmon",
    price: 27300,
    category: "grills",
    description: "Salmon, honey, soy sauce, garlic, and olive oil.",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800",
    tags: ["Savoury Glaze", "Salmon"]
  },
  {
    id: "herb-crusted-baked-salmon",
    name: "Herb-Crusted Baked Salmon",
    price: 27800,
    category: "grills",
    description: "Salmon, dill, parsley, breadcrumbs, lemon zest, mustard, and olive oil.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Baked Salmon", "Herb Crusted"]
  },
  {
    id: "teriyaki-salmon",
    name: "Teriyaki Salmon",
    price: 31500,
    category: "grills",
    description: "Salmon, soy sauce, mirin, sake, ginger, sesame seeds, and green onions with white rice or sautéed potato.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Asian Twist", "Sweet Glaze"]
  },
  {
    id: "salmon-nicoise",
    name: "Salmon Nicoise",
    price: 26950,
    category: "grills",
    description: "Salmon, boiled eggs, green beans, olives, potatoes, and dijon dressing.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Vibrant Salad", "Gourmet"]
  },
  {
    id: "creamy-tuscan-salmon",
    name: "Creamy Tuscan Salmon",
    price: 27500,
    category: "grills",
    description: "Salmon, spinach, sun-dried tomatoes, cream, garlic, and parmesan with pasta, mashed potatoes, or rice.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Rich Broth", "Decadent"]
  },
  {
    id: "salmon-rice-bowl",
    name: "Salmon Rice Bowl",
    price: 29500,
    category: "grills",
    description: "Salmon, soy sauce, sesame oil, avocado, rice, nori, and sriracha mayo.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Healthy Rice", "Sriracha Kick"]
  },
  {
    id: "ribeye-steak-exact",
    name: "Ribeye Steak",
    price: 32500,
    category: "grills",
    description: "Ribeye steak, garlic, fresh thyme or rosemary, with vegetables or mashed potato and mushroom soup or gravy.",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800",
    tags: ["Steakhouse Cut", "Best Seller"]
  },
  {
    id: "chicken-steak",
    name: "Chicken Steak",
    price: 22500,
    category: "grills",
    description: "Chicken breast, lemon juice, garlic powder, paprika, olive oil, soy sauce, and butter with white rice, mashed potato, or steamed veg.",
    image: "https://images.unsplash.com/photo-1532550900822-4aefdf78524f?auto=format&fit=crop&q=80&w=800",
    tags: ["Pan Seared", "Familiar"]
  },
  {
    id: "lamb-chops-exact",
    name: "Lamb Chops",
    price: 35000,
    category: "grills",
    description: "Lamb chops, olive oil, garlic, rosemary, thyme, and lemon juice with steamed veg, rice, or mashed potato.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    tags: ["Delightful", "Prime Cut"]
  },
  {
    id: "t-bone-steak",
    name: "T-Bone Steak",
    price: 32900,
    category: "grills",
    description: "T-bone steak, avocado or canola oil, butter, garlic, and rosemary or thyme with green vegetables or sautéed potato.",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800",
    tags: ["Gourmet Steak", "Bold Cut"]
  },
  {
    id: "lamb-rack-steak",
    name: "Lamb Rack Steak",
    price: 38000,
    category: "grills",
    description: "Rack of lamb, olive oil, garlic, rosemary, thyme, dijon mustard, and paprika with asparagus or potato wedges.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    tags: ["Chef Selection", "Fine lamb"]
  },
  {
    id: "seafood-grilling",
    name: "Seafood Grilling",
    price: 54200,
    category: "grills",
    description: "Fish fillets, prawns, lobster tails, calamari, scallops, and crab with rice, mashed potato, or fries.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Luxury Seafood", "Grand Feast"]
  },

  // ==========================================
  // GRILLED FISH (3 Items)
  // ==========================================
  {
    id: "grilled-tilapia-fish",
    name: "Grilled Tilapia Fish",
    price: 31500,
    category: "grilled-fish",
    description: "Tilapia served with roasted potato or roasted plantain and salad.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Lagos Griddle Style", "Traditional"]
  },
  {
    id: "grilled-croaker-fish",
    name: "Grilled Croaker Fish",
    price: 35200,
    category: "grilled-fish",
    description: "Croaker fish served with steamed rice or french fries.",
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&q=80&w=800",
    tags: ["Signature Sea Grill", "Croaker"]
  },
  {
    id: "grilled-catfish-exact",
    name: "Grilled Catfish",
    price: 25800,
    category: "grilled-fish",
    description: "Catfish served with french fries, sweet potato, and salad.",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800",
    tags: ["Catfish", "Savoury"]
  },

  // ==========================================
  // PLATTERS (5 Items)
  // ==========================================
  {
    id: "mopheth-platter",
    name: "Mopheth Platter",
    price: 52500,
    category: "platters",
    description: "Mini sliders, tacos, chicken lollipops, lamb cutlets, beef ribs, tiger prawns, fish fillet, and asun with yam fries, rice, or plantain.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    tags: ["Best Seller", "Platters Selection"]
  },
  {
    id: "tacos-platter",
    name: "Tacos Platter",
    price: 36500,
    category: "platters",
    description: "Shrimp, beef, fish, chicken, and ram suya with french fries or sweet potato fries.",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&q=80&w=800",
    tags: ["Tacos Mix", "Shared Plate"]
  },
  {
    id: "burger-platter",
    name: "Burger Platter",
    price: 31500,
    category: "platters",
    description: "Chicken burger, beef burger, Cheetos burger, and breakfast burger with potato wedges, sweet potato, or yam fries.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
    tags: ["Burger Parade", "Comfort Foods"]
  },
  {
    id: "seafood-platter",
    name: "Seafood Platter",
    price: 56900,
    category: "platters",
    description: "King prawns, lobster tails, scallops, calamari, fish fillet, and mussels with asparagus, mashed potato, or rice.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=800",
    tags: ["Seafood", "Luxury Feast"]
  },
  {
    id: "upside-house-platter",
    name: "Upside House Platter",
    price: 49800,
    category: "platters",
    description: "Chicken kebab, turkey wings, chicken wings, beef kebab, gizzard, snail, and trio burger with rice, yam fries, plantain, or sweet potato.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
    tags: ["House Special", "Large Platter"]
  },

  // ==========================================
  // COOKIES (11 Items)
  // ==========================================
  {
    id: "chocolate-chip-walnut-cookie-exact",
    name: "Chocolate Chip Walnut Cookie",
    price: 4000,
    category: "cookies",
    description: "Butter, sugar, eggs, flour, chocolate chips, and walnut.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Bakers Special", "Freshly Baked"]
  },
  {
    id: "two-chip-chocolate-chip-cookie",
    name: "Two Chip Chocolate Chip Cookie",
    price: 4500,
    category: "cookies",
    description: "Butter, sugar, eggs, vanilla, flour, semi-sweet and dark chocolate chips.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Double Chip", "Rich Texture"]
  },
  {
    id: "dark-chocolate-chip-cookie-exact",
    name: "Dark Chocolate Chip Cookie",
    price: 4000,
    category: "cookies",
    description: "Butter, sugar, eggs, vanilla, flour, and dark chocolate chips.",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f1f?auto=format&fit=crop&q=80&w=800",
    tags: ["Pure Cocoa", "Luxury Belgian"]
  },
  {
    id: "dark-chocolate-peanut-butter-chip-cookie",
    name: "Dark Chocolate Peanut Butter Chip Cookie",
    price: 6500,
    category: "cookies",
    description: "Butter, sugar, eggs, vanilla, flour, dark chocolate chips, and peanut butter chips.",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f1f?auto=format&fit=crop&q=80&w=800",
    tags: ["Peanut Butter", "Salted Blend"]
  },
  {
    id: "oatmeal-raisin-cookie",
    name: "Oatmeal Raisin Cookie",
    price: 3500,
    category: "cookies",
    description: "Butter, sugar, eggs, vanilla, flour, oats, raisins, and cinnamon.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    tags: ["Healthy Oats", "Cinnamon Blend"]
  },
  {
    id: "caramel-coconut-chocolate-chip-cookie",
    name: "Caramel Coconut Chocolate Chip Cookie",
    price: 5000,
    category: "cookies",
    description: "Butter, sugar, egg, vanilla, flour, chocolate chips, caramel chips, and coconut.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Caramel Caramel", "Coconut Blend"]
  },
  {
    id: "vegan-and-gluten-free-chocolate-chip-walnut-cookie",
    name: "Vegan and Gluten Free Chocolate Chip Walnut Cookie",
    price: 4000,
    category: "cookies",
    description: "Vegan butter, coconut sugar, flax eggs, gluten-free flour, vegan chocolate chips, and walnut.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Vegan Friendly", "Gluten Free"]
  },
  {
    id: "drop-cookies",
    name: "Drop Cookies",
    price: 800,
    category: "cookies",
    description: "Butter, sugar, egg, vanilla, flour, and nuts or dried fruit.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Nibble", "Dry Fruit"]
  },
  {
    id: "sandwich-cookie",
    name: "Sandwich Cookie",
    price: 3000,
    category: "cookies",
    description: "Egg, vanilla, butter, sugar, flour, baking powder, and milk.",
    image: "https://images.unsplash.com/photo-1558961309-dbdf71799f1f?auto=format&fit=crop&q=80&w=800",
    tags: ["Vanilla Cream", "Double Sided"]
  },
  {
    id: "no-bake-cookie",
    name: "No-Bake Cookie",
    price: 1000,
    category: "cookies",
    description: "Sugar, cocoa powder, butter, milk, vanilla, oats, and peanut butter.",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&q=80&w=800",
    tags: ["Peanut Butter", "No Bake Process"]
  },
  {
    id: "almond-biscotti-cookie",
    name: "Almond Biscotti Cookie",
    price: 4000,
    category: "cookies",
    description: "Flour, sugar, eggs, vanilla, and almonds.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
    tags: ["Hard Baked", "Almond Infused"]
  },

  // ==========================================
  // PIZZA (6 Items)
  // ==========================================
  {
    id: "pepperoni-pizza-exact",
    name: "Pepperoni Pizza",
    price: 12500,
    category: "pizza",
    description: "Flour, yeast, tomato sauce, mozzarella cheese, pepperoni, and oregano.",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    tags: ["Best Seller", "Woodfired"]
  },
  {
    id: "veg-pizza-exact",
    name: "Veg Pizza",
    price: 10000,
    category: "pizza",
    description: "Flour, yeast, tomato sauce, onions, capsicum, mushroom, olives, sweet corn, and herbs.",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=800",
    tags: ["Vegetarian", "Feta Crumbs"]
  },
  {
    id: "cheese-pizza",
    name: "Cheese Pizza",
    price: 10000,
    category: "pizza",
    description: "Flour, yeast, tomato sauce, mozzarella cheese, and oregano.",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=800",
    tags: ["Double Cheese", "Classic Layer"]
  },
  {
    id: "bbq-chicken-pizza-exact",
    name: "BBQ Chicken Pizza",
    price: 14000,
    category: "pizza",
    description: "Flour, yeast, bbq sauce, cooked chicken, mozzarella cheese, onion, and bell pepper.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800",
    tags: ["Savoury BBQ", "Chicken"]
  },
  {
    id: "mushroom-pizza",
    name: "Mushroom Pizza",
    price: 95000,
    category: "pizza",
    description: "Flour, yeast, tomato sauce, mozzarella cheese, onion, bell pepper, and oregano.",
    image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&q=80&w=800",
    tags: ["Premium Woodfired", "Mushrooms Choice"]
  },
  {
    id: "meat-lover-pizza",
    name: "Meat Lover Pizza",
    price: 15000,
    category: "pizza",
    description: "Flour, yeast, tomato sauce, mozzarella cheese, sausage, ham, and bacon.",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800",
    tags: ["Pancetta Pieces", "Bold Italian"]
  },

  // ==========================================
  // SALAD (6 Items)
  // ==========================================
  {
    id: "classic-chicken-salad",
    name: "Classic Chicken salad",
    price: 24000,
    category: "salad",
    description: "Cooked chicken breast diced tomatoes fresh , celery , chopped onions, finely chopped lettuce , mayonnaise, salt, lemon juice, cucumber black pepper to taste",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    tags: ["Healthy Crisp", "Zesty"]
  },
  {
    id: "bamboozle-salad",
    name: "Bamboozle Salad",
    price: 15000,
    category: "salad",
    description: "Mixed greens, cucumber, sliced, feta cheese, Bell pepper, avocado, red onion, cherry tomatoes, lemon juice.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
    tags: ["Unique Taste", "Veg Blend"]
  },
  {
    id: "classic-greek-salad",
    name: "Classic Greek Salad",
    price: 12800,
    category: "salad",
    description: "Vegetable, cream feta cheese, and a tangy dressing, perfect as a side or light meal tomatoes, kalamata Olive, red wine vinegar.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=800",
    tags: ["Italian Blend", "Vegetarian"]
  },
  {
    id: "classic-caesar-salad",
    name: "Classic Caesar Salad",
    price: 20000,
    category: "salad",
    description: "Garlic croutons, parmesan cheese, romaine lettuce, lemon juice, large egg yolk, garlic, black pepper, virgin olive oil, grated Parmesan.",
    image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=800",
    tags: ["Classic Caesar", "Aromatic"]
  },
  {
    id: "seafood-salad-salad",
    name: "Seafood Salad",
    price: 24500,
    category: "salad",
    description: "Copped shrimp, crab meat,diced cucumbers, diced carrots, chopped spring onion, lime juice, season with salt and black pepper.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    tags: ["Fresh Prawns", "Succulent Seafood"]
  },
  {
    id: "coleslaw-salad",
    name: "Coleslaw Salad",
    price: 10000,
    category: "salad",
    description: "Shredded cabbage, shredded carrots, mayonnaise, apple cider vinegar, Dijon mustard, salt and pepper, chopped onions or chopped fresh parsley.",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800",
    tags: ["Coleslaw Style", "Traditional Side"]
  }
];

export const COMBOS = [
  {
    id: "combo-1",
    name: "Lagos Night Out Feast",
    items: ["Mopheth Platter", "Tacos Platter"],
    price: 85000,
    saving: 4000,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "combo-2",
    name: "The Executive Sunrise Brunch",
    items: ["Classic English Breakfast", "French Breakfast"],
    price: 32000,
    saving: 2000,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800"
  }
];

export const REVIEWS = [
  {
    id: "rev-1",
    name: "Tolulope. A",
    role: "Lagos Lifestyle Critic",
    rating: 5,
    text: "The Mopheth Platter is an absolutely incredible combination of gourmet delicacies. Outstanding luxury ambience and insanely fast boutique fulfillment.",
    date: "June 2026"
  },
  {
    id: "rev-2",
    name: "Chinedu. O",
    role: "Artisanal Food Enthusiast",
    rating: 5,
    text: "World-class chefs. The butter reduction on their Lemon Butter Salmon is sheer perfection, matching high-end dining in London. Absolute favorite space in Lekki.",
    date: "June 2026"
  },
  {
    id: "rev-3",
    name: "Funmi. A",
    role: "Vanguard Event Producer",
    rating: 5,
    text: "We hosted an intimate private dinner here and the guests were absolutely blown away by the Catfish pepper soup and custom sharing platters. Truly premium.",
    date: "June 2026"
  }
];
