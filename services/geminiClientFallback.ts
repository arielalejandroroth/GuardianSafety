import { 
    AccidentReport, 
    CauseTreeAnalysis, 
    ArtClassification, 
    Attachment, 
    RiskItem, 
    RiskEvaluation, 
    SafeWorkProcedure 
} from '../types';

export const getGeminiApiKey = (): string => {
    return localStorage.getItem('GEMINI_API_KEY') || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
};

export const setGeminiApiKey = (key: string): void => {
    if (key && key.trim()) {
        localStorage.setItem('GEMINI_API_KEY', key.trim());
    } else {
        localStorage.removeItem('GEMINI_API_KEY');
    }
};

const ensureApiKey = (): string => {
    let key = getGeminiApiKey();
    if (!key) {
        const input = window.prompt(
            "Tu sitio en Hostinger está publicado en modo estático (sin servidor Node.js activo).\n\n" +
            "Para que la IA funcione al 100% directamente desde tu navegador, ingresa tu Clave de API de Gemini (la que copiaste de Google AI Studio, ej: AQ.Ab8...):"
        );
        if (input && input.trim()) {
            key = input.trim();
            setGeminiApiKey(key);
        } else {
            throw new Error("No se proporcionó una Clave de API de Gemini válida.");
        }
    }
    return key;
};

const callGeminiDirect = async (
    model: string, 
    contents: any[], 
    systemInstruction?: string, 
    responseMimeType?: string,
    temperature: number = 0.2
): Promise<string> => {
    let apiKey = ensureApiKey();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const body: any = {
        contents: contents,
        generationConfig: {
            temperature: temperature
        }
    };

    if (systemInstruction) {
        body.system_instruction = {
            parts: [{ text: systemInstruction }]
        };
    }

    if (responseMimeType) {
        body.generationConfig.responseMimeType = responseMimeType;
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData?.error?.message || `Error HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 400 || res.status === 403) {
            localStorage.removeItem('GEMINI_API_KEY');
            throw new Error(`La Clave de API de Gemini es inválida o no tiene permisos: ${msg}. Por favor verifícala e intenta nuevamente.`);
        }
        throw new Error(`Error en la API de Gemini: ${msg}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error("La IA no devolvió una respuesta válida.");
    }

    return candidate.content.parts[0].text;
};

