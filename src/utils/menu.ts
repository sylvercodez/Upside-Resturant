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
 * Comprehensive mapping of normalized standard item titles to professional, high-quality culinary images.
 */
export const IMAGE_FALLBACKS: Record<string, string> = {
  // ==========================================
  // STARTERS & APPETIZERS
  // ==========================================
  "prawnsspringroll": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=800&q=80",
  "chickenlemonsalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "smokylemonchickensalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "cocktailprawns": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "spicychickenwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "barbequechickenwings": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80",
  "classiccrispychickenwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "garlicgingerwings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "butterflyprawns": "https://images.unsplash.com/photo-1559742811-822863645435?auto=format&fit=crop&w=800&q=80",
  "crispycalamari": "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=800&q=80",
  "gizdodo": "https://images.unsplash.com/photo-1604329760661-e71dc83f8126?auto=format&fit=crop&w=800&q=80",
  "gizodo": "https://images.unsplash.com/photo-1604329760661-e71dc83f8126?auto=format&fit=crop&w=800&q=80",
  "asundodo": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "catfishpeppersoup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  "chickenpeppersoup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  "goatmeatpeppersoup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // SANDWICHES
  // ==========================================
  "classicgrilledcheesesandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "vegclubsandwich": "https://images.unsplash.com/photo-1540713434306-5376c41c4a14?auto=format&fit=crop&w=800&q=80",
  "chickenmayosandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "eggsaladsandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "eggsalad": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",
  "tunasandwich": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "peanutbutterandjellysandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "paneertikkasandwich": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80",
  "bltsandwich": "https://images.unsplash.com/photo-1540713434306-5376c41c4a14?auto=format&fit=crop&w=800&q=80",
  "avocadosandwich": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "chickengrilledsandwich": "https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // BREAKFAST
  // ==========================================
  "classicenglishbreakfast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
  "classicamericanbreakfast": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "frenchbreakfast": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "fruitwafflesorpancakes": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
  "breakfastpancakes": "https://images.unsplash.com/photo-1528198642978-366023cb60de?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // PASTAS
  // ==========================================
  "spaghettiallapomodoro": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  "fettuccinealfredopasta": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
  "spaghetticarbonara": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
  "penneallarrabbiata": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
  "spaghettibolognese": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&q=80",
  "seafoodpasta": "https://images.unsplash.com/photo-1563379971899-660589a01cd3?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // BURGERS
  // ==========================================
  "beefburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "southernstylecoleslawburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "crispyburger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "classicmophethburger": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
  "jalapenoburger": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "dillpicklesburger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // GRILLED STEAKS & SEAFOOD
  // ==========================================
  "lemonbuttersalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "garlichoneyglazedsalmon": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
  "herbcrustedbakedsalmon": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "teriyakisalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "salmonnicoise": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "creamytuscansalmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "salmonricebowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "ribeyesteak": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "chickensteak": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80",
  "lambchops": "https://images.unsplash.com/photo-1514516317472-f558c9430377?auto=format&fit=crop&w=800&q=80",
  "tbonesteak": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "lambracksteak": "https://images.unsplash.com/photo-1514516317472-f558c9430377?auto=format&fit=crop&w=800&q=80",
  "seafoodgrilling": "https://images.unsplash.com/photo-1534080391025-0979e83161be?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // GRILLED FISH
  // ==========================================
  "grilledtilapiafish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "grilledcroakerfish": "https://images.unsplash.com/photo-1534080391025-0979e83161be?auto=format&fit=crop&w=800&q=80",
  "grilledcatfish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // PLATTERS
  // ==========================================
  "mophethplatter": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "tacosplatter": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80",
  "burgerplatter": "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  "seafoodplatter": "https://images.unsplash.com/photo-1534080391025-0979e83161be?auto=format&fit=crop&w=800&q=80",
  "upsidehouseplatter": "https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // COOKIES & DESSERTS
  // ==========================================
  "chocolatechipwalnutcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "twochipchocolatechipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "darkchocolatechipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "darkchocolatepeanutbutterchipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "oatmealraisincookie": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  "caramelcoconutchocolatechipcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "veganandglutenfreechocolatechipwalnutcookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "dropcookies": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "sandwichcookie": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
  "nobakecookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "almondbiscotticookie": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // PIZZAS
  // ==========================================
  "pepperonipizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",
  "vegpizza": "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=800&q=80",
  "cheesepizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  "bbqchickenpizza": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80",
  "mushroompizza": "https://images.unsplash.com/photo-1604917621956-10dfa7cce2e7?auto=format&fit=crop&w=800&q=80",
  "meatloverpizza": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // SALADS
  // ==========================================
  "classicchickensalad": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "classicchickensaladfood": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
  "bamboozlesalad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "classicgreeksalad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "classicgreeksaladfood": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "classiccaesarsalad": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80",
  "classiccaesarsaladfood": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80",
  "seafoodsalad": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80",
  "seafoodsaladfood": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=800&q=80",
  "coleslawsalad": "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=800&q=80",
  "coleslawsaladfood": "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // COFFEES & HOT DRINKS
  // ==========================================
  "espressosingle": "https://images.unsplash.com/photo-1510707513156-46c0d02df986?auto=format&fit=crop&w=800&q=80",
  "espressodouble": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "americano": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "cappuccino": "https://images.unsplash.com/photo-1571115177098-24ec4209b535?auto=format&fit=crop&w=800&q=80",
  "cafelatte": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80",
  "macchiato": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "cafemocha": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80",
  "caramelmacchiato": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "vanillalatte": "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80",
  "hazelnutlatte": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "coconutmochalatte": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80",
  "flatwhite": "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=800&q=80",
  "whiteamericano": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
  "chailatte": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "hotchocolate": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80",
  "matchalatte": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // ICED COFFEE & FRAPPUCCINO
  // ==========================================
  "icecoffeevanilla": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "icecoffeechocolate": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "icecoffeecaramel": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "hazelnuticecoffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "caramelfrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "vanillafrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "chocolatefrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "hazelnutfrappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // SMOOTHIES & MILKSHAKES
  // ==========================================
  "strawberrysmoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "mangosmoothie": "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80",
  "passionsmoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "bananasmoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "peachsmoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "strawberrymilkshake": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",
  "vanillamilkshake": "https://images.unsplash.com/photo-1572490122820-218b40c89000?auto=format&fit=crop&w=800&q=80",
  "caramelmilkshake": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "chocolatemilkshake": "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&w=800&q=80",
  "oreobananamilkshake": "https://images.unsplash.com/photo-1600718374662-0483d2b9da44?auto=format&fit=crop&w=800&q=80",
  "strawberrybananamilkshake": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // FRESH JUICES
  // ==========================================
  "applejuice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "orangejuice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
  "carrotjuice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
  "gingerjuice": "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80",
  "watermelonjuice": "https://images.unsplash.com/photo-1582284540020-8acae03f417a?auto=format&fit=crop&w=800&q=80",
  "pineapplejuice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "packedjuice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "packedjuicecup": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "mophethwater": "https://images.unsplash.com/photo-1608885898957-a59911ec9df3?auto=format&fit=crop&w=800&q=80",
  "mophethbottlewater": "https://images.unsplash.com/photo-1608885898957-a59911ec9df3?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // SIGNATURE DRINKS & COCKTAILS
  // ==========================================
  "zobodelight": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "arizonasunset": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "upsidemornings": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "evelyn": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "longisland": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "mojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "classicmargarita": "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80",
  "whiskysour": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "whiskeysour": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "tequilasunrise": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "ginbasil": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "virginchapman": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "sexonthebeach": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "maitai": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80",
  "french75": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "rumpunch": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80",
  "mimosa": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "londonmule": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "ameratoursour": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "pinacolada": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80",
  "espressomartini": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // MOCKTAILS
  // ==========================================
  "fruitpunch": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "fruitpunchmocktail": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
  "virginstrawberrydaiquiri": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80",
  "mangomojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "passionfruitmojito": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "passionboaster": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "chapman": "https://images.unsplash.com/photo-1595981267035-7b04ec82a890?auto=format&fit=crop&w=800&q=80",
  "lemonade": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "icetea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "mintedlemonade": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // TEAS
  // ==========================================
  "greentea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "englishbreakfast": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "camomile": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "earlgraytea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "strawberrytea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "cranberrytea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "minttea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "gingerandlemon": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "pepperminttea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",

  // ==========================================
  // EXTRAS
  // ==========================================
  "extrasyrup": "https://images.unsplash.com/photo-1510707513156-46c0d02df986?auto=format&fit=crop&w=800&q=80",
  "extrahoney": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
  "extramilk": "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  "extraespresso": "https://images.unsplash.com/photo-1510707513156-46c0d02df986?auto=format&fit=crop&w=800&q=80",
  "whippedcream": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80"
};

