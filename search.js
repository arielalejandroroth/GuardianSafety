import fs from 'fs';
import https from 'https';

const url = 'https://logosandtypes.com/wp-content/uploads/2021/01/Minerva-Foods.png'; // maybe? Let's use duckduckgo image search for mercobeef.

async function run() {
    try {
        const query = 'mercobeef+logo';
        const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
        https.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => console.log(data.slice(0, 5000)));
        });
    } catch(e) { console.error(e) }
}
run();
