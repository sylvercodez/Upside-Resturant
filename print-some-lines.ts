import fs from "fs";

const content = fs.readFileSync("src/data/food.ts", "utf8");
const lines = content.split("\n");
console.log("Lines 1 to 100 of food.ts:");
for (let i = 0; i < 100; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
process.exit(0);
