import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AccidentReport, CauseTreeAnalysis, ArtClassification, Attachment, RiskItem, RiskEvaluation, SafeWorkProcedure, Finding, Qualification, DialogueFormState, ObservationFormState, ForkliftChecklist } from '../types';
import fs from "fs";
import os from "os";
import path from "path";

let aiInstance: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI => {
    if (!aiInstance) {
        const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!API_KEY) {
            throw new Error("API_KEY environment variable not set. Gemini services will be disabled.");
        }
        aiInstance = new GoogleGenAI({ 
            apiKey: API_KEY,
            httpOptions: {
                headers: { 'User-Agent': 'aistudio-build' }
            }
        });
    }
    return aiInstance;
};

const getDisabledApiError = () => "Error: La clave de API no está configurada. Las funciones de IA están deshabilitadas.";

const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries: number = 6, initialDelayMs: number = 2000): Promise<T> => {
    let retries = 0;
    while (true) {
        try {
            return await operation();
        } catch (error: any) {
            const errMsg = String(error?.message || error);
            const isRetryable = error?.status === 503 || error?.status === 429 || errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("Too Many Requests");
            
            if (isRetryable && retries < maxRetries) {
                retries++;
                const delay = initialDelayMs * Math.pow(2, retries - 1); // Exponential backoff: 2s, 4s, 8s
                console.warn(`Gemini API high demand or rate limit. Retrying ${retries}/${maxRetries} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

const handleGeminiError = (error: any, defaultMessage: string, contextMessage?: string) => {
    console.error(contextMessage || "Error calling Gemini API:", error);
    const errMsg = String(error?.message || error);
    if (error?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
        throw new Error("El modelo de IA está experimentando alta demanda. Por favor, espere unos instantes y vuelva a intentarlo.");
    }
    if (error instanceof SyntaxError) {
        throw new Error("La IA devolvió una respuesta en un formato inválido. Intente de nuevo.");
    }
    throw new Error(defaultMessage);
};

export const suggestCorrection = async (deviationText: string): Promise<string> => {
    return executeWithRetry(async () => {
        try {
            const response = await getAI().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Basado en la siguiente desviación observada en un entorno industrial, sugiere una medida correctiva breve y práctica:\n"${deviationText}"\nLa respuesta debe ser solo la medida correctiva (máximo 2 oraciones).`,
            });
            return response.text || "No se pudo generar una sugerencia.";
        } catch (error) {
            handleGeminiError(error, "Error al generar sugerencia de corrección.");
            return "";
        }
    });
};

