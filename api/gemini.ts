import * as geminiServiceServer from '../services/geminiServiceServer';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { action, payload } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: "Missing action in request body" });
    }
    
    switch(action) {
      case "suggestCorrection":
        return res.json({ result: await geminiServiceServer.suggestCorrection(payload.deviationText) });
      case "generateRiskAssessment":
        return res.json({ result: await geminiServiceServer.generateRiskAssessment(payload.media, payload.userPrompt) });
      case "generateSafeWorkProcedure":
        return res.json({ result: await geminiServiceServer.generateSafeWorkProcedure(payload.evaluation, payload.nextCode) });
      case "generateCauseTreeAnalysis":
        return res.json({ result: await geminiServiceServer.generateCauseTreeAnalysis(payload.accident) });
      case "getEPPAdvice":
        return res.json({ result: await geminiServiceServer.getEPPAdvice(payload.ppeItems) });
      case "analyzeAccidentData":
        return res.json({ result: await geminiServiceServer.analyzeAccidentData(payload.question, payload.accidents) });
      case "chatWithSegurino":
        return res.json({ result: await geminiServiceServer.chatWithSegurino(payload.question, payload.appData) });
      case "generateImage":
        return res.json({ result: await geminiServiceServer.generateImage(payload.prompt, payload.aspectRatio) });
      case "editImage":
        return res.json({ result: await geminiServiceServer.editImage(payload.base64Image, payload.mimeType, payload.prompt) });
      case "generateRiskMap":
        return res.json({ result: await geminiServiceServer.generateRiskMap(payload.base64Source, payload.mimeType, payload.sector, payload.prompt) });
      case "analyzeEvacuationRoutes":
        return res.json({ result: await geminiServiceServer.analyzeEvacuationRoutes(payload.base64Source, payload.mimeType, payload.startPoint, payload.endPoint) });
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error: any) {
    console.error(`Error in /api/gemini:`, error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
