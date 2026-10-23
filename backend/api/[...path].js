// Vercel serverless entry point (catch-all) — preset-independent.
//
// Every request to this project is routed to this single function. We hand the
// raw (req, res) to the Express app, which matches the FULL request path
// (e.g. /api/v1/health) against its routes. Works for all subpaths
// (/api/v1/*, /api/agent, ...).
//
// The Express app is imported lazily (and cached) so that any load-time
// failure is caught and returned in the response body — making the function
// self-diagnosing instead of failing with an opaque platform error.
let cachedApp = null;
let loadError = null;

async function loadApp() {
  if (cachedApp) return cachedApp;
  if (loadError) throw loadError;
  try {
    const mod = await import("../src/index.js");
    cachedApp = mod.default;
    return cachedApp;
  } catch (err) {
    loadError = err;
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    // This function is mounted at /api, so Vercel passes req.url relative to
    // that mount (e.g. /v1/health for /api/v1/health). The Express routes are
    // mounted at /api/v1 and /api/agent, so restore the full path. Guarded so
    // it is also correct if Vercel ever passes the full path already.
    const u = req.url || "/";
    if (!u.startsWith("/api")) {
      req.url = "/api" + u;
    }
    const app = await loadApp();
    return app(req, res);
  } catch (err) {
    console.error("[Vercel handler] error:", err);
    const status = (err && err.status) || 500;
    res.statusCode = status;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: "HANDLER_ERROR",
          message: String((err && err.message) || err),
          stack: ((err && err.stack) || "").slice(0, 3000),
        },
      })
    );
  }
}