export const generateRiskAssessment = async (mediaArray: any[], userPrompt: string = ""): Promise<{ riskItems: RiskItem[]; artClassification?: ArtClassification }> => {
    const systemInstruction = `
    Eres 'Segurito', un experto en Higiene y Seguridad Ocupacional con 25 años de experiencia en plantas industriales, especializado en la creación de matrices IPERC (Identificación de Peligros, Evaluación de Riesgos y Controles).
    Tu tarea es analizar el archivo (imagen o video) y la tarea descrita por el usuario para identificar todos los peligros posibles y completar una matriz de riesgos siguiendo una metodología extremadamente estricta.
    
    Tu respuesta DEBE ser EXCLUSIVAMENTE un array de objetos JSON válido. No incluyas texto introductorio, explicaciones, ni \`\`\`json ... \`\`\` markdown. Solo el array JSON.

    **METODOLOGÍA DE VALORIZACIÓN IPERC OBLIGATORIA:**

    Usa las siguientes tablas para la valoración:
    **1. FRECUENCIA (F):**
    - **Nula=0:** Exposición al peligro es inexistente.
    - **Ocasional=1:** Frecuencia esporádica o eventual.
    - **Frecuente=2:** Frecuencia sistemática pero no continua.
    - **Continua=3:** Exposición continua durante la jornada.
    
    **2. CONTROL (Ctr):**
    - **Eficaz=0:** Eliminar / Sustituir. Se elimina completamente el peligro.
    - **Significativo=1:** Control de Ingeniería. Dispositivo que asegura que no ocurra el daño.
    - **Precario=2:** Señalización / Control Adm. / EPP. La efectividad depende de la actitud del ejecutante.
    - **Inexistente=3:** Sin Control. No existe ningún dispositivo.
    
    **3. CONSECUENCIA (C):**
    - **Baja=1:** Daños superficiales, sin tratamiento especial.
    - **Media=2:** Daños con incapacidades temporales, requieren tratamiento.
    - **Alta=4:** Daños irreversibles (amputaciones, quemaduras graves, etc.).
    - **Muy Alta=8:** Fatalidad.

    Para CADA riesgo que identifiques, completa un objeto JSON con los siguientes campos, siguiendo estas reglas ESTRICTAS:

    **1. DESCRIPCIÓN:**
    - \`item\`: Numera secuencialmente cada riesgo, empezando en 1.
    - \`sector\`, \`area\`, \`puesto\`: Infiere del contexto o de la imagen. Si no es posible, usa "No especificado".
    - \`tarea\`: Describe la acción específica con un verbo en infinitivo (ej: "Despostar cortes de carne").
    - \`rutinaria\`: Completa con 'R' si la tarea es rutinaria, o 'N' si no lo es.
    - \`peligros\`: Usa EXCLUSIVAMENTE la lista de peligros provista, incluyendo el código numérico.
    - \`riesgo\`: Usa EXCLUSIVAMENTE la lista de riesgos provista, incluyendo el código numérico.

    **2. ANÁLISIS DE RIESGO INICIAL (SIN CONTROLES):**
    - Asume que NO EXISTE NINGÚN CONTROL para esta evaluación.
    - \`frecuenciaExposicion\`: Asigna el texto ("Nula", "Ocasional", "Frecuente", "Continua") de la tabla FRECUENCIA.
    - \`valorFrecuencia\`: Asigna el valor numérico (0, 1, 2, 3) correspondiente.
    - \`control\`: El valor DEBE ser "Inexistente".
    - \`valorControl\`: El valor DEBE ser 3.
    - \`consecuencia\`: Asigna el texto ("Baja", "Media", "Alta", "Muy Alta") de la tabla CONSECUENCIA, considerando el peor escenario posible.
    - \`valorConsecuencia\`: Asigna el valor numérico (1, 2, 4, 8) correspondiente.
    - \`nivelRiesgoInicial\`: Calcula: (valorFrecuencia * valorControl) * valorConsecuencia.
    - \`clasificacionRiesgoInicial\`: Asigna 'ALTO' si nivelRiesgoInicial >= 16; 'MEDIO' si 8 <= nivelRiesgoInicial < 16; o 'BAJO' si nivelRiesgoInicial < 8.

    **3. MECANISMOS DE CONTROL EXISTENTES:**
    - \`detalleControles\`: Describe SOLAMENTE los controles de seguridad que OBSERVAS en la evidencia (imagen/video). Si no ves ninguno, escribe "Ninguno observado".
    - \`eliminacion\`, \`sustitucion\`, \`controlesIngenieria\`, \`sac\`, \`epp\`: Basado en \`detalleControles\`, rellena CADA UNO de estos campos con 'SI' o 'NO'. Si no hay controles observados, todos deben ser 'NO'.
    - Re-evalúa el \`valorControl\` usando la tabla de Control, basado en la efectividad de los controles que SÍ observaste. Este nuevo valor se usará para la evaluación final.

    **4. ANÁLISIS DE RIESGO FINAL:**
    - \`probOcurrenciaFinal\`: Calcula: valorFrecuencia * valorControl (el re-evaluado en el paso anterior).
    - \`consecuenciaFinal\`: Usa el MISMO valor numérico que \`valorConsecuencia\`.
    - \`nivelRiesgoFinal\`: Calcula: probOcurrenciaFinal * consecuenciaFinal.
    - \`clasificacionRiesgoFinal\`: Asigna 'ALTO', 'MEDIO', o 'BAJO' usando los mismos rangos que en la clasificación inicial.

    **5. MEJORAS:**
    - \`accionesRequeridas\`: Lista acciones claras y específicas para reducir el riesgo. Este campo NUNCA debe estar vacío. Si el riesgo ya es bajo, sugiere "Mantener controles y realizar seguimiento periódico".
    - \`procedimiento\`: Si las acciones lo ameritan, sugiere un nuevo procedimiento (ej: "Elaborar PTS para la tarea X"). Si no, déjalo en blanco.

    **IMPORTANTE FINAL**: La evaluación final debe reflejar la situación real observada. Las \`accionesRequeridas\` son propuestas a futuro y NO deben influir en el cálculo del \`nivelRiesgoFinal\`.
    
    **LISTA DE PELIGROS VÁLIDOS:**
    1. Objetos que caen / oscilan, 2. Objetos cortantes / punzantes, 3. Objetos que se proyectan, 4. Contacto eléctrico, 5. Incendio, 6. Ruido, 7. Carga térmica (calor), 8. Radiaciones no ionizantes, 9. Radiaciones ionizantes, 10. Estrés térmico (frío), 11. Iluminación deficiente, 12. Ventilación deficiente, 13. Vibraciones, 14. Ergonómico, 15. Protección de maquinaria inexistente o insuficiente, 16. Falla en el sistema de aislación, 17. Sistemas de bloqueo inexistentes o desconectados, 18. Equipos sin mantenciones o revisiones de funcionamiento, 19. Equipo con partes alteradas o defectuosas, 20. Producto químico sin identificar, 21. Envase dañado o con defectos, 22. Almacenamiento incorrecto, 23. Productos incompatibles o reactivos, 24. Espacio reducido, 25. Espacio confinado, 26. Falta de orden y limpieza, 27. Falta delimitación, 28. Superficies calientes, 29. Polvo, 30. Gases, 31. Vapores, 32. Rocíos, 33. Nieblas, 34. Humos metálicos, 35. Agentes biológicos, 36. Intervenir equipos energizados y/o en movimientos, 37. No advertir / señalizar, 38. No usar equipo de protección personal, 39. Uso inadecuado de herramientas, 40. Explosión, 41. Animales vivos, 42. Vehículos en movimiento, 43. Proyección de fluidos, 44. Escaleras sin barandas, 45. Transitar bajo carga suspendida, 46. Barandas de escalera en mal estado, 47. Acopio sub-estándar, 48. Correr o desplazarse rápido, 49. Sobrecargar enchufes o alargadores, 50. Condiciones climáticas adversas, 51. Instalaciones eléctricas inadecuadas o en mal estado, 52. Zona resbalosa por presencia de (materia,restos,agua,grasa,fluidos,huesos), 53. Fluidos calientes sometidos a presión, 54. Trabajo en Altura

    **LISTA DE RIESGOS VÁLIDOS:**
    1. Caída de objetos, 2. Caída de objetos desde altura, 3. Caída de persona a nivel / desnivel, 4. Colisión de vehículo com persona, 5. Contacto-inhalación-ingesta con producto químico, 6. Cortes, 7. Derrumbe, 8. Descargas eléctricas atmosféricas, 9. Caída de carga elevada (Animal/Media res/ cuarto/ canasto), 10. Rotura de elementos de izaje, 11. Atrapamiento com materiales en proceso o almacenados, 12. Caída de persona desde equipos en movimientos, 13. Vuelco de vehículos, 14. Colisión entre vehículos, 15. Contacto com objeto/superficie caliente, 16. Contacto con fuego, 17. Contacto con elemento cortante/cortopunzante/punzante, 18. Golpeado con/por/contra objeto/herramienta/estructura, 19. Atrapamiento, 20. Atropello por animal, 21. Atropello por vehículo, 22. Exposición a ruido, 23. Quemaduras, 24. Atrapamiento com maquinarias, 25. Exposición a proyección de chispas, 26. Exposición a proyección de objetos, 27. Salpicaduras, 28. Exposición a proyección de fluidos, 29. Resbalones / Tropiezos, 30. Aplastamiento por caída de carga, 31. Contacto eléctrico directo/indirecto, 32. Sobreesfuerzos, 33. Riesgo biológico, 34. Exposición a dosis RX elevada, 35. Radiaciones No Ionizantes, 36. Quemaduras por contacto con fluido caliente
    `;

    let parts: any[] = [];
    if (mediaArray && mediaArray.length > 0) {
        for (const media of mediaArray) {
            let tempFilePathToUpload = media.tempFilePath;
            let needsCleanup = false;
            
            if (!tempFilePathToUpload && media.type && media.data && media.type.startsWith('video/')) {
                // Video requires File API. Write to temp file.
                tempFilePathToUpload = path.join(os.tmpdir(), `upload-${Date.now()}.mp4`);
                // data is base64
                const base64Data = media.url ? media.url.split(',')[1] : media.data;
                fs.writeFileSync(tempFilePathToUpload, Buffer.from(base64Data, 'base64'));
                needsCleanup = true;
            }

            if (tempFilePathToUpload) {
                try {
                    const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePathToUpload, config: { mimeType: media.type || 'video/mp4' } }));
                    
                    let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
                    let attempts = 0;
                    while (fileState.state !== 'ACTIVE' && attempts < 30) {
                        if (fileState.state === 'FAILED') {
                            throw new Error("El procesamiento del video falló en la API de IA.");
                        }
                        await new Promise(r => setTimeout(r, 2000));
                        fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
                        attempts++;
                    }
                    
                    if (fileState.state !== 'ACTIVE') {
                            throw new Error(`El archivo de video aún no está listo. Estado actual: ${fileState.state}`);
                    }

                    parts.push({ fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } });
                } finally {
                    if (needsCleanup && fs.existsSync(tempFilePathToUpload)) fs.unlinkSync(tempFilePathToUpload);
                    // Also cleanup the chunked file if it was uploaded from client tempFilePath
                    if (media.tempFilePath && fs.existsSync(media.tempFilePath)) fs.unlinkSync(media.tempFilePath);
                }
            } else if (media.type && media.type.startsWith('image/')) {
                parts.push({ inlineData: { mimeType: media.type, data: media.url ? media.url.split(',')[1] : media.data } });
            }
        }
    }
    parts.push({ text: userPrompt || "Evalúa esta situación" });

    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        }));
        
        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
        const parsedJson = JSON.parse(cleanedJsonText);
        
        if (Array.isArray(parsedJson)) {
            return { riskItems: parsedJson as RiskItem[] };
        } else {
            // Sometimes the model wraps the array in an object, e.g. { "risks": [...] }
            const key = Object.keys(parsedJson)[0];
            if (key && Array.isArray(parsedJson[key])) {
                return { riskItems: parsedJson[key] as RiskItem[] };
            }
        }
        
        throw new Error("La respuesta de la IA no es un array de riesgos válido.");

    } catch (error) {
        handleGeminiError(error, "No se pudo generar el análisis de riesgo. Verifique la conexión, la API o que el archivo sea válido.", "Error calling Gemini API for risk assessment:");
    }
};

