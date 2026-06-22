import mysql from "mysql2/promise";

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
 * Executes a query on the active MySQL pool and automatically releases backend connections
 */
export async function querySql(sql: string, params: any[] = []): Promise<any> {
  const activePool = getMySQLPool();
  const [rows] = await activePool.execute(sql, params);
  return rows;
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
