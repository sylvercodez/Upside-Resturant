import fs from "fs";
import path from "path";

function findInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findInDir(fullPath);
    } else if (file.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("insert into menus") || content.includes("INSERT INTO menus") || content.includes("seed") || content.includes("truncate")) {
        console.log(`Seeding file found: ${fullPath}`);
      }
    }
  }
}

if (fs.existsSync("api")) findInDir("api");
if (fs.existsSync("src/db")) findInDir("src/db");
process.exit(0);
