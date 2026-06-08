import fs from 'fs';

let content = fs.readFileSync('services/geminiServiceServer.ts', 'utf8');

// The pattern to replace ai!.models... and ai.models... with getAI().models...
// But wait, there are places where we check `if (!ai)`
content = content.replace(/if \(!ai\) \{[\s\S]*?throw new Error\(getDisabledApiError\(\)\);[\s\S]*?\}/g, '');
content = content.replace(/ai!/g, 'getAI()');
content = content.replace(/ai\./g, 'getAI().');

fs.writeFileSync('services/geminiServiceServer.ts', content);
