import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import * as geminiServiceServer from "./services/geminiServiceServer";

const app = express();

// Export the app instance for Serverless / Passenger environments
export default app;

// ============================================================================
// CONFIGURACIÓN DE API EXTERNA
// URL del endpoint externo que el servidor consulta de manera segura.
// Puede modificarse mediante la variable de entorno EXTERNAL_API_URL o editando esta constante.
// ============================================================================
export const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || "https://generativelanguage.googleapis.com/v1beta/models";

// Encabezados de seguridad básicos
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Registro técnico seguro (nunca registra API_KEY ni Authorization)
app.use((req, _res, next) => {
  const safeUrl = req.originalUrl || req.url;
  console.log(`[REQUEST] ${req.method} ${safeUrl.split('?')[0]}`);
  next();
});

// Límite de tamaño de solicitudes para soportar imágenes y documentos
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/**
 * GET /api/estado
 * Verifica el estado del servidor y la presencia de la clave privada en el backend.
 * El campo apiKeyConfigurada solo indica true o false; nunca expone la clave ni fragmentos.
 */
app.get("/api/estado", (_req, res) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.json({
    ok: true,
    apiKeyConfigurada: isConfigured,
    servidor: "operativo"
  });
});

/**
 * GET /api/datos
 * Consulta la API externa desde el backend utilizando process.env.API_KEY.
 * Aplica timeout de 15s con AbortController, validación de JSON y respuestas de error seguras.
 */
app.get("/api/datos", async (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // 1. Leer la clave privada desde process.env.API_KEY (con compatibilidad con process.env.GEMINI_API_KEY)
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  // 2. Si la variable no existe, devolver HTTP 500 sin revelar nombres sensibles
  if (!apiKey || apiKey.trim().length === 0) {
    return res.status(500).json({
      ok: false,
      error: "La API del servidor no está configurada"
    });
  }

  // AbortController para tiempo máximo de espera (15 segundos)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    // 3. Encabezados de autorización según la API externa requerida
    const authType = (process.env.EXTERNAL_API_AUTH_TYPE || "bearer").toLowerCase();
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };

    if (authType === "x-api-key") {
      headers["x-api-key"] = apiKey;
    } else if (authType === "x-goog-api-key") {
      headers["x-goog-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // 4. Llamada a la API externa sin incluir la clave en URL ni parámetros
    const response = await fetch(EXTERNAL_API_URL, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // 6. Si la API externa devuelve 401 o 403, responder con HTTP 502
    if (response.status === 401 || response.status === 403) {
      return res.status(502).json({
        ok: false,
        error: "La API externa rechazó la autenticación"
      });
    }

    // 7. Si devuelve 404, 429, 500 u otro error
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: "La API externa no está disponible en este momento"
      });
    }

    // Validar formato JSON
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return res.status(502).json({
        ok: false,
        error: "La API externa devolvió una respuesta con formato inválido"
      });
    }

    // 9. Parsear JSON de forma segura
    let responseData: any;
    try {
      responseData = await response.json();
    } catch {
      return res.status(502).json({
        ok: false,
        error: "La respuesta de la API externa no es JSON válido"
      });
    }

    // 5 & 10. Devolver solo los datos necesarios al frontend sin secretos
    return res.json({
      ok: true,
      datos: responseData
    });
  } catch (error: any) {
    clearTimeout(timeoutId);

    // 8. Manejo de timeout
    if (error?.name === "AbortError" || controller.signal.aborted) {
      return res.status(504).json({
        ok: false,
        error: "La API externa tardó demasiado en responder"
      });
    }

    console.error("[Backend] Error al conectar con API externa:", error?.message);
    return res.status(502).json({
      ok: false,
      error: "No fue posible comunicarse con la API externa"
    });
  }
});

