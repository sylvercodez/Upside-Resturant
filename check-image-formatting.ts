import fs from "fs";

function checkFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let multilineImages = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("image:")) {
      if (!line.trim().endsWith(",") && !line.trim().endsWith("\"") && !line.trim().endsWith("'")) {
        multilineImages++;
        console.log(`Found possible multiline image property at line ${i + 1} of ${filePath}:`);
        console.log(line.substring(0, 100) + "...");
      }
    }
  }
  console.log(`${filePath}: Found ${multilineImages} multiline image fields.`);
}

checkFile("src/data/food.ts");
checkFile("src/data/drinks.ts");
process.exit(0);
