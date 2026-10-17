import { createRequire } from "node:module";

// Detección de entorno: si se ejecuta con tsx (servidor de desarrollo en AI Studio) o con node (producción Cloud Run / Hostinger)
const isTsx = Boolean(
  (process.env.npm_lifecycle_event === "dev") ||
  (process.argv.some(arg => arg.includes("tsx"))) ||
  (process.execArgv.some(arg => arg.includes("tsx")))
);

let app: any;

if (!isTsx) {
  // En producción (Cloud Run o Hostinger ejecutando `node server.ts`), cargar inmediatamente el paquete server.cjs
  const require = createRequire(import.meta.url);
  app = require("./server.cjs");
} else {
  // En desarrollo (AI Studio `tsx server.ts`), inicializar el servidor Vite en modo middleware
  const devServerModule = await import("./server.dev.ts");
  app = devServerModule.default;
  await devServerModule.startDevServer();
}

export default app;
