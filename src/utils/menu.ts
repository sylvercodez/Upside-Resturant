/**
 * Robust utility functions for menu items, especially mapping item titles to consistent gallery or fallback images.
 */

/**
 * Normalizes strings for robust, alphanumeric-only comparisons.
 */
export const normalizeString = (str: string): string => {
  return str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
};

/**
 * Comprehensive mapping of normalized standard item titles to professional, high-quality culinery images.
 */
export const IMAGE_FALLBACKS: Record<string, string> = {
  // Starters & Appetizers
  "gizdodo": "https://images.unsplash.com/photo-1604329760661-e71dc83f8126?auto=format&fit=crop&w=800&q=80",
  "gizodo": "https://images.unsplash.com/photo-1604329760661-e71dc83f8126?auto=format&fit=crop&w=800&q=80",
  "asundodo": "https://images.unsplash.com/photo-1604329760661-e71dc83f8126?auto=format&fit=crop&w=800&q=80",
  "chickenlemonsalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "smokylemonchickensalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "eggsaladsandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "eggsalad": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "garlicgingerwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "spicychickenwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "classiccrispychickenwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "barbequechickenwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "butterflyprawns": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "prawnsspringroll": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
  "crispycalamari": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",

  // Sandwiches
  "classicgrilledcheesesandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "vegclubsandwich": "https://images.unsplash.com/photo-1540713434306-5376c41c4a14?auto=format&fit=crop&w=800&q=80",
  "chickenmayosandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "bltsandwich": "https://images.unsplash.com/photo-1540713434306-5376c41c4a14?auto=format&fit=crop&w=800&q=80",
  "tunasandwich": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "paneertikkasandwich": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "paneertikkasandwish": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",

  // Pastas
  "fettuccinealfredopasta": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
  "spaghetticarbonara": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
  "penneallarrabbiata": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  "spaghettibolognese": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80",
  "seafoodpasta": "https://images.unsplash.com/photo-1563379971899-660589a01cd3?auto=format&fit=crop&w=800&q=80",

  // Burgers
  "southernstylecoleslawburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "classicmophethburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "crispyburger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "dillpicklesburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "jalapenoburger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",

  // Pizzas
  "pepperonipizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
  "vegpizza": "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=800&q=80",
  "cheesepizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  "bbqchickenpizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
  "mushroompizza": "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?auto=format&fit=crop&w=800&q=80",

  // Main Dishes & Platters
  "lemonbuttersalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "creamytuscansalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "teriyakisalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "chickensteak": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
  "tbonesteak": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "lambchops": "https://images.unsplash.com/photo-1514516317472-f558c9430377?auto=format&fit=crop&w=800&q=80",
  "lambracksteak": "https://images.unsplash.com/photo-1514516317472-f558c9430377?auto=format&fit=crop&w=800&q=80",
  "grilledcatfish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "mophethplatter": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "tacosplatter": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
  "seafoodplatter": "https://images.unsplash.com/photo-1534080391025-0979e83161be?auto=format&fit=crop&w=800&q=80",
  "upsidehouseplatter": "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80",
  "grilledcroakerfish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "grilledtilapiafish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",

  // Salads
  "seafoodsalad": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80",
  "classicchickensalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "coleslawsalad": "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=800&q=80",
  "bamboozlesalad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "classicgreeksalad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "classiccaesarsalad": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80",

  // Desserts & Bakery
  "darkchocolatechipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "darkchocolatepeanutbutterchipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "oatmealraisincookie": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "caramelcoconutchocolatechipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "supermoistredvelvetcupcakes": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80",
  "vanillacupcakes6square": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80",
  "jamdoughnut": "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=800&q=80",
  "meatpie": "https://images.unsplash.com/photo-1608039755401-742074f0548d?auto=format&fit=crop&w=800&q=80",

  // Coffee & Drinks
  "cappuccino": "https://images.unsplash.com/photo-1571115177098-24ec4209b535?auto=format&fit=crop&w=800&q=80",
  "espressosingle": "https://images.unsplash.com/photo-1510707513156-46c0d02df986?auto=format&fit=crop&w=800&q=80",
  "espressodouble": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "extraespresso": "https://images.unsplash.com/photo-1510707513156-46c0d02df986?auto=format&fit=crop&w=800&q=80",
  "earlgraytea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "helzenuticecoffe": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "hazelnuticecoffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "icecoffeevanilla": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "icecoffeechocolate": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "icecoffeecaramel": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "hazelnutfrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "caramelfrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "vanillafrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "vanillamilkshake": "https://images.unsplash.com/photo-1572490122820-218b40c89000?auto=format&fit=crop&w=800&q=80",
  "chocolatemilkshake": "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&w=800&q=80",
  "strawberrymilkshake": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",
  "strawberrybananamilkshake": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",
  "oreobananamilkshake": "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&w=800&q=80",
  "carrotjuice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
  "pineapplejuice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "gingerjuice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
  "watermelonjuice": "https://images.unsplash.com/photo-1582284540020-8acae03f417a?auto=format&fit=crop&w=800&q=80",
  "zobodelight": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "packedjuice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "mophethbottlewater": "https://images.unsplash.com/photo-1608885898957-a59911ec9df3?auto=format&fit=crop&w=800&q=80",

  // Cocktails & Spirits
  "pinacolada": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80",
  "espressomartini": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80",
  "mimosa": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "whiskeysour": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "tequilasunrise": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "mojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "mangomojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "passionfruitmojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80"
};

