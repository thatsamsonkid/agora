/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATABASE_REF: string;
  readonly VITE_DATABASE_PUB_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
