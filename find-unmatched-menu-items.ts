import { FOOD } from "./src/data/food";
import { DRINKS } from "./src/data/drinks";

const keywords = ["pie", "doughnut", "cupcake", "wing", "pancake", "waffle", "cookie", "salmon", "salad", "burger", "steak", "juice", "tea", "coffee"];

const allMenus = [...FOOD, ...DRINKS];

console.log("Searching by keywords for unmatched items:");

keywords.forEach(kw => {
  const matched = allMenus.filter(m => m.name.toLowerCase().includes(kw));
  if (matched.length > 0) {
    console.log(`\nKeyword "${kw}" matches (${matched.length} items):`);
    matched.forEach(m => {
      console.log(`  - "${m.name}" (ID: ${m.id}, Category: ${m.category}) - Image field: ${m.image ? m.image.substring(0, 30) : "undefined"}`);
    });
  }
});

process.exit(0);
