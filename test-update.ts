import fs from "fs";

const content = fs.readFileSync("src/data/food.ts", "utf8");
const lines = content.split("\n");
console.log("Lines 1 to 25 of food.ts CURRENT STATE:");
for (let i = 0; i < 25; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
process.exit(0);
