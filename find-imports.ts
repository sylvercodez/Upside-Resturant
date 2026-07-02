import fs from "fs";
import path from "path";

function searchDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("src/data/food") || content.includes("src/data/drinks") || content.includes("src/data/menu") || content.includes("./data/food") || content.includes("./data/drinks") || content.includes("./data/menu") || content.includes("../data/menu")) {
        console.log(`File: ${fullPath} has menu data imports`);
      }
    }
  }
}

searchDir("src");
process.exit(0);