export const generateSafeWorkProcedure = async (evaluation: RiskEvaluation, nextCode: string): Promise<SafeWorkProcedure> => {
     
    
    const contextPrompt = `
        Basado en la siguiente evaluación de riesgos (Matriz IPERC), genera un Procedimiento de Trabajo Seguro (PTS) formal.
        Utiliza el siguiente código para el procedimiento: ${nextCode}
        Análisis Solicitado por el usuario: "${evaluation.prompt}"
        
        Riesgos Identificados:
        ${evaluation.risks.map(r => `
        - Tarea: ${r.tarea} en ${r.puesto}, ${r.sector}.
        - Peligro: ${r.peligros}.
        - Riesgo: ${r.riesgo} (Nivel Inicial: ${r.clasificacionRiesgoInicial}).
        - Acciones Requeridas: ${r.accionesRequeridas}.
        - Controles Propuestos: ${r.detalleControles}.
        - Procedimiento Sugerido: ${r.procedimiento || 'N/A'}.
        `).join('')}
    `;

    const systemInstruction = `
    Eres un experto en Higiene y Seguridad Ocupacional de una planta industrial de alimentos (Swift Argentina S.A.).
    Tu tarea es crear un Procedimiento de Trabajo Seguro (PTS) completo y profesional basado en un análisis de riesgos (IPERC) que se te proporcionará.
    
    Tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON válido. No incluyas texto introductorio, explicaciones, ni \`\`\`json ... \`\`\` markdown. Solo el objeto JSON.

    La estructura del objeto JSON debe ser la siguiente:
    {
        "codigo": "String", "titulo": "String", "manual": "String", "revision": "String", "fecha": "String", "responsable": "String",
        "realizado": "String", "revisado": "String", "aprobado": "String", "objetivo": "String", "alcance": "String",
        "desarrollo": "String (con markdown)", "responsabilidades": "String (con markdown)", "anexos": "String", "documentosReferencia": "String"
    }

    Instrucciones Clave:
    1.  **Código**: Utiliza EXACTAMENTE el código de documento proporcionado: ${nextCode}.
    2.  **Título**: Infiere un título claro a partir de las tareas analizadas (ej: "Despostillado Seguro en Línea de Producción").
    3.  **Fechas y Revisiones**: Usa la fecha actual (DD-MM-YYYY) para 'fecha'. Establece 'revision' en '01'.
    4.  **Responsables**: Asigna: Realizado: "Claudio Biscotti", Revisado: "Ariel Roth", Aprobado: "Tristan Micheletti", Responsable: "Gte. Higiene y Seguridad".
    5.  **Contenido**: Redacta cada sección de forma clara, profesional y en español.
    6.  **Desarrollo**: Transforma las 'Acciones Requeridas' y 'Controles' en una secuencia de pasos lógicos para un operario. Incluye EPPs, verificaciones previas y la descripción de la tarea segura. Usa markdown para listas (- item) y negritas (**texto**).
    7.  **Responsabilidades**: Define claramente los roles (ej: "El Supervisor es responsable de verificar...", "El Operario es responsable de usar..."). Usa markdown.
    `;
    
    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contextPrompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4,
                responseMimeType: "application/json"
            }
        }));

        const jsonText = response.text.trim();
        const cleanedJsonText = jsonText.replace(/^```json\s*/, '').replace(/```$/, '');
        return JSON.parse(cleanedJsonText) as SafeWorkProcedure;

    } catch (error) {
        handleGeminiError(error, "No se pudo generar el procedimiento de trabajo seguro.", "Error calling Gemini API for safe work procedure generation:");
    }
};

