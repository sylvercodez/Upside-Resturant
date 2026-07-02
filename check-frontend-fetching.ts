import fs from "fs";
import path from "path";

const files = [
  "src/App.tsx",
  "src/components/DedicatedMenu.tsx",
  "src/components/MenuSection.tsx",
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, "utf8");
    const hasFetch = content.includes("/api/mysql/menus") || content.includes("/api/menu");
    console.log(`File: ${f} uses DB menu API: ${hasFetch}`);
  }
});

process.exit(0);
