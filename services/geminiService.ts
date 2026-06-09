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
        const response = await fetch("/backend/gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, payload })
        });
        
        let data;
        const text = await response.text();
        const contentType = response.headers.get("content-type");
        
        if (!contentType || !contentType.includes("application/json")) {
            console.error("No JSON response:", text.substring(0, 200));
            throw new Error(`El servidor Express devolvió una respuesta HTML (Código ${response.status}). Esto suele ocurrir si la app se alojó en un hosting estático sin Node.js, o si un Firewall/WAF (ej: Hostinger) bloqueó la imagen por su tamaño.`);
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
        console.error("Network or parsing error calling /backend/gemini:", error);
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
