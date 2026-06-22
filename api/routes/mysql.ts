import express from "express";
import path from "path";
import fs from "fs";
import { getMySQLPool, querySql, resetMySQLPool, sanitizeMySQLHost } from "../utils/mysqlDb.js";
import { CATEGORIES, MENU_ITEMS } from "../../src/data/menu.js";
import { LAGOS_AREAS } from "../../src/types.js";

export const mysqlRouter = express.Router();

// 1. Route: Save MySQL credentials from the admin UI configurations to .env and running memory process
mysqlRouter.post("/convert-to-env", async (req: any, res: any) => {
  try {
    const { host, port, user, password, database } = req.body;
    if (!host || !user || !database) {
      return res.status(400).json({ error: "Missing required MySQL credentials: host, user, database are required." });
    }

    const cleanHost = sanitizeMySQLHost(host);

    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    const keysMap: Record<string, string> = {
      MYSQL_HOST: cleanHost,
      MYSQL_PORT: (port || "3306").toString().trim(),
      MYSQL_USER: user.trim(),
      MYSQL_PASSWORD: (password || "").trim(),
      MYSQL_DATABASE: database.trim()
    };

    let envLines = envContent ? envContent.split("\n") : [];
    for (const [key, val] of Object.entries(keysMap)) {
      const index = envLines.findIndex(line => line.startsWith(`${key}=`) || line.startsWith(`# ${key}=`) || line.startsWith(`${key} =`));
      if (index >= 0) {
        envLines[index] = `${key}=${val}`;
      } else {
        envLines.push(`${key}=${val}`);
      }
      process.env[key] = val; // Update process memory directly
    }

    fs.writeFileSync(envPath, envLines.join("\n"), "utf-8");
    console.log("[MYSQL CONFIG] Successfully updated env keys and synchronized app process!");
    
    // Reset our active connection pool so that a new one is re-initialized with these credentials
    resetMySQLPool();

    return res.json({ success: true, message: "MySQL database configurations converted and saved securely!" });
  } catch (err: any) {
    console.error("[MYSQL Config Route] Error converting keys:", err);
    return res.status(500).json({ error: err.message || "Unable to save MySQL configurations to env." });
  }
});

// 2. Route: Check MySQL connection status and query statistics
mysqlRouter.get("/status", async (req: any, res: any) => {
  const host = sanitizeMySQLHost(process.env.MYSQL_HOST || "");
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const port = process.env.MYSQL_PORT || "3306";

  if (!host || !user || !database) {
    return res.json({
      connected: false,
      message: "MySQL is not configured yet. Credentials are empty.",
      config: { host, port, user, database: "Not set" }
    });
  }

  try {
    // Run a fast ping query
    const results = await querySql("SELECT 1 + 1 AS result");
    
    // Fetch count of tables if possible to show structure info
    let schemaStats: any = [];
    try {
      schemaStats = await querySql(
        "SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
        [database]
      );
    } catch (_) {}

    return res.json({
      connected: true,
      message: "Successfully connected to cPanel MySQL Server!",
      result: results?.[0]?.result,
      config: { host, port, user, database },
      tables: schemaStats.map((t: any) => ({
        tableName: t.TABLE_NAME || t.table_name || "unknown",
        rows: t.TABLE_ROWS || t.table_rows || 0
      }))
    });
  } catch (err: any) {
    console.warn("[MYSQL GET STATUS WARN] Could not establish connection:", err.message);
    return res.json({
      connected: false,
      message: `Failed to connect to MySQL host: ${err.message}`,
      config: { host, port, user, database }
    });
  }
});

