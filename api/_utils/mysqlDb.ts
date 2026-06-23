import mysql from "mysql2/promise";
import { CATEGORIES, MENU_ITEMS } from "../../src/data/menu.js";
import { LAGOS_AREAS } from "../../src/types.js";

let pool: mysql.Pool | null = null;

export function sanitizeMySQLHost(h: string): string {
  if (!h) return "";
  let clean = h.trim();
  // Strip http:// or https:// if provided
  if (clean.toLowerCase().startsWith("http://")) {
    clean = clean.substring(7);
  } else if (clean.toLowerCase().startsWith("https://")) {
    clean = clean.substring(8);
  }
  // Remove any trailing slash/paths like /phpmyadmin or page targets
  const slashIdx = clean.indexOf("/");
  if (slashIdx !== -1) {
    clean = clean.substring(0, slashIdx);
  }
  // Remove trailing colon / port specifications if present
  const colonIdx = clean.indexOf(":");
  if (colonIdx !== -1) {
    clean = clean.substring(0, colonIdx);
  }
  return clean.trim();
}

/**
 * Lazily configures and returns a thread-safe promise-based MySQL connection pool.
 * Does not crash at startup if environment variables are not yet registered.
 */
export function getMySQLPool(): mysql.Pool {
  const rawHost = process.env.MYSQL_HOST || "";
  const host = sanitizeMySQLHost(rawHost);
  const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const user = process.env.MYSQL_USER || "";
  const password = process.env.MYSQL_PASSWORD || "";
  const database = process.env.MYSQL_DATABASE || "";

  if (!host || !user || !database) {
    throw new Error(
      "MySQL Configuration Missing: Please enter your host, username, and database name in your settings or .env configuration."
    );
  }

  if (!pool) {
    console.log(`[MYSQL POOL] Initializing new pool targeting host: ${host}:${port}, database: ${database}`);
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
  }
  return pool;
}

/**
 * Auto-creates the required schema tables and loads static dataset arrays to allow immediate execution
 */
