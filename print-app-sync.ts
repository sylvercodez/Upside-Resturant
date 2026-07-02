import fs from "fs";

const content = fs.readFileSync("src/App.tsx", "utf8");
const lines = content.split("\n");

for (let i = 94; i < 140; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}

process.exit(0);
