import fs from 'fs';

let content = fs.readFileSync('services/geminiServiceServer.ts', 'utf8');

// Fix generateRiskAssessment signature and url usage
content = content.replace(
  /export const generateRiskAssessment = async \(mediaArray: Attachment\[\], userPrompt: string = ""\): Promise<\{ riskItems: RiskItem\[\]; artClassification\?: ArtClassification \}> => \{/g,
  'export const generateRiskAssessment = async (mediaArray: any[], userPrompt: string = ""): Promise<{ riskItems: RiskItem[]; artClassification?: ArtClassification }> => {'
);
content = content.replace(
  /return parsedJson as RiskItem\[\];/g,
  'return { riskItems: parsedJson as RiskItem[] };'
);

content = content.replace(
  /return parsedJson\[key\] as RiskItem\[\];/g,
  'return { riskItems: parsedJson[key] as RiskItem[] };'
);

// Fix getEPPAdvice
content = content.replace(/export const getEPPAdvice = async \(ppeItems: string\[\]\): Promise<string> => \{[\s\S]*?throw new Error\("La API no devolvió ninguna imagen\."\);[\s\S]*?\}/g, 
`export const getEPPAdvice = async (ppeItems: { item: string, status: 'good' | 'bad' | 'missing', note: string }[]): Promise<string> => {
    const systemInstruction = \`
    Eres un experto en Salud y Seguridad Ocupacional con 25 años de experiencia.
    Tu tarea es proporcionar un breve resumen o recomendación basándose en el estado de los Elementos de Protección Personal (EPP).
    \`;
    const prompt = \`Analiza el estado de los EPP y da recomendaciones: \${JSON.stringify(ppeItems)}\`;

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
}`);

fs.writeFileSync('services/geminiServiceServer.ts', content);
