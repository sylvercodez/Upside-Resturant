import fs from "fs";

const drinks = fs.readFileSync("src/data/drinks.ts", "utf8");
const hasClassic = drinks.includes("classic_restaurant_drinks");
const hasGourmet = drinks.includes("gourmet_drinks");

console.log("drinks.ts references classic_restaurant_drinks:", hasClassic);
console.log("drinks.ts references gourmet_drinks:", hasGourmet);
process.exit(0);
