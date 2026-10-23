// Vercel serverless entry point (catch-all).
//
// Every request to this project is routed to this single function. We hand the
// raw (req, res) straight to the Express app, which matches the FULL request
// path (e.g. /api/v1/health) against its routes. This is the classic,
// framework-preset-independent way to run Express on Vercel and works for all
// subpaths (/api/v1/*, /api/agent, ...).
import app from "./src/index.js";

export default function handler(req, res) {
  // Surface any synchronous failure in the response so it is diagnosable.
  try {
    return app(req, res);
  } catch (err) {
    console.error("[Vercel handler] synchronous error:", err);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        error: {
          code: "SYNC_HANDLER_ERROR",
          message: String((err && err.message) || err),
          stack: ((err && err.stack) || "").slice(0, 2000),
        },
      })
    );
  }
}