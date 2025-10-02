/**
 * server/index.js
 *
 * Express proxy for OpenRouter chat completions.
 * - Uses OPENROUTER_API_KEY from environment
 * - Configurable model via OPENROUTER_MODEL
 * - Simple rate limiting + security headers
 * - Small in-memory cache for identical (context + message) requests
 *
 * Usage: node server/index.js
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import crypto from "crypto";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openchat/openchat-7b:free"; // default
const PORT = process.env.PORT || 3000; // Changed from 5000 to 3000

if (!OPENROUTER_API_KEY) {
  console.error("ERROR: OPENROUTER_API_KEY is not set in environment.");
  process.exit(1);
}

const app = express();

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiter: 60 requests per minute per IP (adjust as needed).
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Simple in-memory cache (hash -> reply). Limited size to avoid OOM.
const CACHE_MAX = 200;
const cache = new Map(); // insertion order maintained

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  // move to end (LRU-ish)
  cache.delete(key);
  cache.set(key, entry);
  return entry;
}

function cacheSet(key, value) {
  cache.set(key, value);
  if (cache.size > CACHE_MAX) {
    // remove oldest
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

// Helper to hash context + message
function makeHash(context = "", message = "") {
  return crypto.createHash("sha256").update(context + "||" + message).digest("hex");
}

// POST /api/ai
// body: { message: string, context?: string, temperature?: number, max_tokens?: number }
app.post("/api/ai", async (req, res) => {
  try {
    const { message, context = "", temperature = 0.2, max_tokens = 800 } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Field `message` (string) is required." });
    }

    // Check cache first
    const key = makeHash(context, message);
    const cached = cacheGet(key);
    if (cached) {
      return res.json({ reply: cached, cached: true });
    }

    // Build messages for the model
    const systemPrompt = `You are an assistant that answers user questions using the provided document context. Use the context to provide accurate and relevant answers. If the answer is not in the context, say so politely and offer a helpful next step. Keep answers concise and useful.`;

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion:\n${message}`,
      },
    ];

    // Call OpenRouter
    const apiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        // OpenRouter may accept additional headers; not required
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature,
        max_tokens,
        // you can pass additional OpenRouter options here if desired
      }),
    });

    const apiData = await apiResp.json();

    if (!apiResp.ok) {
      // Try to surface a helpful error
      const errMsg =
        apiData?.error?.message ||
        apiData?.message ||
        `OpenRouter error (status ${apiResp.status})`;
      console.error("OpenRouter error:", errMsg, apiData);
      return res.status(502).json({ error: errMsg, details: apiData });
    }

    // Extract reply from response (safe navigation)
    let reply =
      apiData?.choices?.[0]?.message?.content ??
      apiData?.choices?.[0]?.delta?.content ??
      null;

    // Fallback: if reply is still null, try other shapes (some providers differ)
    if (!reply) {
      // Try to stringify a helpful subset
      reply = JSON.stringify(apiData).slice(0, 2000); // truncated fallback
    }

    // Save to cache
    cacheSet(key, reply);

    return res.json({ reply, cached: false });
  } catch (err) {
    console.error("Server error in /api/ai:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
});

app.get("/", (req, res) => {
  res.json({ ok: true, provider: "openrouter_proxy" });
});

app.listen(PORT, () => {
  console.log(`OpenRouter proxy server listening on http://localhost:${PORT}`);
});
