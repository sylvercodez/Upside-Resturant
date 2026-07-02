import { FOOD } from "./src/data/food";
import { DRINKS } from "./src/data/drinks";

async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/menus");
    if (!res.ok) throw new Error("Failed to fetch menus");
    const menus: any[] = await res.json();
    const allMenus = [...FOOD, ...DRINKS];

    const codeIds = new Set(allMenus.map(m => m.id));

    console.log("Menus in DB but NOT in Code:");
    menus.forEach(m => {
      if (!codeIds.has(m.id)) {
        console.log(`- DB item: "${m.name}" (ID: ${m.id}, Cat: ${m.category}) - Image: ${m.image ? m.image.substring(0, 30) : "none"}`);
      }
    });

    console.log("\nMenus in Code but NOT in DB:");
    allMenus.forEach(m => {
      const dbItem = menus.find(db => db.id === m.id);
      if (!dbItem) {
        console.log(`- Code item: "${m.name}" (ID: ${m.id}, Cat: ${m.category})`);
      }
    });

    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}

main();
