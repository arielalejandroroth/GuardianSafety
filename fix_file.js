import fs from 'fs';
const text = fs.readFileSync('services/geminiServiceServer.ts', 'utf8');
const fixed = text.replace(/throw new Error\("La IA no pudo procesar el mapa de riesgos\. Intente con una imagen m.*?export const analyzeEvacuationRoutes = async \(/s, 'throw new Error("La IA no pudo procesar el mapa de riesgos. Intente con una imagen más clara.");\n        }\n    } catch (error) {\n        console.error(error);\n        throw new Error("Error al generar mapa de riesgos.");\n    }\n};\n\nexport const analyzeEvacuationRoutes = async (');
fs.writeFileSync('services/geminiServiceServer.ts', fixed);
