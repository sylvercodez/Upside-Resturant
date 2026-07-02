import fs from "fs";

const content = fs.readFileSync("src/data/food.ts", "utf8");
const lines = content.split("\n");

let count = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("image:") && line.includes("base64")) {
    count++;
    console.log(`\n[${count}] Found base64 image at line ${i + 1}:`);
    // Print lines around it
    const start = Math.max(0, i - 5);
    const end = Math.min(lines.length - 1, i + 5);
    for (let j = start; j <= end; j++) {
      const prefix = j === i ? ">>> " : "    ";
      const snippet = lines[j].length > 120 ? lines[j].substring(0, 120) + "..." : lines[j];
      console.log(`${prefix}${j + 1}: ${snippet}`);
    }
    if (count >= 3) break;
  }
}
process.exit(0);
