async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/assets");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    const names = Array.from(new Set(data.map((item: any) => item.name))).sort();
    console.log("=== ALL UNIQUE ASSET NAMES IN LIBRARY ===");
    console.log(names);
    process.exit(0);
  } catch (err: any) {
    console.error("Error fetching assets:", err);
    process.exit(1);
  }
}

main();