/**
 * Main category/generic keyword mappings to fallback images.
 */
export const CATEGORY_KEYWORDS: Record<string, string> = {
  "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
  "burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "pasta": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
  "sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
  "salad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "breakfast": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80",
  "steak": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "salmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
  "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
  "platter": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "platters": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
  "starter": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "wings": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80",
  "prawns": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80",
  "cookie": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "cookies": "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80",
  "dessert": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=800&q=80",
  "coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "ice-coffee": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
  "frappuccino": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80",
  "milkshake": "https://images.unsplash.com/photo-1572490122820-218b40c89000?auto=format&fit=crop&w=800&q=80",
  "smoothie": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
  "fruit-juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80",
  "cocktail": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
  "mocktail": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
  "teas": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "tea": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
  "drink": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80"
};

// Global cache of live assets uploaded/saved by the admin in MySQL and Firestore
let liveAssetsCache: { id?: string; name: string; url: string; isPreset?: boolean }[] = [];

export function setLiveAssetsCache(assets: { id?: string; name: string; url: string; isPreset?: boolean }[]) {
  if (Array.isArray(assets)) {
    liveAssetsCache = assets.filter(a => a && a.url);
  }
}

export function getLiveAssetsCache(): { id?: string; name: string; url: string; isPreset?: boolean }[] {
  return liveAssetsCache;
}

