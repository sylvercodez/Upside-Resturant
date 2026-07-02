async function main() {
  try {
    const menusRes = await fetch("http://localhost:3000/api/mysql/menus");
    const menus = await menusRes.json();
    
    const assetsRes = await fetch("http://localhost:3000/api/mysql/assets");
    const assets = await assetsRes.json();

    const normalize = (name: string) => {
      return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    };

    console.log(`Checking match logic on ${menus.length} menus and ${assets.length} assets...`);

    let matchCount = 0;
    for (const asset of assets) {
      const normAsset = normalize(asset.name);
      
      const matchedMenus = menus.filter((m: any) => {
        const normMenu = normalize(m.name);
        
        if (normAsset === "gizodo" && m.id === "gizdodo") return true;
        if (normAsset === "smokylemonchickensalad" && m.id === "chicken-lemon-salad") return true;
        if (normAsset === "eggsalad1" && m.id === "egg-salad-sandwich") return true;
        if (normAsset === "syrup" && m.id === "extra-syrup") return true;

        return normMenu === normAsset || 
               normMenu === normAsset + "s" || 
               normAsset === normMenu + "s" ||
               (normMenu.includes(normAsset) && normAsset.length > 5) ||
               (normAsset.includes(normMenu) && normMenu.length > 5);
      });

      if (matchedMenus.length > 0) {
        matchCount += matchedMenus.length;
        console.log(`Asset "${asset.name}" matches ${matchedMenus.length} menus:`, matchedMenus.map((m: any) => m.name));
      }
    }

    console.log("Total simulated match count:", matchCount);
    process.exit(0);
  } catch (err: any) {
    console.error(err);
    process.exit(1);
  }
}

main();
