async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/assets");
    if (!res.ok) throw new Error("Failed to fetch assets");
    const assets: any[] = await res.json();
    console.log(`Loaded ${assets.length} assets.`);
    assets.slice(0, 5).forEach((a, i) => {
      console.log(`[${i}] Name: "${a.name}" - URL start: ${a.url ? a.url.substring(0, 80) : "none"}`);
    });
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}

main();
