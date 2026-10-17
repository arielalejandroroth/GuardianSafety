var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.dev.ts
var server_dev_exports = {};
__export(server_dev_exports, {
  EXTERNAL_API_URL: () => EXTERNAL_API_URL,
  app: () => app,
  default: () => server_dev_default,
  startDevServer: () => startDevServer
});
module.exports = __toCommonJS(server_dev_exports);
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_os2 = __toESM(require("os"), 1);

// services/geminiServiceServer.ts
var import_genai = require("@google/genai");
var import_fs = __toESM(require("fs"), 1);
var import_os = __toESM(require("os"), 1);
var import_path = __toESM(require("path"), 1);
var aiInstance = null;
var getAI = () => {
  if (!aiInstance) {
    const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set. Gemini services will be disabled.");
    }
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" }
      }
    });
  }
  return aiInstance;
};
var executeWithRetry = async (operation, maxRetries = 6, initialDelayMs = 2e3) => {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      const errMsg = String(error?.message || error);
      const isRetryable = error?.status === 503 || error?.status === 429 || errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("Too Many Requests");
      if (isRetryable && retries < maxRetries) {
        retries++;
        const delay = initialDelayMs * Math.pow(2, retries - 1);
        console.warn(`Gemini API high demand or rate limit. Retrying ${retries}/${maxRetries} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
var handleGeminiError = (error, defaultMessage, contextMessage) => {
  console.error(contextMessage || "Error calling Gemini API:", error);
  const errMsg = String(error?.message || error);
  if (error?.status === 503 || errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand")) {
    throw new Error("El modelo de IA est\xE1 experimentando alta demanda. Por favor, espere unos instantes y vuelva a intentarlo.");
  }
  if (error instanceof SyntaxError) {
    throw new Error("La IA devolvi\xF3 una respuesta en un formato inv\xE1lido. Intente de nuevo.");
  }
  throw new Error(defaultMessage + " | DETALLE: " + errMsg);
};
var suggestCorrection = async (deviationText) => {
  return executeWithRetry(async () => {
    try {
      const response = await getAI().models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Basado en la siguiente desviaci\xF3n observada en un entorno industrial, sugiere una medida correctiva breve y pr\xE1ctica:
"${deviationText}"
La respuesta debe ser solo la medida correctiva (m\xE1ximo 2 oraciones).`
      });
      return response.text || "No se pudo generar una sugerencia.";
    } catch (error) {
      handleGeminiError(error, "Error al generar sugerencia de correcci\xF3n.");
      return "";
    }
  });
};
var generateRiskAssessment = async (mediaArray, userPrompt = "") => {
  const systemInstruction = `
    Eres 'Segurito', un experto en Higiene y Seguridad Ocupacional con 25 a\xF1os de experiencia en plantas industriales, especializado en la creaci\xF3n de matrices IPERC (Identificaci\xF3n de Peligros, Evaluaci\xF3n de Riesgos y Controles).
    Tu tarea es analizar el archivo (imagen o video) y la tarea descrita por el usuario para identificar todos los peligros posibles y completar una matriz de riesgos siguiendo una metodolog\xEDa extremadamente estricta.
    
    Tu respuesta DEBE ser EXCLUSIVAMENTE un array de objetos JSON v\xE1lido. No incluyas texto introductorio, explicaciones, ni \`\`\`json ... \`\`\` markdown. Solo el array JSON.

    **METODOLOG\xCDA DE VALORIZACI\xD3N IPERC OBLIGATORIA:**

    Usa las siguientes tablas para la valoraci\xF3n:
    **1. FRECUENCIA (F):**
    - **Nula=0:** Exposici\xF3n al peligro es inexistente.
    - **Ocasional=1:** Frecuencia espor\xE1dica o eventual.
    - **Frecuente=2:** Frecuencia sistem\xE1tica pero no continua.
    - **Continua=3:** Exposici\xF3n continua durante la jornada.
    
    **2. CONTROL (Ctr):**
    - **Eficaz=0:** Eliminar / Sustituir. Se elimina completamente el peligro.
    - **Significativo=1:** Control de Ingenier\xEDa. Dispositivo que asegura que no ocurra el da\xF1o.
    - **Precario=2:** Se\xF1alizaci\xF3n / Control Adm. / EPP. La efectividad depende de la actitud del ejecutante.
    - **Inexistente=3:** Sin Control. No existe ning\xFAn dispositivo.
    
    **3. CONSECUENCIA (C):**
    - **Baja=1:** Da\xF1os superficiales, sin tratamiento especial.
    - **Media=2:** Da\xF1os con incapacidades temporales, requieren tratamiento.
    - **Alta=4:** Da\xF1os irreversibles (amputaciones, quemaduras graves, etc.).
    - **Muy Alta=8:** Fatalidad.

    Para CADA riesgo que identifiques, completa un objeto JSON con los siguientes campos, siguiendo estas reglas ESTRICTAS:

    **1. DESCRIPCI\xD3N:**
    - \`item\`: Numera secuencialmente cada riesgo, empezando en 1.
    - \`sector\`, \`area\`, \`puesto\`: Infiere del contexto o de la imagen. Si no es posible, usa "No especificado".
    - \`tarea\`: Describe la acci\xF3n espec\xEDfica con un verbo en infinitivo (ej: "Despostar cortes de carne").
    - \`rutinaria\`: Completa con 'R' si la tarea es rutinaria, o 'N' si no lo es.
    - \`peligros\`: Usa EXCLUSIVAMENTE la lista de peligros provista, incluyendo el c\xF3digo num\xE9rico.
    - \`riesgo\`: Usa EXCLUSIVAMENTE la lista de riesgos provista, incluyendo el c\xF3digo num\xE9rico.

    **2. AN\xC1LISIS DE RIESGO INICIAL (SIN CONTROLES):**
    - Asume que NO EXISTE NING\xDAN CONTROL para esta evaluaci\xF3n.
    - \`frecuenciaExposicion\`: Asigna el texto ("Nula", "Ocasional", "Frecuente", "Continua") de la tabla FRECUENCIA.
    - \`valorFrecuencia\`: Asigna el valor num\xE9rico (0, 1, 2, 3) correspondiente.
    - \`control\`: El valor DEBE ser "Inexistente".
    - \`valorControl\`: El valor DEBE ser 3.
    - \`consecuencia\`: Asigna el texto ("Baja", "Media", "Alta", "Muy Alta") de la tabla CONSECUENCIA, considerando el peor escenario posible.
    - \`valorConsecuencia\`: Asigna el valor num\xE9rico (1, 2, 4, 8) correspondiente.
    - \`nivelRiesgoInicial\`: Calcula: (valorFrecuencia * valorControl) * valorConsecuencia.
    - \`clasificacionRiesgoInicial\`: Asigna 'ALTO' si nivelRiesgoInicial >= 16; 'MEDIO' si 8 <= nivelRiesgoInicial < 16; o 'BAJO' si nivelRiesgoInicial < 8.

    **3. MECANISMOS DE CONTROL EXISTENTES:**
    - \`detalleControles\`: Describe SOLAMENTE los controles de seguridad que OBSERVAS en la evidencia (imagen/video). Si no ves ninguno, escribe "Ninguno observado".
    - \`eliminacion\`, \`sustitucion\`, \`controlesIngenieria\`, \`sac\`, \`epp\`: Basado en \`detalleControles\`, rellena CADA UNO de estos campos con 'SI' o 'NO'. Si no hay controles observados, todos deben ser 'NO'.
    - Re-eval\xFAa el \`valorControl\` usando la tabla de Control, basado en la efectividad de los controles que S\xCD observaste. Este nuevo valor se usar\xE1 para la evaluaci\xF3n final.

    **4. AN\xC1LISIS DE RIESGO FINAL:**
    - \`probOcurrenciaFinal\`: Calcula: valorFrecuencia * valorControl (el re-evaluado en el paso anterior).
    - \`consecuenciaFinal\`: Usa el MISMO valor num\xE9rico que \`valorConsecuencia\`.
    - \`nivelRiesgoFinal\`: Calcula: probOcurrenciaFinal * consecuenciaFinal.
    - \`clasificacionRiesgoFinal\`: Asigna 'ALTO', 'MEDIO', o 'BAJO' usando los mismos rangos que en la clasificaci\xF3n inicial.

    **5. MEJORAS:**
    - \`accionesRequeridas\`: Lista acciones claras y espec\xEDficas para reducir el riesgo. Este campo NUNCA debe estar vac\xEDo. Si el riesgo ya es bajo, sugiere "Mantener controles y realizar seguimiento peri\xF3dico".
    - \`procedimiento\`: Si las acciones lo ameritan, sugiere un nuevo procedimiento (ej: "Elaborar PTS para la tarea X"). Si no, d\xE9jalo en blanco.

    **IMPORTANTE FINAL**: La evaluaci\xF3n final debe reflejar la situaci\xF3n real observada. Las \`accionesRequeridas\` son propuestas a futuro y NO deben influir en el c\xE1lculo del \`nivelRiesgoFinal\`.
    
    **LISTA DE PELIGROS V\xC1LIDOS:**
    1. Objetos que caen / oscilan, 2. Objetos cortantes / punzantes, 3. Objetos que se proyectan, 4. Contacto el\xE9ctrico, 5. Incendio, 6. Ruido, 7. Carga t\xE9rmica (calor), 8. Radiaciones no ionizantes, 9. Radiaciones ionizantes, 10. Estr\xE9s t\xE9rmico (fr\xEDo), 11. Iluminaci\xF3n deficiente, 12. Ventilaci\xF3n deficiente, 13. Vibraciones, 14. Ergon\xF3mico, 15. Protecci\xF3n de maquinaria inexistente o insuficiente, 16. Falla en el sistema de aislaci\xF3n, 17. Sistemas de bloqueo inexistentes o desconectados, 18. Equipos sin mantenciones o revisiones de funcionamiento, 19. Equipo con partes alteradas o defectuosas, 20. Producto qu\xEDmico sin identificar, 21. Envase da\xF1ado o con defectos, 22. Almacenamiento incorrecto, 23. Productos incompatibles o reactivos, 24. Espacio reducido, 25. Espacio confinado, 26. Falta de orden y limpieza, 27. Falta delimitaci\xF3n, 28. Superficies calientes, 29. Polvo, 30. Gases, 31. Vapores, 32. Roc\xEDos, 33. Nieblas, 34. Humos met\xE1licos, 35. Agentes biol\xF3gicos, 36. Intervenir equipos energizados y/o en movimientos, 37. No advertir / se\xF1alizar, 38. No usar equipo de protecci\xF3n personal, 39. Uso inadecuado de herramientas, 40. Explosi\xF3n, 41. Animales vivos, 42. Veh\xEDculos en movimiento, 43. Proyecci\xF3n de fluidos, 44. Escaleras sin barandas, 45. Transitar bajo carga suspendida, 46. Barandas de escalera en mal estado, 47. Acopio sub-est\xE1ndar, 48. Correr o desplazarse r\xE1pido, 49. Sobrecargar enchufes o alargadores, 50. Condiciones clim\xE1ticas adversas, 51. Instalaciones el\xE9ctricas inadecuadas o en mal estado, 52. Zona resbalosa por presencia de (materia,restos,agua,grasa,fluidos,huesos), 53. Fluidos calientes sometidos a presi\xF3n, 54. Trabajo en Altura

    **LISTA DE RIESGOS V\xC1LIDOS:**
    1. Ca\xEDda de objetos, 2. Ca\xEDda de objetos desde altura, 3. Ca\xEDda de persona a nivel / desnivel, 4. Colisi\xF3n de veh\xEDculo com persona, 5. Contacto-inhalaci\xF3n-ingesta con producto qu\xEDmico, 6. Cortes, 7. Derrumbe, 8. Descargas el\xE9ctricas atmosf\xE9ricas, 9. Ca\xEDda de carga elevada (Animal/Media res/ cuarto/ canasto), 10. Rotura de elementos de izaje, 11. Atrapamiento com materiales en proceso o almacenados, 12. Ca\xEDda de persona desde equipos en movimientos, 13. Vuelco de veh\xEDculos, 14. Colisi\xF3n entre veh\xEDculos, 15. Contacto com objeto/superficie caliente, 16. Contacto con fuego, 17. Contacto con elemento cortante/cortopunzante/punzante, 18. Golpeado con/por/contra objeto/herramienta/estructura, 19. Atrapamiento, 20. Atropello por animal, 21. Atropello por veh\xEDculo, 22. Exposici\xF3n a ruido, 23. Quemaduras, 24. Atrapamiento com maquinarias, 25. Exposici\xF3n a proyecci\xF3n de chispas, 26. Exposici\xF3n a proyecci\xF3n de objetos, 27. Salpicaduras, 28. Exposici\xF3n a proyecci\xF3n de fluidos, 29. Resbalones / Tropiezos, 30. Aplastamiento por ca\xEDda de carga, 31. Contacto el\xE9ctrico directo/indirecto, 32. Sobreesfuerzos, 33. Riesgo biol\xF3gico, 34. Exposici\xF3n a dosis RX elevada, 35. Radiaciones No Ionizantes, 36. Quemaduras por contacto con fluido caliente
    `;
  let parts = [];
  if (mediaArray && mediaArray.length > 0) {
    for (const media of mediaArray) {
      let tempFilePathToUpload = media.tempFilePath;
      let needsCleanup = false;
      if (!tempFilePathToUpload && media.type && media.data && media.type.startsWith("video/")) {
        const cleanType = media.type.split(";")[0];
        let ext = "mp4";
        if (cleanType.includes("webm")) ext = "webm";
        if (cleanType.includes("ogg")) ext = "ogg";
        if (cleanType.includes("quicktime")) ext = "mov";
        tempFilePathToUpload = import_path.default.join(import_os.default.tmpdir(), `upload-${Date.now()}.${ext}`);
        const base64Data = media.url ? media.url.split(",")[1] : media.data;
        import_fs.default.writeFileSync(tempFilePathToUpload, Buffer.from(base64Data, "base64"));
        needsCleanup = true;
      }
      if (tempFilePathToUpload) {
        try {
          const cleanMime = (media.type || "video/mp4").split(";")[0];
          const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePathToUpload, config: { mimeType: cleanMime } }));
          let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
          let attempts = 0;
          while (fileState.state !== "ACTIVE" && attempts < 30) {
            if (fileState.state === "FAILED") {
              console.error("Gemini File Processing Failed:", fileState);
              throw new Error(`El procesamiento del archivo fall\xF3 en la API de IA. Detalle: ${fileState.error?.message || "Error desconocido"}`);
            }
            await new Promise((r) => setTimeout(r, 2e3));
            fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
            attempts++;
          }
          if (fileState.state !== "ACTIVE") {
            throw new Error(`El archivo a\xFAn no est\xE1 listo tras m\xFAltiples intentos. Estado actual: ${fileState.state}`);
          }
          parts.push({ fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } });
        } finally {
          if (needsCleanup && import_fs.default.existsSync(tempFilePathToUpload)) import_fs.default.unlinkSync(tempFilePathToUpload);
          if (media.tempFilePath && import_fs.default.existsSync(media.tempFilePath)) import_fs.default.unlinkSync(media.tempFilePath);
        }
      } else if (media.type && media.type.startsWith("image/")) {
        parts.push({ inlineData: { mimeType: media.type, data: media.url ? media.url.split(",")[1] : media.data } });
      }
    }
  }
  parts.push({ text: userPrompt || "Eval\xFAa esta situaci\xF3n" });
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    }));
    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*/, "").replace(/```$/, "");
    const parsedJson = JSON.parse(cleanedJsonText);
    if (Array.isArray(parsedJson)) {
      return { riskItems: parsedJson };
    } else {
      const key = Object.keys(parsedJson)[0];
      if (key && Array.isArray(parsedJson[key])) {
        return { riskItems: parsedJson[key] };
      }
    }
    throw new Error("La respuesta de la IA no es un array de riesgos v\xE1lido.");
  } catch (error) {
    handleGeminiError(error, "No se pudo generar el an\xE1lisis de riesgo. Verifique la conexi\xF3n, la API o que el archivo sea v\xE1lido.", "Error calling Gemini API for risk assessment:");
  }
};
var generateSafeWorkProcedure = async (evaluation, nextCode) => {
  const contextPrompt = `
        Basado en la siguiente evaluaci\xF3n de riesgos (Matriz IPERC), genera un Procedimiento de Trabajo Seguro (PTS) formal.
        Utiliza el siguiente c\xF3digo para el procedimiento: ${nextCode}
        An\xE1lisis Solicitado por el usuario: "${evaluation.prompt}"
        
        Riesgos Identificados:
        ${evaluation.risks.map((r) => `
        - Tarea: ${r.tarea} en ${r.puesto}, ${r.sector}.
        - Peligro: ${r.peligros}.
        - Riesgo: ${r.riesgo} (Nivel Inicial: ${r.clasificacionRiesgoInicial}).
        - Acciones Requeridas: ${r.accionesRequeridas}.
        - Controles Propuestos: ${r.detalleControles}.
        - Procedimiento Sugerido: ${r.procedimiento || "N/A"}.
        `).join("")}
    `;
  const systemInstruction = `
    Eres un experto en Higiene y Seguridad Ocupacional de una planta industrial de alimentos (Swift Argentina S.A.).
    Tu tarea es crear un Procedimiento de Trabajo Seguro (PTS) completo y profesional basado en un an\xE1lisis de riesgos (IPERC) que se te proporcionar\xE1.
    
    Tu respuesta DEBE ser EXCLUSIVAMENTE un objeto JSON v\xE1lido. No incluyas texto introductorio, explicaciones, ni \`\`\`json ... \`\`\` markdown. Solo el objeto JSON.

    La estructura del objeto JSON debe ser la siguiente:
    {
        "codigo": "String", "titulo": "String", "manual": "String", "revision": "String", "fecha": "String", "responsable": "String",
        "realizado": "String", "revisado": "String", "aprobado": "String", "objetivo": "String", "alcance": "String",
        "desarrollo": "String (con markdown)", "responsabilidades": "String (con markdown)", "anexos": "String", "documentosReferencia": "String"
    }

    Instrucciones Clave:
    1.  **C\xF3digo**: Utiliza EXACTAMENTE el c\xF3digo de documento proporcionado: ${nextCode}.
    2.  **T\xEDtulo**: Infiere un t\xEDtulo claro a partir de las tareas analizadas (ej: "Despostillado Seguro en L\xEDnea de Producci\xF3n").
    3.  **Fechas y Revisiones**: Usa la fecha actual (DD-MM-YYYY) para 'fecha'. Establece 'revision' en '01'.
    4.  **Responsables**: Asigna: Realizado: "Claudio Biscotti", Revisado: "Ariel Roth", Aprobado: "Tristan Micheletti", Responsable: "Gte. Higiene y Seguridad".
    5.  **Contenido**: Redacta cada secci\xF3n de forma clara, profesional y en espa\xF1ol.
    6.  **Desarrollo**: Transforma las 'Acciones Requeridas' y 'Controles' en una secuencia de pasos l\xF3gicos para un operario. Incluye EPPs, verificaciones previas y la descripci\xF3n de la tarea segura. Usa markdown para listas (- item) y negritas (**texto**).
    7.  **Responsabilidades**: Define claramente los roles (ej: "El Supervisor es responsable de verificar...", "El Operario es responsable de usar..."). Usa markdown.
    `;
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
      config: {
        systemInstruction,
        temperature: 0.4,
        responseMimeType: "application/json"
      }
    }));
    const jsonText = response.text.trim();
    const cleanedJsonText = jsonText.replace(/^```json\s*/, "").replace(/```$/, "");
    return JSON.parse(cleanedJsonText);
  } catch (error) {
    handleGeminiError(error, "No se pudo generar el procedimiento de trabajo seguro.", "Error calling Gemini API for safe work procedure generation:");
  }
};
var generateCauseTreeAnalysis = async (accident) => {
  const prompt = `
        Eres un experto en Salud y Seguridad Ocupacional, especializado en la investigaci\xF3n de accidentes laborales utilizando la metodolog\xEDa de \xC1rbol de Causas de la SRT de Argentina.
        Tu objetivo es analizar el incidente reportado, construir el \xE1rbol de causas, identificar las causas ra\xEDz y proponer un plan de acci\xF3n correctiva.

        Metodolog\xEDa:
        1.  Parte del "Hecho \xDAltimo" (la lesi\xF3n).
        2.  Preg\xFAntate "\xBFQu\xE9 tuvo que pasar para que esto ocurriera?". Contin\xFAa este proceso hasta llegar a las causas ra\xEDz.
        3.  Para el campo 'analisis', DEBES construir un \xE1rbol de causas en formato de texto plano. Este formato es MUY ESTRICTO porque se procesa autom\xE1ticamente para generar un diagrama visual. Sigue estas reglas AL PIE DE LA LETRA:
            *   **Una Causa por L\xEDnea:** Cada causa individual debe ocupar su propia l\xEDnea.
            *   **Vi\xF1eta de Guion:** CADA L\xCDNEA DEBE comenzar con un guion y un espacio (\`- \`).
            *   **Jerarqu\xEDa por Indentaci\xF3n:** La relaci\xF3n padre-hijo se define \xDANICAMENTE por la indentaci\xF3n. Usa exactamente dos espacios por cada nivel de profundidad.
            *   **NO uses otros s\xEDmbolos de vi\xF1etas** (como \`*\`, \`\u2022\`, etc.).
            *   **NO combines m\xFAltiples ideas** en una sola l\xEDnea.
            *   **NO escribas p\xE1rrafos.**

            **EJEMPLO DE FORMATO OBLIGATORIO:**
            - Lesi\xF3n del operario en mano izquierda.
              - Operario entra en contacto con cuchillo.
                - Cuchillo se zafa durante el corte.
                  - Movimiento inesperado de la carne.
                    - Causa Ra\xEDz: Falta de sujeci\xF3n adecuada de la pieza.
                  - Presi\xF3n excesiva aplicada por el operario.
                    - Causa Ra\xEDz: Cuchillo sin filo adecuado.
                - No utilizaba guante de malla.
                  - Causa Ra\xEDz: Falta de EPP disponible en el puesto.
        4.  Identifica las causas ra\xEDz accionables (ej: falta de procedimiento, EPP inadecuado).
        5.  Para CADA causa ra\xEDz, prop\xF3n una acci\xF3n correctiva espec\xEDfica, un responsable (rol, no nombre, ej: "Supervisor de Sector") y una fecha planificada (YYYY-MM-DD). IMPORTANTE: La fecha planificada DEBE ser obligatoriamente posterior a la fecha del accidente (${accident.date}), por ejemplo sumando 15 a 30 d\xEDas a esa fecha.

        Datos del Incidente a Analizar:
        -   **Fecha del Accidente:** ${accident.date}
        -   **Suceso:** ${accident.description}
        -   **Lesi\xF3n:** ${accident.tipoLesion} en ${accident.parteCuerpoAfectada}
        -   **Agente:** ${accident.agenteMaterial}
        -   **Puesto:** ${accident.puesto} en ${accident.sector}.
        -   **Tarea:** ${accident.tareaRutinaria}
        -   **Causal Inicial:** ${accident.causal}

        Genera el an\xE1lisis en formato JSON seg\xFAn el schema.
    `;
  const responseSchema = {
    type: import_genai.Type.OBJECT,
    properties: {
      hechoUltimo: { type: import_genai.Type.STRING, description: "El evento final del incidente." },
      analisis: { type: import_genai.Type.STRING, description: "El \xE1rbol de causas en texto. Cada causa en una nueva l\xEDnea, iniciando con '- ' y usando indentaci\xF3n de dos espacios por nivel para la jerarqu\xEDa. Ver el ejemplo en el prompt." },
      causasRaiz: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING }, description: "Lista de causas fundamentales." },
      accionesCorrectivas: {
        type: import_genai.Type.ARRAY,
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            description: { type: import_genai.Type.STRING },
            responsible: { type: import_genai.Type.STRING },
            plannedDate: { type: import_genai.Type.STRING, description: "Formato YYYY-MM-DD" }
          },
          propertyOrdering: ["description", "responsible", "plannedDate"]
        }
      }
    },
    propertyOrdering: ["hechoUltimo", "analisis", "causasRaiz", "accionesCorrectivas"]
  };
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2
      }
    }));
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    handleGeminiError(error, "No se pudo generar el an\xE1lisis de \xE1rbol de causas. Intente de nuevo.", "Error calling Gemini API for cause tree analysis:");
  }
};
var getEPPAdvice = async (ppeItems) => {
  const systemInstruction = `
    Eres un experto en Salud y Seguridad Ocupacional con 25 a\xF1os de experiencia.
    Tu tarea es proporcionar un breve resumen o recomendaci\xF3n bas\xE1ndose en el estado de los Elementos de Protecci\xF3n Personal (EPP).
    `;
  const prompt = `Analiza el estado de los EPP y da recomendaciones: ${JSON.stringify(ppeItems)}`;
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    }));
    return response.text || "Sin recomendaci\xF3n.";
  } catch (error) {
    handleGeminiError(error, "Error");
    return "";
  }
};
var editImage = async (base64Image, mimeType, prompt, tempFilePath) => {
  try {
    let parts = [];
    if (tempFilePath) {
      const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePath, config: { mimeType } }));
      parts.push({ fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } });
      if (import_fs.default.existsSync(tempFilePath)) import_fs.default.unlinkSync(tempFilePath);
    } else if (base64Image) {
      parts.push({
        inlineData: {
          mimeType,
          data: base64Image
        }
      });
    }
    parts.push({ text: prompt });
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: { parts }
    }));
    let resultImage = "";
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
      if (response.text) {
        throw new Error(`El modelo respondi\xF3 con texto en lugar de una imagen: ${response.text}`);
      }
      throw new Error("La API no devolvi\xF3 ninguna imagen editada.");
    }
  } catch (error) {
    handleGeminiError(error, "No se pudo editar la imagen. Verifique la conexi\xF3n o la configuraci\xF3n de la API.", "Error calling Gemini API for image editing:");
  }
};
var generateRiskMap = async (base64Source, mimeType, sector, prompt, tempFilePath) => {
  const systemInstruction = `
    Eres un Ingeniero de Seguridad e Higiene Ocupacional Senior y un Dise\xF1ador Gr\xE1fico experto especializado en cartograf\xEDa industrial.
    Tu tarea es generar un MAPA DE RIESGOS profesional y detallado para el sector: ${sector}.
    
    INSTRUCCIONES DE DISE\xD1O:
    1. Utiliza el plano o imagen adjunta como base estructural.
    2. Aplica simbolog\xEDa estandarizada de seguridad (Normas ISO 7010 / IRAM 3517).
    3. Identifica zonas de riesgo mediante capas de color trasl\xFAcido: Rojo (Riesgo Alto), Amarillo (Riesgo Medio), Azul (Obligaci\xF3n).
    4. El dise\xF1o debe ser limpio, moderno, de alta calidad y f\xE1cil de interpretar para los operarios.
    5. Incluye una leyenda clara si es necesario dentro de la imagen.
    6. Aseg\xFArate de marcar salidas de emergencia, extintores y zonas de uso obligatorio de EPP.
    
    REQUERIMIENTOS DEL USUARIO:
    ${prompt}
    
    RESPUESTA: Genera \xFAnicamente la imagen final procesada.
    `;
  try {
    let imagePart;
    let needsCleanup = false;
    if (tempFilePath) {
      const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePath, config: { mimeType } }));
      let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
      let attempts = 0;
      while (fileState.state !== "ACTIVE" && attempts < 30) {
        if (fileState.state === "FAILED") throw new Error(`El procesamiento del archivo fall\xF3. Detalle: ${fileState.error?.message || "Error desconocido"}`);
        await new Promise((r) => setTimeout(r, 2e3));
        fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
        attempts++;
      }
      imagePart = { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } };
      needsCleanup = true;
    } else {
      imagePart = { inlineData: { mimeType, data: base64Source } };
    }
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: {
        parts: [
          imagePart,
          {
            text: `Generar mapa de riesgos para el sector ${sector}. Instrucciones espec\xEDficas: ${prompt}`
          }
        ]
      },
      config: {
        systemInstruction,
        temperature: 0.4
      }
    }));
    if (needsCleanup && import_fs.default.existsSync(tempFilePath)) import_fs.default.unlinkSync(tempFilePath);
    let resultImage = "";
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
      throw new Error("La IA no pudo procesar el mapa de riesgos. Intente con una imagen m\xE1s clara.");
    }
  } catch (error) {
    console.error(error);
    if (tempFilePath && import_fs.default.existsSync(tempFilePath)) import_fs.default.unlinkSync(tempFilePath);
    throw new Error("Error al generar mapa de riesgos: " + error.message);
  }
};
var analyzeEvacuationRoutes = async (base64Source, mimeType, startPoint, endPoint, tempFilePath) => {
  const systemInstruction = `
    Eres un experto en Seguridad Industrial y Prevenci\xF3n de Incendios.
    Tu tarea es analizar un plano de planta y determinar las rutas de evacuaci\xF3n m\xE1s seguras.
    
    Se te proporciona:
    1. Una imagen del plano.
    2. Un punto de inicio (Usted est\xE1 aqu\xED): x=${startPoint.x}, y=${startPoint.y}.
    3. Un punto de encuentro (Destino): x=${endPoint.x}, y=${endPoint.y}.
    
    Debes identificar:
    - La RUTA PRINCIPAL: El camino m\xE1s corto y directo hacia la salida m\xE1s cercana que lleve al punto de encuentro.
    - La RUTA ALTERNATIVA: Un camino secundario en caso de que la ruta principal est\xE9 bloqueada.
    
    IMPORTANTE:
    - Las coordenadas x e y est\xE1n en la misma escala que la imagen original.
    - Debes devolver una serie de puntos (nodos) que formen el camino, evitando paredes y obst\xE1culos visibles en el plano.
    - No atravieses paredes. Usa pasillos y puertas.
    
    Tu respuesta debe ser un JSON con dos arrays de puntos: 'primary' y 'alternative'.
    `;
  const responseSchema = {
    type: import_genai.Type.OBJECT,
    properties: {
      primary: {
        type: import_genai.Type.ARRAY,
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            x: { type: import_genai.Type.NUMBER },
            y: { type: import_genai.Type.NUMBER }
          },
          required: ["x", "y"]
        }
      },
      alternative: {
        type: import_genai.Type.ARRAY,
        items: {
          type: import_genai.Type.OBJECT,
          properties: {
            x: { type: import_genai.Type.NUMBER },
            y: { type: import_genai.Type.NUMBER }
          },
          required: ["x", "y"]
        }
      }
    },
    required: ["primary", "alternative"]
  };
  try {
    let imagePart;
    let needsCleanup = false;
    if (tempFilePath) {
      const uploadResult = await executeWithRetry(() => getAI().files.upload({ file: tempFilePath, config: { mimeType } }));
      let fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
      let attempts = 0;
      while (fileState.state !== "ACTIVE" && attempts < 30) {
        if (fileState.state === "FAILED") throw new Error(`El procesamiento del archivo fall\xF3. Detalle: ${fileState.error?.message || "Error desconocido"}`);
        await new Promise((r) => setTimeout(r, 2e3));
        fileState = await executeWithRetry(() => getAI().files.get({ name: uploadResult.name }));
        attempts++;
      }
      imagePart = { fileData: { fileUri: uploadResult.uri, mimeType: uploadResult.mimeType } };
      needsCleanup = true;
    } else {
      imagePart = { inlineData: { mimeType, data: base64Source } };
    }
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: {
        parts: [
          imagePart,
          {
            text: `Analizar rutas desde (${startPoint.x}, ${startPoint.y}) hasta (${endPoint.x}, ${endPoint.y}).`
          }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1
      }
    }));
    if (needsCleanup && import_fs.default.existsSync(tempFilePath)) import_fs.default.unlinkSync(tempFilePath);
    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    if (tempFilePath && import_fs.default.existsSync(tempFilePath)) import_fs.default.unlinkSync(tempFilePath);
    handleGeminiError(error, "No se pudo analizar las rutas de evacuaci\xF3n. Intente marcar los puntos m\xE1s claramente.", "Error analyzing evacuation routes:");
  }
};
var analyzeAccidentData = async (question, accidents) => {
  const dataContext = `### DATOS DE ACCIDENTES ###
${JSON.stringify(accidents)}`;
  const systemInstruction = "Eres un experto en estad\xEDsticas de siniestralidad laboral. Responde a la pregunta basada en los datos en formato JSON adjuntos.";
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${dataContext}

Pregunta: ${question}`,
      config: { systemInstruction, temperature: 0.1 }
    }));
    return response.text || "No se pudo generar un an\xE1lisis";
  } catch (error) {
    handleGeminiError(error, "Error en el an\xE1lisis de siniestralidad.");
    return "Hubo un error al procesar el an\xE1lisis.";
  }
};
var chatWithSegurino = async (question, appData) => {
  const dataContext = JSON.stringify(appData).slice(0, 5e4);
  const systemInstruction = "Eres 'Segurino', asistente experto en seguridad industrial. Usa los datos del sistema para responder.";
  try {
    const response = await executeWithRetry(() => getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Datos del sistema: ${dataContext}

Pregunta del usuario: ${question}`,
      config: { systemInstruction, temperature: 0.1 }
    }));
    return response.text || "Sin respuesta";
  } catch (error) {
    console.error(error);
    return "Hubo un problema al contactar al servicio de IA. Int\xE9ntalo m\xE1s tarde.";
  }
};
var generateImage = async (prompt, aspectRatio) => {
  try {
    const response = await executeWithRetry(() => getAI().models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: "image/jpeg",
        aspectRatio
      }
    }));
    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("La API no devolvi\xF3 ninguna imagen.");
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error al generar imagen.");
  }
};

