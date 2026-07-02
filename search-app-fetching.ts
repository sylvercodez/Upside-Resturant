import fs from "fs";

const content = fs.readFileSync("src/App.tsx", "utf8");
const lines = content.split("\n");

lines.forEach((line, i) => {
  if (line.includes("/api/") || line.includes("menu") || line.includes("fetch")) {
    // Only print lines of interest
    if (line.includes("mysql") || line.includes("setMenu") || line.includes("fetch")) {
      console.log(`Line ${i + 1}: ${line.trim()}`);
    }
  }
});

process.exit(0);