// 2b. Route: Detailed database connectivity diagnostic with shorter timeout and verbose error logging
mysqlRouter.get("/diagnostic", async (req: any, res: any) => {
  const host = sanitizeMySQLHost(process.env.MYSQL_HOST || "");
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const port = parseInt(process.env.MYSQL_PORT || "3306", 10);
  const password = process.env.MYSQL_PASSWORD || "";

  if (!host || !user || !database) {
    return res.status(400).json({
      success: false,
      errorCategory: "UNCONFIGURED",
      message: "MySQL configuration environment variables are not fully configured yet."
    });
  }

  console.log(`[MYSQL DIAGNOSTIC] Initiating connection handshake to ${host}:${port}, database: ${database}, user: ${user}...`);
  
  let connection: any = null;
  try {
    const mysql = await import("mysql2/promise");
    
    // Create connection with an explicit 5-second socket handshake timeout
    connection = await mysql.default.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: 5000
    });

    console.log("[MYSQL DIAGNOSTIC] TCP connection established successfully. Running validation test query 'SELECT 1 AS diagnostic_test'...");
    const [rows]: any = await connection.execute("SELECT 1 AS diagnostic_test");
    
    console.log("[MYSQL DIAGNOSTIC] Validation query succeeded. Result rows:", rows);

    await connection.end();

    return res.json({
      success: true,
      message: "MySQL Connection Diagnostic passed successfully! Connection can be established.",
      details: {
        host,
        port,
        user,
        database,
        queryResult: rows
      }
    });
  } catch (err: any) {
    console.error("[MYSQL DIAGNOSTIC CRITICAL FAILURE] Detailed breakdown of connection error:", err);
    
    if (connection) {
      try {
        await connection.end();
      } catch (_) {}
    }

    // Capture standard rich properties returned from Node runtime Net/DNS/MySQL drivers
    const errorDetails = {
      message: err.message || String(err),
      code: err.code || null,         // e.g. 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'
      errno: err.errno || null,       // error number
      sqlState: err.sqlState || null, // ANSI SQL state standard
      syscall: err.syscall || null,   // system call level failure
      address: err.address || null,   // resolved IP target address
      port: err.port || null          // remote target port
    };

    return res.status(500).json({
      success: false,
      errorCategory: "CONNECTION_FAILED",
      message: `MySQL diagnostic connection failed: ${err.message || err}`,
      errorDetails
    });
  }
});