export const executeClientFallback = async (action: string, payload: any): Promise<any> => {
    console.info(`[GeminiClientFallback] Ejecutando acción "${action}" directamente en el navegador...`);

    if (action === "suggestCorrection") {
        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: `Basado en la siguiente desviación observada en un entorno industrial, sugiere una medida correctiva breve y práctica:\n"${payload.deviationText}"\nLa respuesta debe ser solo la medida correctiva (máximo 2 oraciones).` }] }],
            undefined,
            undefined,
            0.2
        );
        return text || "No se pudo generar una sugerencia.";
    }

    if (action === "generateCauseTreeAnalysis") {
        const accident: AccidentReport = payload.accident;
        const prompt = `
            Eres un experto en Salud y Seguridad Ocupacional, especializado en la investigación de accidentes laborales utilizando la metodología de Árbol de Causas de la SRT de Argentina.
            Tu objetivo es analizar el incidente reportado, construir el árbol de causas, identificar las causas raíz y proponer un plan de acción correctiva.

            Metodología:
            1. Parte del "Hecho Último" (la lesión).
            2. Pregúntate "¿Qué tuvo que pasar para que esto ocurriera?". Continúa este proceso hasta llegar a las causas raíz.
            3. Para el campo 'analisis', DEBES construir un árbol de causas en formato de texto plano. Sigue estas reglas AL PIE DE LA LETRA:
                * Una Causa por Línea: Cada causa individual debe ocupar su propia línea.
                * Viñeta de Guion: CADA LÍNEA DEBE comenzar con un guion y un espacio ("- ").
                * Jerarquía por Indentación: La relación padre-hijo se define ÚNICAMENTE por la indentación. Usa exactamente dos espacios por cada nivel de profundidad.
                * NO uses otros símbolos de viñetas (como *, •, etc.).
                * NO combines múltiples ideas en una sola línea.
                * NO escribas párrafos.

                EJEMPLO DE FORMATO OBLIGATORIO:
                - Lesión del operario en mano izquierda.
                  - Operario entra en contacto con cuchillo.
                    - Cuchillo se zafa durante el corte.
                      - Movimiento inesperado de la carne.
                        - Causa Raíz: Falta de sujeción adecuada de la pieza.
                      - Presión excesiva aplicada por el operario.
                        - Causa Raíz: Cuchillo sin filo adecuado.
                    - No utilizaba guante de malla.
                      - Causa Raíz: Falta de EPP disponible en el puesto.
            4. Identifica las causas raíz accionables.
            5. Para CADA causa raíz, propón una acción correctiva específica, un responsable (rol, no nombre, ej: "Supervisor de Sector") y una fecha planificada (YYYY-MM-DD). IMPORTANTE: La fecha planificada DEBE ser posterior a la fecha del accidente (${accident.date}), por ejemplo sumando 15 a 30 días.

            Datos del Incidente a Analizar:
            - Fecha del Accidente: ${accident.date}
            - Suceso: ${accident.description}
            - Lesión: ${accident.tipoLesion} en ${accident.parteCuerpoAfectada}
            - Agente: ${accident.agenteMaterial}
            - Puesto: ${accident.puesto} en ${accident.sector}.
            - Tarea: ${accident.tareaRutinaria}
            - Causal Inicial: ${accident.causal}

            Responde EXCLUSIVAMENTE con un JSON con la siguiente estructura:
            {
              "hechoUltimo": "string",
              "analisis": "string con el arbol identado con - ",
              "causasRaiz": ["string"],
              "accionesCorrectivas": [
                {
                  "description": "string",
                  "responsible": "string",
                  "plannedDate": "YYYY-MM-DD"
                }
              ]
            }
        `;

        const responseText = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: prompt }] }],
            "Eres un experto en investigación de accidentes laborales con metodología Árbol de Causas SRT Argentina. Devuelve únicamente JSON válido.",
            "application/json",
            0.2
        );

        const cleanJson = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(cleanJson) as CauseTreeAnalysis;
    }

    if (action === "analyzeAccidentData") {
        const accidents = payload.accidents || [];
        const question = payload.question || '';
        const dataContext = `### DATOS DE ACCIDENTES ###\n${JSON.stringify(accidents)}`;
        const systemInstruction = "Eres un experto en estadísticas de siniestralidad laboral. Responde a la pregunta basada en los datos en formato JSON adjuntos.";
        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: `${dataContext}\n\nPregunta: ${question}` }] }],
            systemInstruction,
            undefined,
            0.1
        );
        return text || "No se pudo generar un análisis";
    }

    if (action === "chatWithSegurino") {
        const appData = payload.appData || {};
        const question = payload.question || '';
        const dataContext = JSON.stringify(appData).slice(0, 30000);
        const systemInstruction = "Eres 'Segurino', asistente experto en seguridad industrial. Usa los datos del sistema para responder cordialmente en español.";
        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: `Datos del sistema: ${dataContext}\n\nPregunta del usuario: ${question}` }] }],
            systemInstruction,
            undefined,
            0.2
        );
        return text || "Sin respuesta";
    }

    if (action === "getEPPAdvice") {
        const ppeItems = payload.ppeItems || [];
        const prompt = `Analiza la siguiente lista de verificación de EPPs y genera un consejo breve de seguridad:\n${JSON.stringify(ppeItems)}`;
        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: prompt }] }],
            "Eres un experto en seguridad e higiene laboral. Sé conciso y claro.",
            undefined,
            0.2
        );
        return text || "Utilice siempre el equipo de protección personal reglamentario.";
    }

    if (action === "generateSafeWorkProcedure") {
        const evaluation: RiskEvaluation = payload.evaluation;
        const nextCode: string = payload.nextCode || 'PTS-001';
        const contextPrompt = `
            Basado en la siguiente evaluación de riesgos (Matriz IPERC), genera un Procedimiento de Trabajo Seguro (PTS) formal.
            Código: ${nextCode}
            Análisis: "${evaluation.prompt}"
            Riesgos:
            ${evaluation.risks.map(r => `
            - Tarea: ${r.tarea} en ${r.puesto}, ${r.sector}.
            - Peligro: ${r.peligros}.
            - Riesgo: ${r.riesgo} (Nivel Inicial: ${r.clasificacionRiesgoInicial}).
            - Acciones Requeridas: ${r.accionesRequeridas}.
            - Controles: ${r.detalleControles}.
            `).join('\n')}

            Responde EXCLUSIVAMENTE con un JSON con la estructura:
            {
                "codigo": "${nextCode}",
                "titulo": "String",
                "manual": "Manual de Seguridad Operativa",
                "revision": "01",
                "fecha": "${new Date().toISOString().split('T')[0]}",
                "responsable": "Gte. Higiene y Seguridad",
                "realizado": "Claudio Biscotti",
                "revisado": "Ariel Roth",
                "aprobado": "Tristan Micheletti",
                "objetivo": "String",
                "alcance": "String",
                "desarrollo": "String con markdown",
                "responsabilidades": "String con markdown",
                "anexos": "N/A",
                "documentosReferencia": "Ley 19587"
            }
        `;

        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts: [{ text: contextPrompt }] }],
            "Eres un especialista en Higiene y Seguridad Laboral. Devuelve solo JSON.",
            "application/json",
            0.3
        );
        const clean = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        return JSON.parse(clean) as SafeWorkProcedure;
    }

    if (action === "generateRiskAssessment") {
        const media = payload.media || [];
        const userPrompt = payload.userPrompt || "Evalúa esta situación y genera los riesgos detectados.";
        const parts: any[] = [];
        
        for (const m of media) {
            if (m.data || m.base64Source || m.url) {
                const b64 = (m.data || m.base64Source || (m.url && m.url.includes(',') ? m.url.split(',')[1] : m.url));
                if (b64 && m.type && m.type.startsWith('image/')) {
                    parts.push({
                        inlineData: {
                            mimeType: m.type,
                            data: b64
                        }
                    });
                }
            }
        }
        parts.push({ text: `Analiza esta tarea/imagen y devuelve la matriz IPERC en JSON: ${userPrompt}` });

        const systemInstruction = `Eres 'Segurito', experto en Higiene y Seguridad Ocupacional.
Genera un array JSON de riesgos identificados con los campos:
item, sector, area, puesto, tarea, rutinaria, peligros, riesgo, frecuenciaExposicion, valorFrecuencia, control, valorControl, consecuencia, valorConsecuencia, nivelRiesgoInicial, clasificacionRiesgoInicial, jerarquiaControl, detalleControles, accionesRequeridas, frecuenciaResidual, valorFrecuenciaResidual, controlResidual, valorControlResidual, consecuenciaResidual, valorConsecuenciaResidual, nivelRiesgoResidual, clasificacionRiesgoResidual.
Devuelve SOLO un array JSON válido sin formato markdown.`;

        const text = await callGeminiDirect(
            'gemini-2.5-flash',
            [{ parts }],
            systemInstruction,
            "application/json",
            0.2
        );

        const clean = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) {
            return { riskItems: parsed };
        } else if (parsed && typeof parsed === 'object') {
            const firstKey = Object.keys(parsed)[0];
            if (firstKey && Array.isArray(parsed[firstKey])) {
                return { riskItems: parsed[firstKey] };
            }
        }
        return { riskItems: [] };
    }

    throw new Error(`Acción "${action}" no soportada en modo cliente directo. Asegúrate de iniciar el backend Node.js en Hostinger.`);
};
