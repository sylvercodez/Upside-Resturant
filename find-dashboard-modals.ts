import fs from "fs";

const content = fs.readFileSync("src/components/DedicatedDashboard.tsx", "utf8");
const lines = content.split("\n");

console.log("Searching for state variables controlling modals in DedicatedDashboard.tsx:");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("const [") && (line.includes("Modal") || line.includes("Dialog") || line.includes("show"))) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
process.exit(0);