// 3. Route: Setup Database Schemas and Seed structural lists (cPanel MySQL preparation)
mysqlRouter.post("/setup", async (req: any, res: any) => {
  try {
    console.log("[MYSQL SETUP] Starting schema setup and database initialization...");

    // Create categories table
    await querySql(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(255),
        deleted TINYINT(1) DEFAULT 0,
        updatedAt VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create menus/items table
    await querySql(`
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

    // Create orders table
    await querySql(`
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

    // Create payments table
    await querySql(`
      CREATE TABLE IF NOT EXISTS payments (
        reference VARCHAR(255) PRIMARY KEY,
        amount DOUBLE NOT NULL DEFAULT 0.0,
        paymentStatus VARCHAR(100) DEFAULT 'unpaid',
        orderId VARCHAR(255),
        updatedAt VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create users table
    await querySql(`
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

    // Retroactively add password_hash column if table already existed without it
    try {
      await querySql("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL");
    } catch (_) {}

    // Create shipping_areas table
    await querySql(`
      CREATE TABLE IF NOT EXISTS shipping_areas (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        fee DOUBLE NOT NULL DEFAULT 0.0,
        isMainland TINYINT(1) DEFAULT 0,
        deleted TINYINT(1) DEFAULT 0,
        updatedAt VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create administrative settings table
    await querySql(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // SEED STRUCTURAL DATA
    let catsSeeded = 0;
    for (const cat of CATEGORIES) {
      await querySql(
        `INSERT INTO categories (id, name, description, icon, deleted, updatedAt) 
         VALUES (?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), updatedAt=VALUES(updatedAt)`,
        [cat.id, cat.name, cat.description || "", cat.icon || "Sparkles", new Date().toISOString()]
      );
      catsSeeded++;
    }

    let menusSeeded = 0;
    for (const item of MENU_ITEMS) {
      const tagsStr = item.tags ? item.tags.join(",") : "";
      const specsStr = item.specs ? item.specs.join(",") : "";
      await querySql(
        `INSERT INTO menus (id, name, description, price, category, image, tags, specs, deleted, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), category=VALUES(category), image=VALUES(image), tags=VALUES(tags), specs=VALUES(specs), updatedAt=VALUES(updatedAt)`,
        [item.id, item.name, item.description || "", item.price, item.category, item.image || "", tagsStr, specsStr, new Date().toISOString()]
      );
      menusSeeded++;
    }

    let areasSeeded = 0;
    for (const area of LAGOS_AREAS) {
      await querySql(
        `INSERT INTO shipping_areas (id, name, fee, isMainland, deleted, updatedAt)
         VALUES (?, ?, ?, ?, 0, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), fee=VALUES(fee), isMainland=VALUES(isMainland), updatedAt=VALUES(updatedAt)`,
        [area.id, area.name, area.fee, area.isMainland ? 1 : 0, new Date().toISOString()]
      );
      areasSeeded++;
    }

    return res.json({
      success: true,
      message: "Database tables initialized and populated with structural static records successfully!",
      seeded: {
        categories: catsSeeded,
        menuItems: menusSeeded,
        shippingAreas: areasSeeded
      }
    });
  } catch (err: any) {
    console.error("[MYSQL SETUP ERROR] Schema execution crashed:", err);
    return res.status(500).json({ error: `Schema setup crashed: ${err.message}` });
  }
});

// 4. Route: Import/Sync Firestore custom dynamic updates into the MySQL tables directly
mysqlRouter.post("/sync", async (req: any, res: any) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let databaseId = "ai-studio-7ee29b67-2013-4587-a753-b479a6e19155";
    let firebaseConfig: any = null;
    
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (firebaseConfig.firestoreDatabaseId) databaseId = firebaseConfig.firestoreDatabaseId;
    } else {
      firebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "gen-lang-client-0332471137",
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBlIddU4ZP6QsC212vb__3AoMKH9MA-_1E",
        authDomain: (process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0332471137") + ".firebaseapp.com"
      };
    }

    const { initializeApp } = await import("firebase/app");
    const { getFirestore, getDocs, collection } = await import("firebase/firestore");

    const appInstance = initializeApp(firebaseConfig, "mysql-sync-app");
    const fdb = getFirestore(appInstance, databaseId);

    let usersSynced = 0;
    let ordersSynced = 0;
    let paymentsSynced = 0;

    // A. Sync Users from Firestore to MySQL
    try {
      const usersSnap = await getDocs(collection(fdb, "users"));
      for (const d of usersSnap.docs) {
        const u = d.data();
        await querySql(
          `INSERT INTO users (uid, email, displayName, role, disabled, createdAt)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE email=VALUES(email), displayName=VALUES(displayName), role=VALUES(role), disabled=VALUES(disabled)`,
          [d.id, u.email || "", u.displayName || "", u.role || "user", u.disabled ? 1 : 0, u.createdAt || ""]
        );
        usersSynced++;
      }
    } catch (ue) {
      console.warn("User sync warning:", ue);
    }

    // B. Sync Orders from Firestore to MySQL
    try {
      const ordersSnap = await getDocs(collection(fdb, "orders"));
      for (const d of ordersSnap.docs) {
        const o = d.data();
        const itemsStr = typeof o.items === "string" ? o.items : JSON.stringify(o.items || []);
        await querySql(
          `INSERT INTO orders (id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, verificationCode, assignedRiderId, assignedRiderName, assignedRiderPhone, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), paymentStatus=VALUES(paymentStatus), verificationCode=VALUES(verificationCode), assignedRiderId=VALUES(assignedRiderId), assignedRiderName=VALUES(assignedRiderName), assignedRiderPhone=VALUES(assignedRiderPhone), updatedAt=VALUES(updatedAt)`,
          [d.id, o.userId || "", o.customerName || "", o.email || "", o.phone || "", o.totalPrice || 0, itemsStr, o.address || "", o.status || "Prepping", o.paymentStatus || "unpaid", o.verificationCode || "", o.assignedRiderId || "", o.assignedRiderName || "", o.assignedRiderPhone || "", o.updatedAt || ""]
        );
        ordersSynced++;
      }
    } catch (oe) {
      console.warn("Orders sync warning:", oe);
    }

    // C. Sync Payments from Firestore to MySQL
    try {
      const paymentsSnap = await getDocs(collection(fdb, "payments"));
      for (const d of paymentsSnap.docs) {
        const p = d.data();
        await querySql(
          `INSERT INTO payments (reference, amount, paymentStatus, orderId, updatedAt)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE paymentStatus=VALUES(paymentStatus), updatedAt=VALUES(updatedAt)`,
          [d.id, p.amount || 0, p.paymentStatus || "unpaid", p.orderId || "", p.updatedAt || ""]
        );
        paymentsSynced++;
      }
    } catch (pe) {
      console.warn("Payments sync warning:", pe);
    }

    return res.json({
      success: true,
      message: "Dynamic Firestore records fully replicated and synchronized with MySQL tables!",
      synced: {
        users: usersSynced,
        orders: ordersSynced,
        payments: paymentsSynced
      }
    });
  } catch (err: any) {
    console.error("[MYSQL SYNC CRITICAL ERROR]:", err);
    return res.status(500).json({ error: `Sync execution failed: ${err.message}` });
  }
});

// 5. Route: Serve a full schema + data insertion executable .sql DB Dump file download for cPanel phpMyAdmin
mysqlRouter.get("/export", async (req: any, res: any) => {
  try {
    const database = process.env.MYSQL_DATABASE || "upside_restaurant_db";
    let sqlDump = `-- ==========================================
-- UPSIDE RESTAURANT & CAFÉ DATABASE MIGRATION DUMP
-- Compatible with cPanel, Hostinger, phpMyAdmin (MySQL 5.7 / 8.0+)
-- Generated on: ${new Date().toUTCString()}
-- ==========================================\n\n`;

    sqlDump += `CREATE DATABASE IF NOT EXISTS \`${database}\`;\n`;
    sqlDump += `USE \`${database}\`;\n\n`;

    // Retrieve categories
    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE & INSERTS FOR: categories
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`categories\`;\n`;
    sqlDump += `CREATE TABLE \`categories\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`icon\` varchar(255) DEFAULT NULL,
  \`deleted\` tinyint(1) DEFAULT 0,
  \`updatedAt\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const categories = await querySql("SELECT * FROM categories");
      if (categories && categories.length > 0) {
        sqlDump += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`description\`, \`icon\`, \`deleted\`, \`updatedAt\`) VALUES\n`;
        categories.forEach((c: any, idx: number) => {
          const desc = c.description ? c.description.replace(/'/g, "''") : "";
          const isLast = idx === categories.length - 1;
          sqlDump += `('${c.id}', '${c.name.replace(/'/g, "''")}', '${desc}', '${c.icon || "Sparkles"}', ${c.deleted ? 1 : 0}, '${c.updatedAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    // Retrieve menus
    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE & INSERTS FOR: menus
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`menus\`;\n`;
    sqlDump += `CREATE TABLE \`menus\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`description\` text DEFAULT NULL,
  \`price\` double NOT NULL DEFAULT 0,
  \`category\` varchar(255) NOT NULL,
  \`image\` text DEFAULT NULL,
  \`tags\` text DEFAULT NULL,
  \`specs\` text DEFAULT NULL,
  \`deleted\` tinyint(1) DEFAULT 0,
  \`updatedAt\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const menus = await querySql("SELECT * FROM menus");
      if (menus && menus.length > 0) {
        sqlDump += `INSERT INTO \`menus\` (\`id\`, \`name\`, \`description\`, \`price\`, \`category\`, \`image\`, \`tags\`, \`specs\`, \`deleted\`, \`updatedAt\`) VALUES\n`;
        menus.forEach((m: any, idx: number) => {
          const dDesc = m.description ? m.description.replace(/'/g, "''") : "";
          const mName = m.name ? m.name.replace(/'/g, "''") : "";
          const mImg = m.image ? m.image.replace(/'/g, "''") : "";
          const mTags = m.tags ? m.tags.replace(/'/g, "''") : "";
          const mSpecs = m.specs ? m.specs.replace(/'/g, "''") : "";
          const isLast = idx === menus.length - 1;
          sqlDump += `('${m.id}', '${mName}', '${dDesc}', ${m.price}, '${m.category}', '${mImg}', '${mTags}', '${mSpecs}', ${m.deleted ? 1 : 0}, '${m.updatedAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    // Retrieve shipping areas
    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE & INSERTS FOR: shipping_areas
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`shipping_areas\`;\n`;
    sqlDump += `CREATE TABLE \`shipping_areas\` (
  \`id\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`fee\` double NOT NULL DEFAULT 0,
  \`isMainland\` tinyint(1) DEFAULT 0,
  \`deleted\` tinyint(1) DEFAULT 0,
  \`updatedAt\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const areas = await querySql("SELECT * FROM shipping_areas");
      if (areas && areas.length > 0) {
        sqlDump += `INSERT INTO \`shipping_areas\` (\`id\`, \`name\`, \`fee\`, \`isMainland\`, \`deleted\`, \`updatedAt\`) VALUES\n`;
        areas.forEach((a: any, idx: number) => {
          const isLast = idx === areas.length - 1;
          sqlDump += `('${a.id}', '${a.name.replace(/'/g, "''")}', ${a.fee}, ${a.isMainland ? 1 : 0}, ${a.deleted ? 1 : 0}, '${a.updatedAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    // Retrieve other tables structure (orders, payments, users)
    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE FOR: orders
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`orders\`;\n`;
    sqlDump += `CREATE TABLE \`orders\` (
  \`id\` varchar(255) NOT NULL,
  \`userId\` varchar(255) DEFAULT NULL,
  \`customerName\` varchar(255) DEFAULT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(255) DEFAULT NULL,
  \`totalPrice\` double NOT NULL DEFAULT 0,
  \`items\` text DEFAULT NULL,
  \`address\` text DEFAULT NULL,
  \`status\` varchar(100) DEFAULT 'Prepping',
  \`paymentStatus\` varchar(100) DEFAULT 'unpaid',
  \`updatedAt\` varchar(255) DEFAULT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const orders = await querySql("SELECT * FROM orders");
      if (orders && orders.length > 0) {
        sqlDump += `INSERT INTO \`orders\` (\`id\`, \`userId\`, \`customerName\`, \`email\`, \`phone\`, \`totalPrice\`, \`items\`, \`address\`, \`status\`, \`paymentStatus\`, \`updatedAt\`) VALUES\n`;
        orders.forEach((o: any, idx: number) => {
          const isLast = idx === orders.length - 1;
          const itemsEscaped = o.items ? o.items.replace(/'/g, "''") : "[]";
          const addrEscaped = o.address ? o.address.replace(/'/g, "''") : "";
          const nameEscaped = o.customerName ? o.customerName.replace(/'/g, "''") : "";
          sqlDump += `('${o.id}', '${o.userId || ""}', '${nameEscaped}', '${o.email || ""}', '${o.phone || ""}', ${o.totalPrice}, '${itemsEscaped}', '${addrEscaped}', '${o.status}', '${o.paymentStatus}', '${o.updatedAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE FOR: payments
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`payments\`;\n`;
    sqlDump += `CREATE TABLE \`payments\` (
  \`reference\` varchar(255) NOT NULL,
  \`amount\` double NOT NULL DEFAULT 0,
  \`paymentStatus\` varchar(100) DEFAULT 'unpaid',
  \`orderId\` varchar(255) DEFAULT NULL,
  \`updatedAt\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`reference\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const payments = await querySql("SELECT * FROM payments");
      if (payments && payments.length > 0) {
        sqlDump += `INSERT INTO \`payments\` (\`reference\`, \`amount\`, \`paymentStatus\`, \`orderId\`, \`updatedAt\`) VALUES\n`;
        payments.forEach((p: any, idx: number) => {
          const isLast = idx === payments.length - 1;
          sqlDump += `('${p.reference}', ${p.amount}, '${p.paymentStatus}', '${p.orderId}', '${p.updatedAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    sqlDump += `-- ----------------------------------------------------
-- TABLE STRUCTURE FOR: users
-- ----------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`users\`;\n`;
    sqlDump += `CREATE TABLE \`users\` (
  \`uid\` varchar(255) NOT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`displayName\` varchar(255) DEFAULT NULL,
  \`role\` varchar(100) DEFAULT 'user',
  \`disabled\` tinyint(1) DEFAULT 0,
  \`createdAt\` varchar(255) DEFAULT NULL,
  PRIMARY KEY (\`uid\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    try {
      const users = await querySql("SELECT * FROM users");
      if (users && users.length > 0) {
        sqlDump += `INSERT INTO \`users\` (\`uid\`, \`email\`, \`displayName\`, \`role\`, \`disabled\`, \`createdAt\`) VALUES\n`;
        users.forEach((u: any, idx: number) => {
          const isLast = idx === users.length - 1;
          const displayEscaped = u.displayName ? u.displayName.replace(/'/g, "''") : "";
          sqlDump += `('${u.uid}', '${u.email || ""}', '${displayEscaped}', '${u.role || "user"}', ${u.disabled ? 1 : 0}, '${u.createdAt || ""}')${isLast ? ";" : ",\n"}`;
        });
        sqlDump += "\n\n";
      }
    } catch (_) {}

    sqlDump += `COMMIT;\n`;

    res.setHeader("Content-Type", "application/sql");
    res.setHeader("Content-Disposition", "attachment; filename=upside_restaurant_mysql_dump.sql");
    return res.status(200).send(sqlDump);
  } catch (err: any) {
    console.error("[MYSQL EXPORT ERROR] Critical dump collapse:", err);
    return res.status(500).json({ error: `Dump failed: ${err.message}` });
  }
});

// ==========================================
// 5. NATIVE MYSQL HANDLERS AND AUTHENTICATION
// ==========================================

import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 5a. MySQL Native Auth Registration
mysqlRouter.post("/auth/register", async (req: any, res: any) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and full name are required." });
    }

    const emailLower = email.toLowerCase().trim();
    // Validate email isn't already used
    const existing: any[] = await querySql("SELECT * FROM users WHERE LOWER(email) = ?", [emailLower]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ error: "Email is already registered! If this is your account, please log in." });
    }

    const passHash = hashPassword(password);
    const uid = "mysql_usr_" + Math.random().toString(36).substring(2, 11);

    const isAdminEmail = 
      emailLower === "tosinotenaike3@gmail.com" || 
      emailLower === "tobi@gmail.com" || 
      emailLower === "mophethecommerce@gmail.com" ||
      emailLower.includes("mophethecommerce");
    const role = isAdminEmail ? "admin" : "user";

    await querySql(
      "INSERT INTO users (uid, email, displayName, role, password_hash, disabled, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)",
      [uid, emailLower, displayName.trim(), role, passHash, new Date().toISOString()]
    );

    return res.json({
      success: true,
      user: {
        uid,
        email: emailLower,
        displayName: displayName.trim(),
        role,
        disabled: false
      }
    });
  } catch (err: any) {
    console.error("[MYSQL AUTH REGISTER ERROR]:", err);
    return res.status(500).json({ error: err.message || "Native registration failed." });
  }
});

// 5b. MySQL Native Auth Login
mysqlRouter.post("/auth/login", async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const emailLower = email.toLowerCase().trim();
    const records: any[] = await querySql("SELECT * FROM users WHERE LOWER(email) = ?", [emailLower]);
    if (!records || records.length === 0) {
      return res.status(401).json({ error: "No account found with this email. Please sign up." });
    }

    const user = records[0];
    if (user.disabled || user.disabled === 1) {
      return res.status(403).json({ error: "Your user login has been disabled by the system administrator." });
    }

    const passHash = hashPassword(password);
    if (user.password_hash && user.password_hash !== passHash) {
      return res.status(401).json({ error: "Incorrect security credentials. Please re-enter your password." });
    }

    // Connect existing user that has no password hash set yet
    if (!user.password_hash) {
      await querySql("UPDATE users SET password_hash = ? WHERE uid = ?", [passHash, user.uid]);
    }

    return res.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split("@")[0],
        role: user.role || "user",
        disabled: false
      }
    });
  } catch (err: any) {
    console.error("[MYSQL AUTH LOGIN ERROR]:", err);
    return res.status(500).json({ error: err.message || "Authentication failed." });
  }
});

// 5c. Menus Endpoint Definitions
mysqlRouter.get("/menus", async (req: any, res: any) => {
  try {
    const rows = await querySql("SELECT * FROM menus WHERE deleted = 0");
    const items = rows.map((r: any) => ({
      ...r,
      tags: r.tags ? r.tags.split(",") : [],
      specs: r.specs ? r.specs.split(",") : [],
      price: parseFloat(r.price)
    }));
    return res.json(items);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to load menus." });
  }
});

mysqlRouter.post("/menus", async (req: any, res: any) => {
  try {
    const { id, name, description, price, category, image, tags, specs } = req.body;
    if (!id || !name || !category) {
      return res.status(400).json({ error: "Missing required menu properties: id, name, category are required." });
    }
    const tagsStr = Array.isArray(tags) ? tags.join(",") : (tags || "");
    const specsStr = Array.isArray(specs) ? specs.join(",") : (specs || "");

    await querySql(
      `INSERT INTO menus (id, name, description, price, category, image, tags, specs, deleted, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), price=VALUES(price), category=VALUES(category), image=VALUES(image), tags=VALUES(tags), specs=VALUES(specs), deleted=0, updatedAt=VALUES(updatedAt)`,
      [id, name, description || "", parseFloat(price || "0"), category, image || "", tagsStr, specsStr, new Date().toISOString()]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed." });
  }
});

mysqlRouter.delete("/menus/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await querySql("UPDATE menus SET deleted = 1, updatedAt = ? WHERE id = ?", [new Date().toISOString(), id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5d. Categories Endpoint Definitions
mysqlRouter.get("/categories", async (req: any, res: any) => {
  try {
    const rows = await querySql("SELECT * FROM categories WHERE deleted = 0");
    return res.json(rows);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.post("/categories", async (req: any, res: any) => {
  try {
    const { id, name, description, icon } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Missing id/name for category." });
    }
    await querySql(
      `INSERT INTO categories (id, name, description, icon, deleted, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon), deleted=0, updatedAt=VALUES(updatedAt)`,
      [id, name, description || "", icon || "Sparkles", new Date().toISOString()]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.delete("/categories/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await querySql("UPDATE categories SET deleted = 1, updatedAt = ? WHERE id = ?", [new Date().toISOString(), id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5e. Shipping Areas Endpoint Definitions
mysqlRouter.get("/shipping-areas", async (req: any, res: any) => {
  try {
    const rows = await querySql("SELECT * FROM shipping_areas WHERE deleted = 0");
    const areas = rows.map((r: any) => ({
      ...r,
      fee: parseFloat(r.fee),
      isMainland: r.isMainland === 1 || r.isMainland === true
    }));
    return res.json(areas);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.post("/shipping-areas", async (req: any, res: any) => {
  try {
    const { id, name, fee, isMainland } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Missing id/name." });
    }
    await querySql(
      `INSERT INTO shipping_areas (id, name, fee, isMainland, deleted, updatedAt)
       VALUES (?, ?, ?, ?, 0, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), fee=VALUES(fee), isMainland=VALUES(isMainland), deleted=0, updatedAt=VALUES(updatedAt)`,
      [id, name, parseFloat(fee || "0"), isMainland ? 1 : 0, new Date().toISOString()]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.delete("/shipping-areas/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await querySql("UPDATE shipping_areas SET deleted = 1, updatedAt = ? WHERE id = ?", [new Date().toISOString(), id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5f. Orders Endpoint Definitions
mysqlRouter.get("/orders", async (req: any, res: any) => {
  try {
    const { userId, email } = req.query;
    let queryStr = "SELECT * FROM orders";
    let params: any[] = [];

    if (userId) {
      queryStr += " WHERE userId = ?";
      params.push(userId);
    } else if (email) {
      queryStr += " WHERE LOWER(email) = ?";
      params.push(email.toLowerCase().trim());
    }

    queryStr += " ORDER BY createdAt DESC";
    const rows = await querySql(queryStr, params);

    const orders = rows.map((r: any) => {
      let parsedItems = [];
      try {
        parsedItems = typeof r.items === "string" ? JSON.parse(r.items) : (r.items || []);
      } catch (_) {
        parsedItems = [];
      }
      return {
        ...r,
        items: parsedItems,
        totalPrice: parseFloat(r.totalPrice)
      };
    });

    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.post("/orders", async (req: any, res: any) => {
  try {
    const { id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, verificationCode, assignedRiderId, assignedRiderName, assignedRiderPhone } = req.body;
    if (!id || !customerName) {
      return res.status(400).json({ error: "Missing required order fields: id and name are required." });
    }
    const itemsStr = typeof items === "string" ? items : JSON.stringify(items || []);

    await querySql(
      `INSERT INTO orders (id, userId, customerName, email, phone, totalPrice, items, address, status, paymentStatus, verificationCode, assignedRiderId, assignedRiderName, assignedRiderPhone, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE customerName=VALUES(customerName), email=VALUES(email), phone=VALUES(phone), totalPrice=VALUES(totalPrice), items=VALUES(items), address=VALUES(address), status=VALUES(status), paymentStatus=VALUES(paymentStatus), verificationCode=VALUES(verificationCode), assignedRiderId=VALUES(assignedRiderId), assignedRiderName=VALUES(assignedRiderName), assignedRiderPhone=VALUES(assignedRiderPhone), updatedAt=VALUES(updatedAt)`,
      [id, userId || "guest", customerName, email || "", phone || "", parseFloat(totalPrice || "0"), itemsStr, address || "", status || "Prepping", paymentStatus || "unpaid", verificationCode || "", assignedRiderId || "", assignedRiderName || "", assignedRiderPhone || "", new Date().toISOString()]
    );

    return res.json({ success: true, orderId: id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.put("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, verificationCode, assignedRiderId, assignedRiderName, assignedRiderPhone } = req.body;

    let updates: string[] = [];
    let params: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }
    if (paymentStatus !== undefined) {
      updates.push("paymentStatus = ?");
      params.push(paymentStatus);
    }
    if (verificationCode !== undefined) {
      updates.push("verificationCode = ?");
      params.push(verificationCode);
    }
    if (assignedRiderId !== undefined) {
      updates.push("assignedRiderId = ?");
      params.push(assignedRiderId);
    }
    if (assignedRiderName !== undefined) {
      updates.push("assignedRiderName = ?");
      params.push(assignedRiderName);
    }
    if (assignedRiderPhone !== undefined) {
      updates.push("assignedRiderPhone = ?");
      params.push(assignedRiderPhone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields specified for update." });
    }

    updates.push("updatedAt = ?");
    params.push(new Date().toISOString());

    params.push(id);

    await querySql(`UPDATE orders SET ${updates.join(", ")} WHERE id = ?`, params);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.delete("/orders/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await querySql("DELETE FROM orders WHERE id = ?", [id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5g. Full Users List and role/disabled controllers
mysqlRouter.get("/users/all", async (req: any, res: any) => {
  try {
    const rows = await querySql("SELECT uid, email, displayName, role, disabled, createdAt FROM users");
    const users = rows.map((r: any) => ({
      ...r,
      disabled: r.disabled === 1 || r.disabled === true
    }));
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

mysqlRouter.put("/users/:uid", async (req: any, res: any) => {
  try {
    const { uid } = req.params;
    const { role, disabled } = req.body;

    let updates: string[] = [];
    let params: any[] = [];

    if (role !== undefined) {
      updates.push("role = ?");
      params.push(role);
    }
    if (disabled !== undefined) {
      updates.push("disabled = ?");
      params.push(disabled ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No properties specified for update." });
    }

    params.push(uid);

    await querySql(`UPDATE users SET ${updates.join(", ")} WHERE uid = ?`, params);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