/**
 * Main category/generic keyword mappings to fallback images.
 */
export const CATEGORY_KEYWORDS: Record<string, string> = {
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "pasta": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
  "salad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "drink": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "wings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "steak": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "cookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80"
};

/**
 * Maps any given menu item title to a specific, matching, consistent image URL.
 * Checks against custom gallery images, hardcoded presets, and fallback category keywords.
 */
export function mapTitleToImageUrl(
  title: string,
  availableGalleryImages?: { name: string; url: string }[]
): string {
  if (!title) {
    return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
  }

  const normTitle = normalizeString(title);

  // 1. Try to find match in the live gallery/assets
  if (availableGalleryImages && availableGalleryImages.length > 0) {
    // A. Exact name match
    const exactMatch = availableGalleryImages.find(
      (img) => normalizeString(img.name) === normTitle
    );
    if (exactMatch) return exactMatch.url;

    // B. Substring match (e.g., "Veg Pizza" matches gallery image "Pizza" or vice-versa)
    const substringMatch = availableGalleryImages.find((img) => {
      const normImgName = normalizeString(img.name);
      return (
        normTitle.includes(normImgName) ||
        normImgName.includes(normTitle) ||
        (normImgName.length > 3 && normTitle.includes(normImgName.substring(0, Math.min(normImgName.length, 8))))
      );
    });
    if (substringMatch) return substringMatch.url;

    // C. Keyword-based matching on category keywords
    for (const key of Object.keys(CATEGORY_KEYWORDS)) {
      if (normTitle.includes(key)) {
        const keywordMatch = availableGalleryImages.find((img) =>
          normalizeString(img.name).includes(key)
        );
        if (keywordMatch) return keywordMatch.url;
      }
    }
  }

  // 2. Try hardcoded fallback presets
  if (IMAGE_FALLBACKS[normTitle]) {
    return IMAGE_FALLBACKS[normTitle];
  }

  // Try substring matching against fallback presets
  for (const [key, url] of Object.entries(IMAGE_FALLBACKS)) {
    if (normTitle.includes(key) || key.includes(normTitle)) {
      return url;
    }
  }

  // 3. Fall back to generic category matching
  for (const [key, url] of Object.entries(CATEGORY_KEYWORDS)) {
    if (normTitle.includes(key)) {
      return url;
    }
  }

  // Default elegant fallback image
  return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
}
