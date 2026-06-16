import { AccidentReport, CauseTreeAnalysis, ArtClassification, Attachment, RiskItem, RiskEvaluation, SafeWorkProcedure, Finding, Qualification, DialogueFormState, ObservationFormState, ForkliftChecklist } from '../types';

interface AppData {
    findings: Finding[];
    accidents: AccidentReport[];
    qualifications: Qualification[];
    dialogues: DialogueFormState[];
    observations: ObservationFormState[];
    forkliftChecklists: ForkliftChecklist[];
}

const callApi = async (action: string, payload: any) => {
    try {
        if (payload && payload.media && payload.media.length > 0) {
            for (let i = 0; i < payload.media.length; i++) {
                const mediaItem = payload.media[i];
                if (mediaItem.data && mediaItem.data.length > 700000) {
                    const base64Data = mediaItem.data;
                    const CHUNK_SIZE = 700000;
                    const sessionId = Date.now().toString() + "-" + i;
                    const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

                    for (let c = 0; c < totalChunks; c++) {
                        const chunkData = base64Data.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
                        const uploadRes = await fetch("/api/upload-chunk", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, chunkIndex: c, totalChunks, chunkData })
                        });
                        
                        if (!uploadRes.ok) {
                            const errText = await uploadRes.text();
                            console.error("Chunk upload failed:", errText);
                            throw new Error("Fallo al subir archivo. El servidor rechazó la conexión parcial: " + uploadRes.status);
                        }
                        
                        if (c === totalChunks - 1) {
                            const result = await uploadRes.json();
                            mediaItem.tempFilePath = result.tempPath;
                            mediaItem.data = ""; // Clear data so we don't send it via Vercel payload limit
                        }
                    }
                }
            }
        }

        const response = await fetch("/api/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, payload })
        });
        
        let data;
        const text = await response.text();
        const contentType = response.headers.get("content-type");
        
        if (!contentType || !contentType.includes("application/json")) {
            console.error("No JSON response:", text.substring(0, 200));
            throw new Error(`El servidor devolvió una respuesta en HTML en lugar de JSON (Código ${response.status}). El archivo de video/imagen es demasiado grande y fue bloqueado por el cortafuegos (WAF/Proxy) del servidor antes de poder analizarlo. Por favor, recorte o reduzca la calidad del video e intente nuevamente.`);
        }

        try {
            data = JSON.parse(text);
        } catch(e) {
            console.error("JSON Error:", e);
            throw new Error("Error interno al decodificar la respuesta del servidor.");
        }

        if (!response.ok) {
            throw new Error(data.error || "La API falló.");
        }
        return data.result;
    } catch (error) {
        console.error("Network or parsing error calling /api/gemini:", error);
        throw error;
    }
};

export const suggestCorrection = async (deviationText: string): Promise<string> => {
    return callApi("suggestCorrection", { deviationText });
};

export const generateRiskAssessment = async (media: Attachment[], userPrompt?: string): Promise<{
    riskItems: RiskItem[];
    artClassification?: ArtClassification;
}> => {
    return callApi("generateRiskAssessment", { media, userPrompt });
};

export const generateSafeWorkProcedure = async (evaluation: RiskEvaluation | undefined, nextCode: string): Promise<SafeWorkProcedure> => {
    return callApi("generateSafeWorkProcedure", { evaluation, nextCode });
};

export const generateCauseTreeAnalysis = async (accident: AccidentReport): Promise<CauseTreeAnalysis> => {
    return callApi("generateCauseTreeAnalysis", { accident });
};

export const getEPPAdvice = async (ppeItems: { item: string, status: 'good' | 'bad' | 'missing', note: string }[]): Promise<string> => {
    return callApi("getEPPAdvice", { ppeItems });
};

export const analyzeAccidentData = async (question: string, accidents: AccidentReport[]): Promise<string> => {
    return callApi("analyzeAccidentData", { question, accidents });
};

export const chatWithSegurino = async (question: string, appData: AppData): Promise<string> => {
    return callApi("chatWithSegurino", { question, appData });
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    return callApi("generateImage", { prompt, aspectRatio });
};

export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    return callApi("editImage", { base64Image, mimeType, prompt });
};

export const generateRiskMap = async (base64Source: string, mimeType: string, sector: string, prompt: string): Promise<string> => {
    return callApi("generateRiskMap", { base64Source, mimeType, sector, prompt });
};

export const analyzeEvacuationRoutes = async (base64Source: string, mimeType: string, startPoint: string, endPoint: string): Promise<string> => {
    return callApi("analyzeEvacuationRoutes", { base64Source, mimeType, startPoint, endPoint });
};
