import { MenuItem } from "../types";
import { CATEGORIES } from "./categories";
import { DRINKS } from "./drinks";
import { FOOD } from "./food";

export type { MenuItem, Category } from "../types";
export { CATEGORIES } from "./categories";
export { DRINKS } from "./drinks";
export { FOOD } from "./food";

export const MENU_ITEMS: MenuItem[] = [...DRINKS, ...FOOD];
