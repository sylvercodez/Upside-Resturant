import fs from "fs";

function purgeBase64(filePath: string) {
  console.log(`Purging base64 from ${filePath}...`);
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let purgeCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("image:") && line.includes("data:image")) {
      lines[i] = '    image: "none",';
      purgeCount++;
    }
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
  console.log(`Finished ${filePath}: Purged ${purgeCount} inline base64 images.`);
}

purgeBase64("src/data/food.ts");
purgeBase64("src/data/drinks.ts");
process.exit(0);
