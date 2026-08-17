import { MenuItem } from "../types";
import { CATEGORIES } from "./categories";
import { DRINKS as RAW_DRINKS } from "./drinks";
import { FOOD as RAW_FOOD } from "./food";
import { mapTitleToImageUrl } from "../utils/menu";

export type { MenuItem, Category } from "../types";
export { CATEGORIES } from "./categories";

// Enrich items to guarantee high-quality culinary image URLs
const enrichMenuItem = (item: MenuItem): MenuItem => ({
  ...item,
  image: (item.image && item.image !== "none" && item.image !== "null" && item.image !== "undefined" && item.image.trim() !== "")
    ? item.image
    : mapTitleToImageUrl(item.name, undefined, item.category)
});

export const DRINKS: MenuItem[] = RAW_DRINKS.map(enrichMenuItem);
export const FOOD: MenuItem[] = RAW_FOOD.map(enrichMenuItem);

// Let's mix everything together - scattered food & drinks
const mixItems = (drinks: MenuItem[], food: MenuItem[]): MenuItem[] => {
  const result: MenuItem[] = [];
  const max = Math.max(drinks.length, food.length);
  for (let i = 0; i < max; i++) {
    if (i < drinks.length) result.push(drinks[i]);
    if (i < food.length) result.push(food[i]);
  }
  
  // Seeded deterministic pseudo-shuffle to ensure consistent order
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