// server.dev.ts
var app = (0, import_express.default)();
var server_dev_default = app;
var EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || "https://generativelanguage.googleapis.com/v1beta/models";
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use((req, _res, next) => {
  const safeUrl = req.originalUrl || req.url;
  console.log(`[REQUEST] ${req.method} ${safeUrl.split("?")[0]}`);
  next();
});
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
app.get("/api/estado", (_req, res) => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.json({
    ok: true,
    apiKeyConfigurada: isConfigured,
    servidor: "activo"
  });
});
app.get("/api/datos", async (_req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return res.status(500).json({
      ok: false,
      error: "La API del servidor no est\xE1 configurada"
    });
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15e3);
  try {
    const authType = (process.env.EXTERNAL_API_AUTH_TYPE || "bearer").toLowerCase();
    const headers = {
      "Accept": "application/json"
    };
    if (authType === "x-api-key") {
      headers["x-api-key"] = apiKey;
    } else if (authType === "x-goog-api-key") {
      headers["x-goog-api-key"] = apiKey;
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }
    const response = await fetch(EXTERNAL_API_URL, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (response.status === 401 || response.status === 403) {
      return res.status(502).json({
        ok: false,
        error: "La API externa rechaz\xF3 la autenticaci\xF3n"
      });
    }
    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: "No se pudieron obtener los datos"
      });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return res.status(502).json({
        ok: false,
        error: "La API externa devolvi\xF3 una respuesta con formato inv\xE1lido"
      });
    }
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      return res.status(502).json({
        ok: false,
        error: "La respuesta de la API externa no es JSON v\xE1lido"
      });
    }
    return res.json({
      ok: true,
      datos: responseData
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error?.name === "AbortError" || controller.signal.aborted) {
      return res.status(504).json({
        ok: false,
        error: "La API externa tard\xF3 demasiado en responder"
      });
    }
    console.error("[Backend] Error al conectar con API externa:", error?.message);
    return res.status(502).json({
      ok: false,
      error: "No fue posible comunicarse con la API externa"
    });
  }
});
app.post("/api/upload-chunk", (req, res) => {
  try {
    const { sessionId, chunkIndex, totalChunks, chunkData } = req.body;
    if (!sessionId || typeof chunkIndex !== "number" || typeof totalChunks !== "number" || !chunkData) {
      return res.status(400).json({ error: "Par\xE1metros de subida incompletos" });
    }
    const chunkBuffer = Buffer.from(chunkData, "base64");
    const tempPath = import_path2.default.join(import_os2.default.tmpdir(), `upload-${sessionId}`);
    if (chunkIndex === 0 && import_fs2.default.existsSync(tempPath)) {
      import_fs2.default.unlinkSync(tempPath);
    }
    import_fs2.default.appendFileSync(tempPath, chunkBuffer);
    if (chunkIndex === totalChunks - 1) {
      res.json({ success: true, tempPath, message: "Subida completada" });
    } else {
      res.json({ success: true, message: "Parte recibida" });
    }
  } catch (error) {
    console.error("[Backend] Error en subida de archivo:", error?.message);
    res.status(500).json({ error: "Error interno al procesar el archivo" });
  }
});
app.post("/api/gemini", async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return res.status(500).json({
      ok: false,
      error: "La API del servidor no est\xE1 configurada"
    });
  }
  try {
    const { action, payload } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Acci\xF3n no especificada" });
    }
    let result;
    switch (action) {
      case "suggestCorrection":
        result = await suggestCorrection(payload.deviationText);
        break;
      case "generateRiskAssessment":
        result = await generateRiskAssessment(payload.media, payload.userPrompt);
        break;
      case "generateSafeWorkProcedure":
        result = await generateSafeWorkProcedure(payload.evaluation, payload.nextCode);
        break;
      case "generateCauseTreeAnalysis":
        result = await generateCauseTreeAnalysis(payload.accident);
        break;
      case "getEPPAdvice":
        result = await getEPPAdvice(payload.ppeItems);
        break;
      case "analyzeAccidentData":
        result = await analyzeAccidentData(payload.question, payload.accidents);
        break;
      case "chatWithSegurino":
        result = await chatWithSegurino(payload.question, payload.appData);
        break;
      case "generateImage":
        result = await generateImage(payload.prompt, payload.aspectRatio);
        break;
      case "editImage":
        result = await editImage(payload.base64Image, payload.mimeType, payload.prompt, payload.tempFilePath);
        break;
      case "generateRiskMap":
        result = await generateRiskMap(payload.base64Source, payload.mimeType, payload.sector, payload.prompt, payload.tempFilePath);
        break;
      case "analyzeEvacuationRoutes":
        result = await analyzeEvacuationRoutes(payload.base64Source, payload.mimeType, payload.startPoint, payload.endPoint, payload.tempFilePath);
        break;
      default:
        return res.status(400).json({ error: "Acci\xF3n desconocida" });
    }
    return res.json({ ok: true, result });
  } catch (error) {
    console.error("[Backend] Error en /api/gemini:", error?.message);
    const safeError = error?.message?.includes("API_KEY") ? "La API del servidor no est\xE1 configurada" : error?.message || "Error al procesar la solicitud en el servidor.";
    return res.status(500).json({ ok: false, error: safeError });
  }
});
app.use("/api", (err, _req, res, _next) => {
  console.error("[Backend] Error en ruta API:", err?.message);
  res.status(err.status || 500).json({ ok: false, error: "Error interno del servidor" });
});
async function startDevServer() {
  const isProduction = process.env.NODE_ENV === "production" || typeof __filename !== "undefined" && __filename.endsWith(".cjs") || Boolean(process.argv[1] && process.argv[1].endsWith(".cjs"));
  if (!isProduction && !process.env.VERCEL) {
    const viteModule = "vite";
    const { createServer: createViteServer } = await import(
      /* @vite-ignore */
      viteModule
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    let distPath = import_path2.default.join(process.cwd(), "dist");
    if (typeof __dirname !== "undefined") {
      if (import_fs2.default.existsSync(import_path2.default.join(__dirname, "dist", "index.html"))) {
        distPath = import_path2.default.join(__dirname, "dist");
      } else if (import_fs2.default.existsSync(import_path2.default.join(__dirname, "index.html")) && import_fs2.default.existsSync(import_path2.default.join(__dirname, "assets"))) {
        distPath = __dirname;
      }
    }
    app.use(import_express.default.static(distPath));
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        const indexPath = import_path2.default.join(distPath, "index.html");
        if (import_fs2.default.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      next();
    });
  }
  if (!process.env.VERCEL) {
    const rawPort = process.env.PORT || 3e3;
    if (typeof rawPort === "string" && (isNaN(Number(rawPort)) || rawPort.startsWith("/") || rawPort.startsWith("\\\\"))) {
      app.listen(rawPort, () => {
        console.log(`[Hostinger] Servidor Node.js escuchando en socket: ${rawPort}`);
      });
    } else {
      const portNum = Number(rawPort);
      app.listen(portNum, "0.0.0.0", () => {
        console.log(`[Hostinger] Servidor Node.js escuchando en 0.0.0.0:${portNum}`);
      });
    }
  }
}
if (!process.env.VERCEL) {
  startDevServer().catch((err) => {
    console.error("[Backend] Error fatal al iniciar servidor:", err);
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EXTERNAL_API_URL,
  app,
  startDevServer
});
//# sourceMappingURL=server.cjs.map