// Endpoint para subir archivos grandes por partes
app.post("/api/upload-chunk", (req, res) => {
  try {
    const { sessionId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!sessionId || typeof chunkIndex !== 'number' || typeof totalChunks !== 'number' || !chunkData) {
      return res.status(400).json({ error: "Parámetros de subida incompletos" });
    }
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    const tempPath = path.join(os.tmpdir(), `upload-${sessionId}`);
    
    if (chunkIndex === 0 && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    fs.appendFileSync(tempPath, chunkBuffer);
    
    if (chunkIndex === totalChunks - 1) {
      res.json({ success: true, tempPath, message: "Subida completada" });
    } else {
      res.json({ success: true, message: "Parte recibida" });
    }
  } catch (error: any) {
    console.error("[Backend] Error en subida de archivo:", error?.message);
    res.status(500).json({ error: "Error interno al procesar el archivo" });
  }
});

// Endpoint seguro para operaciones con Gemini
app.post("/api/gemini", async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return res.status(500).json({
      ok: false,
      error: "La API del servidor no está configurada"
    });
  }

  try {
    const { action, payload } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Acción no especificada" });
    }

    let result: any;
    
    switch(action) {
      case "suggestCorrection":
        result = await geminiServiceServer.suggestCorrection(payload.deviationText);
        break;
      case "generateRiskAssessment":
        result = await geminiServiceServer.generateRiskAssessment(payload.media, payload.userPrompt);
        break;
      case "generateSafeWorkProcedure":
        result = await geminiServiceServer.generateSafeWorkProcedure(payload.evaluation, payload.nextCode);
        break;
      case "generateCauseTreeAnalysis":
        result = await geminiServiceServer.generateCauseTreeAnalysis(payload.accident);
        break;
      case "getEPPAdvice":
        result = await geminiServiceServer.getEPPAdvice(payload.ppeItems);
        break;
      case "analyzeAccidentData":
        result = await geminiServiceServer.analyzeAccidentData(payload.question, payload.accidents);
        break;
      case "chatWithSegurino":
        result = await geminiServiceServer.chatWithSegurino(payload.question, payload.appData);
        break;
      case "generateImage":
        result = await geminiServiceServer.generateImage(payload.prompt, payload.aspectRatio);
        break;
      case "editImage":
        result = await geminiServiceServer.editImage(payload.base64Image, payload.mimeType, payload.prompt, payload.tempFilePath);
        break;
      case "generateRiskMap":
        result = await geminiServiceServer.generateRiskMap(payload.base64Source, payload.mimeType, payload.sector, payload.prompt, payload.tempFilePath);
        break;
      case "analyzeEvacuationRoutes":
        result = await geminiServiceServer.analyzeEvacuationRoutes(payload.base64Source, payload.mimeType, payload.startPoint, payload.endPoint, payload.tempFilePath);
        break;
      default:
        return res.status(400).json({ error: "Acción desconocida" });
    }
    
    return res.json({ ok: true, result });
  } catch (error: any) {
    console.error("[Backend] Error en /api/gemini:", error?.message);
    const safeError = error?.message?.includes("API_KEY")
      ? "La API del servidor no está configurada"
      : (error?.message || "Error al procesar la solicitud en el servidor.");
    return res.status(500).json({ ok: false, error: safeError });
  }
});

// Manejador global de errores para rutas /api
app.use('/api', (err: any, _req: any, res: any, _next: any) => {
  console.error('[Backend] Error en ruta API:', err?.message);
  res.status(err.status || 500).json({ ok: false, error: "Error interno del servidor" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = (typeof __dirname !== 'undefined' && fs.existsSync(path.join(__dirname, 'index.html')))
      ? __dirname
      : path.join(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    
    // Fallback SPA para servir index.html
    app.use((req, res, next) => {
      if (req.method === 'GET' && req.accepts('html')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  if (!process.env.VERCEL) {
    const rawPort = process.env.PORT || 3000;
    if (typeof rawPort === 'string' && (isNaN(Number(rawPort)) || rawPort.startsWith('/') || rawPort.startsWith('\\\\'))) {
      app.listen(rawPort, () => {
        console.log(`Server running on Passenger socket ${rawPort}`);
      });
    } else {
      const portNum = Number(rawPort);
      app.listen(portNum, '0.0.0.0', () => {
        console.log(`Server running on http://0.0.0.0:${portNum}`);
      });
    }
  }
}

// Iniciar servidor automáticamente salvo en entornos serverless (Vercel)
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error("[Backend] Error fatal al iniciar servidor:", err);
  });
}
