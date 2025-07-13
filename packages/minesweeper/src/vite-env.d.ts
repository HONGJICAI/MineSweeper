/// <reference types="vite/client" />

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

interface ImportMetaEnv {
  readonly VITE_PLATFORM: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
