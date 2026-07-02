async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/mysql/menus");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${await res.text()}`);
    }
    const data = await res.json();
    console.log("=== MYSQL MENUS ===");
    const summarized = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      imageSnippet: item.image ? item.image.substring(0, 50) + "..." : "none"
    }));
    console.log(JSON.stringify(summarized, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error("Error fetching menus:", err);
    process.exit(1);
  }
}

main();
