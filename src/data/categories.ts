export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: "breakfast", name: "Breakfast", icon: "Egg", description: "Hearty and delicious breakfast dishes to kickstart your day" },
  { id: "coffee", name: "Coffee", icon: "Coffee", description: "Freshly brewed hot espresso and milk selections" },
  { id: "sandwich", name: "Sandwich", icon: "Sandwich", description: "Freshly handmade sandwiches with premium fillings" },
  { id: "teas", name: "Teas", icon: "Soup", description: "Hot aromatic leaf teas infused with honey and sugar" },
  { id: "starter", name: "Starter", icon: "Flame", description: "Appetizers and flavorful gourmet starters" },
  { id: "fruit-juice", name: "Fruit Juice", icon: "Citrus", description: "Freshly squeezed natural fruit juices" },
  { id: "salad", name: "Salad", icon: "Salad", description: "Crispy, nutritious, and refreshing salads" },
  { id: "ice-coffee", name: "Ice Coffee", icon: "GlassWater", description: "Chilled espresso iced coffee treats" },
  { id: "burger", name: "Burger", icon: "Beef", description: "Juicy, grilled gourmet burgers with custom toppings" },
  { id: "smoothie", name: "Smoothie", icon: "CupSoda", description: "Thick, creamy blends of fresh fruits and purees" },
  { id: "pizza", name: "Pizza", icon: "Pizza", description: "Freshly baked thin-crust pizzas with rich toppings" },
  { id: "frappuccino", name: "Frappuccino", icon: "IceCream", description: "Blended ice, milk, espresso and decadent syrups" },
  { id: "pasta", name: "Pasta", icon: "UtensilsCrossed", description: "Classic Italian and seafood pasta creations" },
  { id: "milkshake", name: "Milkshake", icon: "Dessert", description: "Rich ice cream milkshakes topped with whipped cream" },
  { id: "grilled-steaks", name: "Grilled & Steaks", icon: "Flame", description: "Premium grilled meats, salmon, and steak cuts cooked to perfection" },
  { id: "signature-drinks", name: "Signature Drinks", icon: "Sparkles", description: "Exclusive Upside mocktails and local custom blends" },
  { id: "grilled-fish", name: "Grilled Fish", icon: "Fish", description: "Succulent whole fish grilled with local spices" },
  { id: "cocktail", name: "Cocktail", icon: "Wine", description: "Premium spirits mixed with fresh ingredients" },
  { id: "platters", name: "Platters", icon: "UtensilsCrossed", description: "Mega sharing platters packed with diverse proteins and sides" },
  { id: "mocktail", name: "Mocktail", icon: "GlassWater", description: "Alcohol-free refreshing juices and mixers" },
  { id: "cookies", name: "Cookies", icon: "Cookie", description: "Freshly baked gourmet cookies and biscotti" },
  { id: "extras", name: "Extras", icon: "PlusCircle", description: "Additional sides, toppings, syrup, and extra shots" }
];
