/* Bangali Sweets — frontend runtime config (browser "env").
 * This is the single source of truth for the backend URL.
 * Must be loaded BEFORE api.js and api-bridge.js.
 *
 * For deployment: replace API_BASE below, or have your CI generate this file
 * from a real .env (e.g. `echo "window.BB_CONFIG={API_BASE:'$API_BASE'}" > assets/env.js`).
 */
window.BB_CONFIG = {
  API_BASE: "http://localhost:8080/api",
};