/**
 * Resolves the absolute best image for any menu item, giving top priority to what the user saved in MySQL / Firestore.
 */
export function resolveItemImage(
  src?: string,
  name?: string,
  category?: string,
  availableGalleryImages?: { name: string; url: string }[]
): string {
  const gallery = (availableGalleryImages && availableGalleryImages.length > 0)
    ? availableGalleryImages
    : getLiveAssetsCache();

  const cleanSrc = (src || "").trim();
  const isDirectUrl = 
    cleanSrc.startsWith("http://") || 
    cleanSrc.startsWith("https://") || 
    cleanSrc.startsWith("data:image/") || 
    cleanSrc.startsWith("blob:") || 
    (cleanSrc.startsWith("/") && (cleanSrc.endsWith(".jpg") || cleanSrc.endsWith(".jpeg") || cleanSrc.endsWith(".png") || cleanSrc.endsWith(".webp") || cleanSrc.endsWith(".svg")));

  // 1. If it's already a full direct URL/data URI, respect and return it immediately
  if (isDirectUrl) {
    return cleanSrc;
  }

  // 2. If cleanSrc is an asset ID or asset Name in user's saved assets
  if (cleanSrc && cleanSrc !== "none" && cleanSrc !== "null" && cleanSrc !== "undefined") {
    const normSrc = normalizeString(cleanSrc);
    if (gallery.length > 0) {
      const match = gallery.find(
        (img) => normalizeString((img as any).id || "") === normSrc || normalizeString(img.name) === normSrc
      );
      if (match && match.url) return match.url;
    }
  }

  // 3. Match item name against user's uploaded MySQL/Firestore assets
  const normName = normalizeString(name || "");
  if (normName && gallery.length > 0) {
    // Exact match
    const exact = gallery.find((img) => normalizeString(img.name) === normName);
    if (exact && exact.url) return exact.url;

    // Substring match
    const sub = gallery.find((img) => {
      const normImg = normalizeString(img.name);
      return (
        normName.includes(normImg) ||
        normImg.includes(normName) ||
        (normImg.length > 3 && normName.includes(normImg.substring(0, Math.min(normImg.length, 8))))
      );
    });
    if (sub && sub.url) return sub.url;
  }

  // 4. Match using standard mapTitleToImageUrl with fallback
  return mapTitleToImageUrl(name, gallery, category);
}

/**
 * Maps any given menu item title or category to a specific, matching, consistent image URL.
 * Checks against custom gallery images, hardcoded presets, and fallback category keywords.
 */
export function mapTitleToImageUrl(
  title?: string,
  availableGalleryImages?: { name: string; url: string }[],
  category?: string
): string {
  const normTitle = normalizeString(title || "");
  const normCat = normalizeString(category || "");
  const gallery = (availableGalleryImages && availableGalleryImages.length > 0)
    ? availableGalleryImages
    : getLiveAssetsCache();

  // 1. Try to find match in the live gallery/assets
  if (gallery && gallery.length > 0) {
    // A. Exact name match
    if (normTitle) {
      const exactMatch = gallery.find(
        (img) => normalizeString(img.name) === normTitle
      );
      if (exactMatch) return exactMatch.url;

      // B. Substring match
      const substringMatch = gallery.find((img) => {
        const normImgName = normalizeString(img.name);
        return (
          normTitle.includes(normImgName) ||
          normImgName.includes(normTitle) ||
          (normImgName.length > 3 && normTitle.includes(normImgName.substring(0, Math.min(normImgName.length, 8))))
        );
      });
      if (substringMatch) return substringMatch.url;
    }

    // C. Keyword-based matching on category
    const searchTerms = [normTitle, normCat].filter(Boolean);
    for (const term of searchTerms) {
      for (const key of Object.keys(CATEGORY_KEYWORDS)) {
        if (term.includes(key)) {
          const keywordMatch = gallery.find((img) =>
            normalizeString(img.name).includes(key)
          );
          if (keywordMatch) return keywordMatch.url;
        }
      }
    }
  }

  // 2. Try exact hardcoded fallback presets
  if (normTitle && IMAGE_FALLBACKS[normTitle]) {
    return IMAGE_FALLBACKS[normTitle];
  }

  // 3. Try substring matching against fallback presets
  if (normTitle) {
    for (const [key, url] of Object.entries(IMAGE_FALLBACKS)) {
      if (normTitle.includes(key) || (key.length > 4 && key.includes(normTitle))) {
        return url;
      }
    }
  }

  // 4. Try matching title with category keywords
  if (normTitle) {
    for (const [key, url] of Object.entries(CATEGORY_KEYWORDS)) {
      if (normTitle.includes(key)) {
        return url;
      }
    }
  }

  // 5. Try matching provided category directly
  if (normCat) {
    for (const [key, url] of Object.entries(CATEGORY_KEYWORDS)) {
      if (normCat.includes(key) || key.includes(normCat)) {
        return url;
      }
    }
  }

  // Default culinary photo
  return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80";
}
