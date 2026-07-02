import { FOOD } from "./src/data/food";
import { DRINKS } from "./src/data/drinks";

const normalize = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
};

async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/assets");
    if (!res.ok) throw new Error("Failed to fetch assets");
    const assets: any[] = await res.json();
    const allMenus = [...FOOD, ...DRINKS];

    const menuNorms = new Set(allMenus.map(m => normalize(m.name)));
    // Also include normalized IDs
    allMenus.forEach(m => menuNorms.add(normalize(m.id)));

    // Manual overlaps we already know:
    // gizdodo -> gizodo
    // chickenlemonsalad -> smokylemonchickensalad
    // eggsaladsandwich -> eggsalad1
    // extrasyrup -> syrup
    const manualMatchedAssets = new Set([
      "gizodo",
      "smokylemonchickensalad",
      "eggsalad1",
      "syrup"
    ]);

    const unmatchedAssets = assets.filter(asset => {
      const norm = normalize(asset.name);
      if (menuNorms.has(norm)) return false;
      if (manualMatchedAssets.has(norm)) return false;
      return true;
    });

    console.log(`Unmatched assets count: ${unmatchedAssets.length}`);
    unmatchedAssets.forEach(a => {
      console.log(`- Asset: "${a.name}" (Normalized: "${normalize(a.name)}")`);
    });

    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}

main();
