export const API_BASE = import.meta.env.VITE_API_URL ?? 'https://kotoba-tag-server.onrender.com'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

let modelReadyPromise: Promise<void> | null = null
let modelIsReady = false

export function markModelCold(): void {
    modelIsReady = false
    modelReadyPromise = null
}

/** Fire-and-forget warm-up while the player is on the title screen. */
export function prefetchModel(): void {
    if (modelIsReady) return
    void ensureModelReady().catch(() => {
        markModelCold()
    })
}

/** Block until the HuggingFace endpoint responds. Dedupes concurrent calls. */
export async function ensureModelReady(): Promise<void> {
    if (modelIsReady) return

    if (!modelReadyPromise) {
        modelReadyPromise = warmupWithRetry()
    }

    try {
        await modelReadyPromise
        modelIsReady = true
    } catch (error) {
        markModelCold()
        throw error
    }
}

async function warmupWithRetry(maxAttempts = 15, delayMs = 4000): Promise<void> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`${API_BASE}/warmup`)

        if (response.ok) return

        if (response.status === 503 && attempt < maxAttempts - 1) {
            await sleep(delayMs)
            continue
        }

        const body = await response.json().catch(() => ({}))
        throw new Error(body.detail ?? 'could not prepare model')
    }
}

export async function postDefinition(userDef: string, validDefs: string[]): Promise<number[]> {
    const response = await fetch(`${API_BASE}/definition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_def: userDef,
            valid_defs: validDefs,
        }),
    })

    const body = await response.json()

    if (response.status === 503) {
        markModelCold()
        throw new ModelLoadingError(body.detail ?? 'model loading')
    }

    if (!response.ok) {
        throw new Error(body.detail ?? 'definition check failed')
    }

    return body.predictions
}

export class ModelLoadingError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ModelLoadingError'
    }
}
