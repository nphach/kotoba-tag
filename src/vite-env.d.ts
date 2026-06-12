/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_BLOCK_ON_MODEL_WARMUP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
