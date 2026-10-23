import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import rbacRoutes from "./routes/rbacRoutes.js";
import entityRoutes from "./routes/entityRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import ocrRoutes from "./routes/ocrRoutes.js";
import advocateRoutes from "./routes/advocateRoutes.js";
import clientPortalRoutes from "./routes/clientPortalRoutes.js";
import queryRoutes from "./routes/queryRoutes.js";
import domainIntelligenceRoutes from "./routes/domainIntelligenceRoutes.js";
import advancedAnalysisRoutes from "./routes/advancedAnalysisRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import auditorRoutes from "./routes/auditorRoutes.js";
import { allowedOrigins, isProduction } from "./config/index.js";
const app = express();
const PORT = process.env.PORT || 5e3;
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header (same-origin / non-browser clients) or allowlisted origin.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy error: Origin not permitted."));
      }
    },
    credentials: true
  })
);
app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Netfix AI \u2014 MARG GROUP Backend API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/rbac", rbacRoutes);
app.use("/api/v1/entities", entityRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/cases", caseRoutes);
app.use("/api/v1/documents", documentRoutes);
app.use("/api/v1/internal", ocrRoutes);
app.use("/api/v1/advocate", advocateRoutes);
app.use("/api/v1/client", clientPortalRoutes);
app.use("/api/v1/auditor", auditorRoutes);
app.use("/api/v1/query", queryRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/v1/agent", agentRoutes);
app.use("/api/v1", domainIntelligenceRoutes);
app.use("/api/v1", advancedAnalysisRoutes);
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint does not exist."
    }
  });
});
app.use((err, _req, res, _next) => {
  console.error("[GlobalErrorHandler]", err.stack || err.message);
  const status = err.status || 500;
  // In production, do not leak internal error details to the client.
  const message = isProduction ? "An unexpected server error occurred." : err.message;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message
    }
  });
});
// Local dev: start the server. On Vercel the app is exported as a single
// serverless function (see vercel.json) and this listener must NOT run —
// Vercel sets VERCEL=true (and NODE_ENV=production), so skip listen there.
const isVercel =
  process.env.VERCEL === "true" || process.env.VERCEL_ENV !== undefined;
if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`============================================================`);
    console.log(`\u{1F680} NETFIX AI Backend API running on port ${PORT}`);
    console.log(`\u{1F310} Frontend Origin: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log(`\u{1F6E1}\uFE0F Admin Origin:    ${process.env.ADMIN_URL || "http://localhost:3001"}`);
    console.log(`============================================================`);
  });
}

// Vercel serverless export — the whole Express app becomes one function.
export default app;
