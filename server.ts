import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import * as geminiServiceServer from "./services/geminiServiceServer";

const app = express();

// Export the app instance for Serverless environments (like Vercel)
export default app;

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Attach API routes synchronously so serverless functions can use them immediately
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Needed for receiving large documents like base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.post("/api/upload-chunk", (req, res) => {
  try {
    const { sessionId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!sessionId || typeof chunkIndex !== 'number' || typeof totalChunks !== 'number' || !chunkData) {
      return res.status(400).json({ error: "Missing required chunk parameters" });
    }
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    
    const tempPath = path.join(os.tmpdir(), `upload-${sessionId}`);
    
    if (chunkIndex === 0 && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    fs.appendFileSync(tempPath, chunkBuffer);
    
    if (chunkIndex === totalChunks - 1) {
      res.json({ success: true, tempPath, message: "Upload complete" });
    } else {
      res.json({ success: true, message: "Chunk received" });
    }
  } catch (error: any) {
    console.error("Chunk error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Shared generic endpoint for Gemini calls
app.post("/api/gemini", async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // keep connection alive by sending whitespace
  const keepAlive = setInterval(() => {
    res.write(" ");
  }, 10000);

  try {
    const { action, payload } = req.body;
    let result;
    
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
        clearInterval(keepAlive);
        return res.status(400).json({ error: "Unknown action" });
    }
    
    clearInterval(keepAlive);
    res.write(JSON.stringify({ result }));
    res.end();
  } catch (error: any) {
    clearInterval(keepAlive);
    console.error(`Error in /api/gemini:`, error);
    res.write(JSON.stringify({ error: error.message || "Internal server error", stack: error.stack }));
    res.end();
  }
});

// Global error handler for API routes
app.use('/api', (err: any, req: any, res: any, next: any) => {
  console.error('API Error:', err);
  res.status(err.status || 400).json({ error: err.message || "Internal server error" });
});

async function startServer() {
  // Vite middleware for development

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(/* @vite-ignore */ viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // In production, server.cjs is located inside the dist/ folder. 
    // We can use process.cwd() just in case.
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA Fallback
    app.use((req, res, next) => {
      if (req.method === 'GET' && req.accepts('html')) {
        res.sendFile(path.join(distPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  // Only listen if not running in Vercel Serverless Function and if explicitly started
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Check if this module was run directly
const isCjsMain = typeof require !== 'undefined' && require.main === module;
const isEsmMain = typeof process !== 'undefined' && process.argv && process.argv[1] && typeof import.meta !== 'undefined' && import.meta.url === `file://${process.argv[1]}`;

if (
  isCjsMain || 
  isEsmMain ||
  (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('server.cjs'))
) {
  startServer();
} else if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    startServer();
}
