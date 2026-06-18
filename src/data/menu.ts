import { MenuItem } from "../types";
import { CATEGORIES } from "./categories";
import { DRINKS } from "./drinks";
import { FOOD } from "./food";

export type { MenuItem, Category } from "../types";
export { CATEGORIES } from "./categories";
export { DRINKS } from "./drinks";
export { FOOD } from "./food";

// Let's mix everything together - scattered food & drinks
const mixItems = (drinks: MenuItem[], food: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = [];
  const max = Math.max(drinks.length, food.length);
  for (let i = 0; i < max; i++) {
    if (i < drinks.length) result.push(drinks[i]);
    if (i < food.length) result.push(food[i]);
  }
  
  // Seeded deterministic pseudo-shuffle to ensure consistent order (prevents hydration mismatches in React/SSR)
  let seed = 12345;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  const shuffled = [...result];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const MENU_ITEMS: MenuItem[] = mixItems(DRINKS, FOOD);