export const generateCauseTreeAnalysis = async (accident: AccidentReport): Promise<CauseTreeAnalysis> => {
    
    
    const prompt = `
        Eres un experto en Salud y Seguridad Ocupacional, especializado en la investigación de accidentes laborales utilizando la metodología de Árbol de Causas de la SRT de Argentina.
        Tu objetivo es analizar el incidente reportado, construir el árbol de causas, identificar las causas raíz y proponer un plan de acción correctiva.

        Metodología:
        1.  Parte del "Hecho Último" (la lesión).
        2.  Pregúntate "¿Qué tuvo que pasar para que esto ocurriera?". Continúa este proceso hasta llegar a las causas raíz.
        3.  Para el campo 'analisis', DEBES construir un árbol de causas en formato de texto plano. Este formato es MUY ESTRICTO porque se procesa automáticamente para generar un diagrama visual. Sigue estas reglas AL PIE DE LA LETRA:
            *   **Una Causa por Línea:** Cada causa individual debe ocupar su propia línea.
            *   **Viñeta de Guion:** CADA LÍNEA DEBE comenzar con un guion y un espacio (\`- \`).
            *   **Jerarquía por Indentación:** La relación padre-hijo se define ÚNICAMENTE por la indentación. Usa exactamente dos espacios por cada nivel de profundidad.
            *   **NO uses otros símbolos de viñetas** (como \`*\`, \`•\`, etc.).
            *   **NO combines múltiples ideas** en una sola línea.
            *   **NO escribas párrafos.**

            **EJEMPLO DE FORMATO OBLIGATORIO:**
            - Lesión del operario en mano izquierda.
              - Operario entra en contacto con cuchillo.
                - Cuchillo se zafa durante el corte.
                  - Movimiento inesperado de la carne.
                    - Causa Raíz: Falta de sujeción adecuada de la pieza.
                  - Presión excesiva aplicada por el operario.
                    - Causa Raíz: Cuchillo sin filo adecuado.
                - No utilizaba guante de malla.
                  - Causa Raíz: Falta de EPP disponible en el puesto.
        4.  Identifica las causas raíz accionables (ej: falta de procedimiento, EPP inadecuado).
        5.  Para CADA causa raíz, propón una acción correctiva específica, un responsable (rol, no nombre, ej: "Supervisor de Sector") y una fecha planificada (YYYY-MM-DD). IMPORTANTE: La fecha planificada DEBE ser obligatoriamente posterior a la fecha del accidente (${accident.date}), por ejemplo sumando 15 a 30 días a esa fecha.

        Datos del Incidente a Analizar:
        -   **Fecha del Accidente:** ${accident.date}
        -   **Suceso:** ${accident.description}
        -   **Lesión:** ${accident.tipoLesion} en ${accident.parteCuerpoAfectada}
        -   **Agente:** ${accident.agenteMaterial}
        -   **Puesto:** ${accident.puesto} en ${accident.sector}.
        -   **Tarea:** ${accident.tareaRutinaria}
        -   **Causal Inicial:** ${accident.causal}

        Genera el análisis en formato JSON según el schema.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            hechoUltimo: { type: Type.STRING, description: "El evento final del incidente." },
            analisis: { type: Type.STRING, description: "El árbol de causas en texto. Cada causa en una nueva línea, iniciando con '- ' y usando indentación de dos espacios por nivel para la jerarquía. Ver el ejemplo en el prompt." },
            causasRaiz: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de causas fundamentales." },
            accionesCorrectivas: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        responsible: { type: Type.STRING },
                        plannedDate: { type: Type.STRING, description: "Formato YYYY-MM-DD" },
                    },
                    propertyOrdering: ["description", "responsible", "plannedDate"],
                },
            }
        },
        propertyOrdering: ["hechoUltimo", "analisis", "causasRaiz", "accionesCorrectivas"],
    };

    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2
            }
        }));
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as CauseTreeAnalysis;

    } catch (error) {
        handleGeminiError(error, "No se pudo generar el análisis de árbol de causas. Intente de nuevo.", "Error calling Gemini API for cause tree analysis:");
    }
};

export const getEPPAdvice = async (ppeItems: { item: string, status: 'good' | 'bad' | 'missing', note: string }[]): Promise<string> => {
    const systemInstruction = `
    Eres un experto en Salud y Seguridad Ocupacional con 25 años de experiencia.
    Tu tarea es proporcionar un breve resumen o recomendación basándose en el estado de los Elementos de Protección Personal (EPP).
    `;
    const prompt = `Analiza el estado de los EPP y da recomendaciones: ${JSON.stringify(ppeItems)}`;

    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
            }
        }));
        return response.text || "Sin recomendación.";
    } catch (error) {
        handleGeminiError(error, "Error");
        return "";
    }
}


export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    

    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    },
                    {
                        text: prompt
                    }
                ]
            }
        }));

        // The response for image editing often comes back as an image part.
        // We need to iterate through parts to find the image.
        let resultImage = '';
        
        if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    resultImage = part.inlineData.data;
                    break;
                }
            }
        }

        if (resultImage) {
            return resultImage;
        } else {
             // Fallback: Sometimes it might return text if the model refuses or explains something.
             if (response.text) {
                 throw new Error(`El modelo respondió con texto en lugar de una imagen: ${response.text}`);
             }
            throw new Error("La API no devolvió ninguna imagen editada.");
        }

    } catch (error) {
        handleGeminiError(error, "No se pudo editar la imagen. Verifique la conexión o la configuración de la API.", "Error calling Gemini API for image editing:");
    }
};

export const generateRiskMap = async (base64Source: string, mimeType: string, sector: string, prompt: string, tempFilePath?: string): Promise<string> => {
    const systemInstruction = `
    Eres un Ingeniero de Seguridad e Higiene Ocupacional Senior y un Diseñador Gráfico experto especializado en cartografía industrial.
    Tu tarea es generar un MAPA DE RIESGOS profesional y detallado para el sector: ${sector}.
    
    INSTRUCCIONES DE DISEÑO:
    1. Utiliza el plano o imagen adjunta como base estructural.
    2. Aplica simbología estandarizada de seguridad (Normas ISO 7010 / IRAM 3517).
    3. Identifica zonas de riesgo mediante capas de color traslúcido: Rojo (Riesgo Alto), Amarillo (Riesgo Medio), Azul (Obligación).
    4. El diseño debe ser limpio, moderno, de alta calidad y fácil de interpretar para los operarios.
    5. Incluye una leyenda clara si es necesario dentro de la imagen.
    6. Asegúrate de marcar salidas de emergencia, extintores y zonas de uso obligatorio de EPP.
    
    REQUERIMIENTOS DEL USUARIO:
    ${prompt}
    
    RESPUESTA: Genera únicamente la imagen final procesada.
    `;

    try {
        let imagePart: any;
        let needsCleanup = false;

        if (tempFilePath) {
            const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePath, config: { mimeType } }));
            let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
            let attempts = 0;
            while (fileState.state !== 'ACTIVE' && attempts < 30) {
                if (fileState.state === 'FAILED') throw new Error("File processing failed.");
                await new Promise(r => setTimeout(r, 2000));
                fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
                attempts++;
            }
            imagePart = { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } };
            needsCleanup = true;
        } else {
            imagePart = { inlineData: { mimeType, data: base64Source } };
        }

        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    {
                        text: `Generar mapa de riesgos para el sector ${sector}. Instrucciones específicas: ${prompt}`
                    }
                ]
            },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.4
            }
        }));

        if (needsCleanup && fs.existsSync(tempFilePath!)) fs.unlinkSync(tempFilePath!);

        let resultImage = '';
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    resultImage = part.inlineData.data;
                    break;
                }
            }
        }

        if (resultImage) {
            return resultImage;
        } else {
            throw new Error("La IA no pudo procesar el mapa de riesgos. Intente con una imagen más clara.");
        }
    } catch (error) {
        console.error(error);
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error("Error al generar mapa de riesgos.");
    }
};

export const analyzeEvacuationRoutes = async (
    base64Source: string, 
    mimeType: string, 
    startPoint: { x: number, y: number }, 
    endPoint: { x: number, y: number },
    tempFilePath?: string
): Promise<{ primary: { x: number, y: number }[], alternative: { x: number, y: number }[] }> => {
    const systemInstruction = `
    Eres un experto en Seguridad Industrial y Prevención de Incendios.
    Tu tarea es analizar un plano de planta y determinar las rutas de evacuación más seguras.
    
    Se te proporciona:
    1. Una imagen del plano.
    2. Un punto de inicio (Usted está aquí): x=${startPoint.x}, y=${startPoint.y}.
    3. Un punto de encuentro (Destino): x=${endPoint.x}, y=${endPoint.y}.
    
    Debes identificar:
    - La RUTA PRINCIPAL: El camino más corto y directo hacia la salida más cercana que lleve al punto de encuentro.
    - La RUTA ALTERNATIVA: Un camino secundario en caso de que la ruta principal esté bloqueada.
    
    IMPORTANTE:
    - Las coordenadas x e y están en la misma escala que la imagen original.
    - Debes devolver una serie de puntos (nodos) que formen el camino, evitando paredes y obstáculos visibles en el plano.
    - No atravieses paredes. Usa pasillos y puertas.
    
    Tu respuesta debe ser un JSON con dos arrays de puntos: 'primary' y 'alternative'.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            primary: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                    },
                    required: ["x", "y"]
                }
            },
            alternative: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER }
                    },
                    required: ["x", "y"]
                }
            }
        },
        required: ["primary", "alternative"]
    };

    try {
        let imagePart: any;
        let needsCleanup = false;

        if (tempFilePath) {
            const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePath, config: { mimeType } }));
            let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
            let attempts = 0;
            while (fileState.state !== 'ACTIVE' && attempts < 30) {
                if (fileState.state === 'FAILED') throw new Error("File processing failed.");
                await new Promise(r => setTimeout(r, 2000));
                fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
                attempts++;
            }
            imagePart = { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } };
            needsCleanup = true;
        } else {
            imagePart = { inlineData: { mimeType, data: base64Source } };
        }

        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    imagePart,
                    {
                        text: `Analizar rutas desde (${startPoint.x}, ${startPoint.y}) hasta (${endPoint.x}, ${endPoint.y}).`
                    }
                ]
            },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1
            }
        }));

        if (needsCleanup && fs.existsSync(tempFilePath!)) fs.unlinkSync(tempFilePath!);

        const result = JSON.parse(response.text);
        return result;
    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        handleGeminiError(error, "No se pudo analizar las rutas de evacuación. Intente marcar los puntos más claramente.", "Error analyzing evacuation routes:");
    }
};

