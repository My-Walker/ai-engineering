import { mkdirSync } from "node:fs";
import type { AppConfig } from "../types.js";

export type EmbedStatus = "ready" | "loading" | "fallback" | "disabled";

type Extractor = (
  text: string,
  opts: { pooling: string; normalize: boolean },
) => Promise<{ data: Float32Array }>;

let extractor: Extractor | null = null;
let status: EmbedStatus = "disabled";
let loadPromise: Promise<void> | null = null;

export function getEmbedStatus(): EmbedStatus {
  return status;
}

export async function ensureEmbedder(
  config: AppConfig,
  cacheDir: string,
): Promise<EmbedStatus> {
  if (!config.semantic.enabled) {
    status = "disabled";
    return status;
  }
  if (extractor) {
    status = "ready";
    return status;
  }
  if (loadPromise) {
    status = "loading";
    await loadPromise;
    return status;
  }
  status = "loading";
  loadPromise = (async () => {
    try {
      mkdirSync(cacheDir, { recursive: true });
      const mod = await import("@huggingface/transformers");
      const env = mod.env as { cacheDir?: string; allowLocalModels?: boolean };
      env.cacheDir = cacheDir;
      const pipeline = mod.pipeline;
      extractor = (await pipeline(
        "feature-extraction",
        config.semantic.model,
        { dtype: "q8" } as Record<string, unknown>,
      )) as unknown as Extractor;
      status = "ready";
    } catch (err) {
      console.warn("[agent-memory] embedding load failed, fallback FTS:", err);
      extractor = null;
      status = "fallback";
    } finally {
      loadPromise = null;
    }
  })();
  await loadPromise;
  return status;
}

export async function embedPassage(
  text: string,
  config: AppConfig,
  cacheDir: string,
): Promise<Float32Array | null> {
  const st = await ensureEmbedder(config, cacheDir);
  if (st !== "ready" || !extractor) return null;
  const input = text.startsWith("passage:") ? text : `passage: ${text}`;
  const out = await extractor(input, { pooling: "mean", normalize: true });
  return new Float32Array(out.data);
}

export async function embedQuery(
  text: string,
  config: AppConfig,
  cacheDir: string,
): Promise<Float32Array | null> {
  const st = await ensureEmbedder(config, cacheDir);
  if (st !== "ready" || !extractor) return null;
  const input = text.startsWith("query:") ? text : `query: ${text}`;
  const out = await extractor(input, { pooling: "mean", normalize: true });
  return new Float32Array(out.data);
}

export function cosine(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function prefetchModel(
  config: AppConfig,
  cacheDir: string,
): Promise<{ ok: boolean; status: EmbedStatus; message: string }> {
  const st = await ensureEmbedder(config, cacheDir);
  if (st === "ready") {
    return { ok: true, status: st, message: `模型已就绪: ${config.semantic.model}` };
  }
  return {
    ok: false,
    status: st,
    message: `模型未就绪: ${st}`,
  };
}
