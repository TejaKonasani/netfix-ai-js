import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiModelFlash, geminiModelPro } from "../config/index.js";
class GeminiService {
  noKeyMode = false;
  apiKey = "";
  flashModelName = geminiModelFlash;
  proModelName = geminiModelPro;
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      console.warn("[GeminiService] GEMINI_API_KEY is not set \u2014 all calls will return rule_based_fallback");
      this.noKeyMode = true;
    } else {
      this.apiKey = apiKey;
    }
  }
  async call(options) {
    if (this.noKeyMode) {
      this.logFallback(options.agentKey, "no_api_key", 0);
      return { ai_source: "rule_based_fallback" };
    }
    const modelName = this.getModelName(options.modelTier);
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: options.schema
      }
    });
    const MAX_ATTEMPTS = 4;
    const BASE_DELAY_MS = 1e3;
    const MAX_DELAY_MS = 32e3;
    let lastFailureReason = "api_error";
    let attempt = 0;
    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      console.log(`[GeminiService] Attempt ${attempt}/${MAX_ATTEMPTS} for agent "${options.agentKey}"`);
      try {
        const result = await model.generateContent(options.prompt);
        const responseText = result.response.text();
        let parsed;
        try {
          parsed = JSON.parse(responseText);
        } catch {
          console.warn(`[GeminiService] Attempt ${attempt}: response is not valid JSON`);
          lastFailureReason = "invalid_json";
          if (attempt < MAX_ATTEMPTS) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
            await this.sleep(delay);
            continue;
          }
          break;
        }
        const isValid = this.validateSchema(parsed, options.schema);
        if (!isValid) {
          console.warn(`[GeminiService] Attempt ${attempt}: response failed schema validation`);
          lastFailureReason = "invalid_json";
          if (attempt < MAX_ATTEMPTS) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
            await this.sleep(delay);
            continue;
          }
          break;
        }
        return { ...parsed, ai_source: "ai" };
      } catch (error) {
        const httpStatus = this.extractHttpStatus(error);
        console.warn(`[GeminiService] Attempt ${attempt}: HTTP status ${httpStatus ?? "unknown"} for agent "${options.agentKey}"`);
        if (httpStatus === 429) {
          lastFailureReason = "rate_limited";
          if (attempt < MAX_ATTEMPTS) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
            await this.sleep(delay);
            continue;
          }
          break;
        } else if (httpStatus !== null && httpStatus >= 500) {
          lastFailureReason = "api_error";
          if (attempt < MAX_ATTEMPTS) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
            await this.sleep(delay);
            continue;
          }
          break;
        } else if (httpStatus !== null && httpStatus >= 400 && httpStatus !== 429) {
          lastFailureReason = "api_error";
          break;
        } else {
          lastFailureReason = "api_error";
          if (attempt < MAX_ATTEMPTS) {
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS);
            await this.sleep(delay);
            continue;
          }
          break;
        }
      }
    }
    this.logFallback(options.agentKey, lastFailureReason, attempt);
    return { ai_source: "rule_based_fallback" };
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  extractHttpStatus(error) {
    if (error && typeof error === "object") {
      const e = error;
      if (typeof e["status"] === "number") return e["status"];
      if (typeof e["httpStatus"] === "number") return e["httpStatus"];
      if (typeof e["statusCode"] === "number") return e["statusCode"];
      if (typeof e["message"] === "string") {
        const match = e["message"].match(/\[(\d{3})\s/);
        if (match) return parseInt(match[1], 10);
      }
    }
    return null;
  }
  validateSchema(parsed, schema) {
    try {
      if (schema.type !== "object") return true;
      const required = schema.required;
      if (required && Array.isArray(required)) {
        for (const field of required) {
          if (!(field in parsed)) {
            return false;
          }
        }
      }
      const properties = schema.properties;
      if (properties) {
        for (const [field, fieldSchema] of Object.entries(properties)) {
          if (field in parsed && fieldSchema.type) {
            const expectedType = fieldSchema.type;
            const actualValue = parsed[field];
            if (expectedType === "string" && typeof actualValue !== "string") return false;
            if (expectedType === "number" && typeof actualValue !== "number") return false;
            if (expectedType === "boolean" && typeof actualValue !== "boolean") return false;
            if (expectedType === "array" && !Array.isArray(actualValue)) return false;
            if (expectedType === "object" && (typeof actualValue !== "object" || Array.isArray(actualValue) || actualValue === null)) return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  getModelName(tier) {
    return tier === "FLASH" ? this.flashModelName : this.proModelName;
  }
  logFallback(agentKey, reason, attempts) {
    const entry = {
      level: "WARN",
      event: "gemini_fallback",
      agent_key: agentKey,
      failure_reason: reason,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      attempts
    };
    console.warn(JSON.stringify(entry));
  }
  isNoKeyMode() {
    return this.noKeyMode;
  }
  getApiKey() {
    return this.apiKey;
  }
  /**
   * Phase 4 RAG: Generate Gemini Embedding for a text string
   */
  async generateEmbedding(text) {
    if (!text || text.trim() === "") {
      return new Array(64).fill(0);
    }
    if (!this.noKeyMode) {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        if (result && result.embedding && Array.isArray(result.embedding.values)) {
          return result.embedding.values;
        }
      } catch (err) {
        console.warn("[GeminiService] Live embedding call failed, falling back to pseudo-embedding vector:", err?.message);
      }
    }
    return this.generatePseudoEmbedding(text);
  }
  /**
   * Deterministic pseudo-embedding vector generator based on word frequency & hash distribution
   */
  generatePseudoEmbedding(text, dimensions = 64) {
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % dimensions;
      vector[index] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map((val) => val / magnitude) : vector;
  }
  /**
   * Cosine Similarity calculation between two vectors
   */
  computeCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dot / denom : 0;
  }
}
const geminiService = new GeminiService();
export {
  GeminiService,
  geminiService
};
