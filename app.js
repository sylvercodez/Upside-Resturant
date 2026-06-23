/**
 * cPanel Phusion Passenger Startup Entrypoint
 * This file bootstraps the pre-compiled full-stack Node.js server.
 * 
 * Instructions:
 * 1. In your cPanel "Setup Node.js App" GUI:
 *    - Set "Application startup file" to: app.js
 *    - Set "Application root" to your uploaded project directory.
 * 2. Upload this file and the compiled "dist/" folder.
 */

console.log("[cPanel Startup] Bootstrapping Upside Restaurant & Café Server...");
try {
  // Load the esbuild bundle (converts ESM to CommonJS with all server logic & modules)
  require('./dist/server.cjs');
} catch (error) {
  console.error("[cPanel Startup Fatal] Failed to require './dist/server.cjs':", error);
  process.exit(1);
}