export async function autoInitializeSchema(activePool: mysql.Pool): Promise<void> {
  console.log("[MYSQL AUTO-INIT] Starting self-healing schema creation...");

  // 1. Create categories table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(255),
      deleted TINYINT(1) DEFAULT 0,
      updatedAt VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Create menus/items table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS menus (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DOUBLE NOT NULL DEFAULT 0.0,
      category VARCHAR(255) NOT NULL,
      image TEXT,
      tags TEXT,
      specs TEXT,
      deleted TINYINT(1) DEFAULT 0,
      updatedAt VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Create orders table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(255) PRIMARY KEY,
      userId VARCHAR(255),
      customerName VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(255),
      totalPrice DOUBLE NOT NULL DEFAULT 0.0,
      items TEXT,
      address TEXT,
      status VARCHAR(100) DEFAULT 'Prepping',
      paymentStatus VARCHAR(100) DEFAULT 'unpaid',
      verificationCode VARCHAR(100) DEFAULT NULL,
      assignedRiderId VARCHAR(255) DEFAULT NULL,
      assignedRiderName VARCHAR(255) DEFAULT NULL,
      assignedRiderPhone VARCHAR(255) DEFAULT NULL,
      updatedAt VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Create payments table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      reference VARCHAR(255) PRIMARY KEY,
      amount DOUBLE NOT NULL DEFAULT 0.0,
      paymentStatus VARCHAR(100) DEFAULT 'unpaid',
      orderId VARCHAR(255),
      updatedAt VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 5. Create users table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      uid VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255),
      displayName VARCHAR(255),
      role VARCHAR(100) DEFAULT 'user',
      password_hash VARCHAR(255) DEFAULT NULL,
      disabled TINYINT(1) DEFAULT 0,
      createdAt VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Retroactively ensure password_hash column exists
  try {
    await activePool.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
  } catch (_) {}

  // 6. Create shipping_areas table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS shipping_areas (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      fee DOUBLE NOT NULL DEFAULT 0.0,
      isMainland TINYINT(1) DEFAULT 0,
      deleted TINYINT(1) DEFAULT 0,
      updatedAt VARCHAR(255)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 7. Create settings table
  await activePool.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(255) PRIMARY KEY,
      setting_value TEXT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("[MYSQL AUTO-INIT] Created all tables. Seeding static lists...");

  // Seed categories
  try {
    for (const cat of CATEGORIES) {
      await activePool.execute(
        `INSERT INTO categories (id, name, description, icon, deleted, updatedAt) 
         VALUES (?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), updatedAt=VALUES(updatedAt)`,
        [cat.id, cat.name, cat.description || "", cat.icon || "Sparkles", new Date().toISOString()]
      );
    }
  } catch (err) {
    console.error("[MYSQL AUTO-INIT] Categories seeding failed:", err);
  }

  // Seed menus
  try {
    for (const item of MENU_ITEMS) {
      const tagsStr = item.tags ? item.tags.join(",") : "";
      const specsStr = item.specs ? item.specs.join(",") : "";
      await activePool.execute(
        `INSERT INTO menus (id, name, description, price, category, image, tags, specs, deleted, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), category=VALUES(category), image=VALUES(image), tags=VALUES(tags), specs=VALUES(specs), updatedAt=VALUES(updatedAt)`,
        [item.id, item.name, item.description || "", item.price, item.category, item.image || "", tagsStr, specsStr, new Date().toISOString()]
      );
    }
  } catch (err) {
    console.error("[MYSQL AUTO-INIT] Menus seeding failed:", err);
  }

  // Seed shipping areas
  try {
    for (const area of LAGOS_AREAS) {
      await activePool.execute(
        `INSERT INTO shipping_areas (id, name, fee, isMainland, deleted, updatedAt)
         VALUES (?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), fee=VALUES(fee), isMainland=VALUES(isMainland), updatedAt=VALUES(updatedAt)`,
        [area.id, area.name, area.fee, area.isMainland ? 1 : 0, new Date().toISOString()]
      );
    }
  } catch (err) {
    console.error("[MYSQL AUTO-INIT] Shipping areas seeding failed:", err);
  }

  console.log("[MYSQL AUTO-INIT] Self-healing and seeding completed successfully.");
}

/**
 * Executes a query on the active MySQL pool and automatically releases backend connections
 */
export async function querySql(sql: string, params: any[] = []): Promise<any> {
  const activePool = getMySQLPool();
  try {
    const [rows] = await activePool.execute(sql, params);
    return rows;
  } catch (err: any) {
    const isTableMissing = err && (
      err.code === "ER_NO_SUCH_TABLE" || 
      (err.message && (
        err.message.includes("doesn't exist") || 
        err.message.includes("Table")
      ))
    );
    if (isTableMissing) {
      console.log(`[MYSQL RECOVERY] Query failed: '${sql.substring(0, 100)}...'. Reason: Missing table. Executing auto-initialization...`);
      try {
        await autoInitializeSchema(activePool);
        console.log("[MYSQL RECOVERY] Schema initialized successfully! Retrying original query...");
        const [rows] = await activePool.execute(sql, params);
        return rows;
      } catch (recoveryErr: any) {
        console.error("[MYSQL RECOVERY FATAL ERROR] Failed auto-initialization loop:", recoveryErr);
        throw err;
      }
    }
    throw err;
  }
}

/**
 * Resets the connection pool (used during connection credentials changes)
 */
export function resetMySQLPool() {
  if (pool) {
    console.log("[MYSQL POOL] Terminating existing connection pool (re-authentication sequence).");
    pool.end().catch((err) => {
      const errMsg = err && typeof err.message === "string" ? err.message : String(err || "");
      console.log(`[MYSQL POOL] Notice: Active pool terminated. Status: ${errMsg || "closed"}`);
    });
    pool = null;
  }
}
