import { 
    AccidentReport, 
    CauseTreeAnalysis, 
    ArtClassification, 
    Attachment, 
    RiskItem, 
    RiskEvaluation, 
    SafeWorkProcedure, 
    Finding, 
    Qualification, 
    DialogueFormState, 
    ObservationFormState, 
    ForkliftChecklist 
} from '../types';

interface AppData {
    findings: Finding[];
    accidents: AccidentReport[];
    qualifications: Qualification[];
    dialogues: DialogueFormState[];
    observations: ObservationFormState[];
    forkliftChecklists: ForkliftChecklist[];
}

const callApi = async (action: string, payload: any) => {
    // Verificación de conectividad del dispositivo
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error("El dispositivo no tiene conexión a internet. Verifique su red e intente nuevamente.");
    }

    try {
        const payloadCopy = JSON.parse(JSON.stringify(payload));
        
        let filesToChunk: any[] = [];
        if (payloadCopy && payloadCopy.media && Array.isArray(payloadCopy.media) && payloadCopy.media.length > 0) {
            filesToChunk = [...payloadCopy.media];
        }
        
        if (payloadCopy && payloadCopy.base64Source) {
            filesToChunk.push(payloadCopy);
        }
        if (payloadCopy && payloadCopy.base64Image) {
            filesToChunk.push(payloadCopy);
        }

        for (let i = 0; i < filesToChunk.length; i++) {
            const mediaItem = filesToChunk[i];
            const dataToChunk = mediaItem.data || mediaItem.base64Source || mediaItem.base64Image;
            
            if (dataToChunk && dataToChunk.length > 100000) {
                const base64Data = dataToChunk;
                const CHUNK_SIZE = 100000;
                const sessionId = Date.now().toString() + "-" + i + "-" + Math.random().toString(36).substring(7);
                const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);

                for (let c = 0; c < totalChunks; c++) {
                    const chunkData = base64Data.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
                    const uploadRes = await fetch("/api/upload-chunk", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId, chunkIndex: c, totalChunks, chunkData })
                    });
                    
                    if (!uploadRes.ok) {
                        throw new Error("Fallo al subir el archivo al servidor. Intente nuevamente.");
                    }
                    
                    if (c === totalChunks - 1) {
                        const result = await uploadRes.json();
                        mediaItem.tempFilePath = result.tempPath;
                        if (mediaItem.data) mediaItem.data = "";
                        if (mediaItem.base64Source) mediaItem.base64Source = "";
                        if (mediaItem.base64Image) mediaItem.base64Image = "";
                    }
                }
            }
        }

        const response = await fetch("/api/gemini", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ action, payload: payloadCopy })
        });
        
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        if (!contentType.includes("application/json")) {
            throw new Error("El servidor devolvió una respuesta no válida. Verifique que la aplicación Node.js esté activa.");
        }

        let data: any;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("No se pudo procesar la respuesta del servidor.");
        }

        if (!response.ok || data.error) {
            throw new Error(data.error || "No se pudo completar la operación en el servidor.");
        }

        return data.result;
    } catch (error: any) {
        console.error(`[GeminiService] Error en acción ${action}:`, error.message);
        throw new Error(error.message || "Error de comunicación con el servidor. Intente nuevamente.");
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