export const analyzeAccidentData = async (question: string, accidents: AccidentReport[]): Promise<string> => {
    const dataContext = `### DATOS DE ACCIDENTES ###\n${JSON.stringify(accidents)}`;
    const systemInstruction = "Eres un experto en estadísticas de siniestralidad laboral. Responde a la pregunta basada en los datos en formato JSON adjuntos.";

    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `${dataContext}\n\nPregunta: ${question}`,
             config: { systemInstruction, temperature: 0.1 }
        }));
        return response.text || "No se pudo generar un análisis";
    } catch(error) {
        handleGeminiError(error, "Error en el análisis de siniestralidad.");
        return "Hubo un error al procesar el análisis.";
    }
};

export const chatWithSegurino = async (question: string, appData: any): Promise<string> => {
    const dataContext = JSON.stringify(appData).slice(0, 50000); // Limit tokens
    const systemInstruction = "Eres 'Segurino', asistente experto en seguridad industrial. Usa los datos del sistema para responder.";
    
    try {
        const response = await executeWithRetry(() => getAI().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Datos del sistema: ${dataContext}\n\nPregunta del usuario: ${question}`,
            config: { systemInstruction, temperature: 0.1 }
        }));
        return response.text || "Sin respuesta";
    } catch (error) {
        console.error(error);
        return "Hubo un problema al contactar al servicio de IA. Inténtalo más tarde.";
    }
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    try {
        const response = await executeWithRetry(() => getAI().models.generateImages({
            model: 'imagen-3.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio as "1:1" | "16:9" | "9:16" | "4:3" | "3:4",
            },
        }));

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("La API no devolvió ninguna imagen.");
        }
    } catch (error) {
        console.error(error);
        throw new Error("Error al generar imagen.");
    }
};
