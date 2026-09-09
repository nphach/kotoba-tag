import {
  ApiError,
  ModelLoadingError,
  readApiErrorDetail,
} from "./errors.ts";

const PRODUCTION_API_BASE = "https://kotoba-tag-server.onrender.com";

// In dev, use same-origin requests proxied by Vite to :8000 (avoids CORS issues
// when Vite picks a non-default port like 5175).
export const API_BASE =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : PRODUCTION_API_BASE);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const WARMUP_TIMEOUT_MESSAGE =
  "the definition model took too long to start — please try again in a moment";
const NETWORK_MESSAGE =
  "couldn't reach the server — check your connection and try again";
const DEFINITION_CHECK_FAILED =
  "couldn't check your definition — please try again";

function normalizeNetworkError(error: unknown): Error {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return new Error(NETWORK_MESSAGE);
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error(NETWORK_MESSAGE);
}

let modelReadyPromise: Promise<void> | null = null;
let modelIsReady = false;

export { ModelLoadingError } from "./errors.ts";

export function markModelCold(): void {
  modelIsReady = false;
  modelReadyPromise = null;
}

/** Fire-and-forget warm-up while the player is on the title screen. */
export function prefetchModel(): void {
  if (modelIsReady) return;
  void ensureModelReady().catch(() => {
    markModelCold();
  });
}

/** Block until the HuggingFace endpoint responds. Dedupes concurrent calls. */
export async function ensureModelReady(): Promise<void> {
  if (modelIsReady) return;

  if (!modelReadyPromise) {
    modelReadyPromise = warmupWithRetry();
  }

  try {
    await modelReadyPromise;
    modelIsReady = true;
  } catch (error) {
    markModelCold();
    throw error;
  }
}

async function warmupWithRetry(
  maxAttempts = 15,
  delayMs = 4000,
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/warmup`);

      if (response.ok) return;

      const message = await readApiErrorDetail(
        response,
        "couldn't prepare the definition model — please try again",
      );

      if (response.status === 503 && attempt < maxAttempts - 1) {
        lastError = new ApiError(message, response.status);
        await sleep(delayMs);
        continue;
      }

      throw new ApiError(message, response.status);
    } catch (error) {
      if (error instanceof ApiError) {
        lastError = error;
        if (error.status === 503 && attempt < maxAttempts - 1) {
          await sleep(delayMs);
          continue;
        }
        throw error;
      }

      lastError = normalizeNetworkError(error);

      if (attempt < maxAttempts - 1) {
        await sleep(delayMs);
        continue;
      }
    }
  }

  if (lastError instanceof ApiError && lastError.status === 503) {
    throw new Error(WARMUP_TIMEOUT_MESSAGE);
  }

  throw normalizeNetworkError(lastError);
}

export async function postDefinition(
  userDef: string,
  validDefs: string[],
): Promise<number[]> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}/definition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_def: userDef,
        valid_defs: validDefs,
      }),
    });
  } catch {
    throw new Error(NETWORK_MESSAGE);
  }

  if (response.status === 503) {
    markModelCold();
    const message = await readApiErrorDetail(
      response,
      "the definition model is still starting up — try again in a moment",
    );
    throw new ModelLoadingError(message);
  }

  if (!response.ok) {
    const message = await readApiErrorDetail(response, DEFINITION_CHECK_FAILED);
    throw new Error(message);
  }

  const body = await response.json().catch(() => ({}));
  return body.predictions;
}
