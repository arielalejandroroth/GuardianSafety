// Generate base64
const minervaSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 60" width="160" height="60">
    <g transform="translate(0, 25)">
        <text font-family="'Segoe UI', 'Arial Black', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="34" fill="#333333" letter-spacing="-1.5">minerva</text>
        <text font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="bold" font-size="24" fill="#e11d48" x="2" y="24">foods</text>
    </g>
</svg>`;

const mercobeefSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 60" width="170" height="60">
    <!-- Stylized cow head -->
    <g transform="translate(100, 5) scale(0.6)" fill="#1c3f71">
        <path d="M26.4 20c-1.4-4-5-8-10.4-8S7 16 5.6 20C2 21.5 0 25 0 29c0 3.5 1.5 6 3.5 8C8 42.5 13 44 16 44s8-1.5 12.5-7c2-2 3.5-4.5 3.5-8 0-4-2-7.5-5.6-9z"/>
        <path d="M4 14l8-2L6 8zM28 14l-8-2 2-4z"/>
    </g>
    <g transform="translate(0, 35)">
        <text font-family="'Segoe UI', 'Arial Black', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="32" fill="#1c3f71" letter-spacing="-1.5">merco</text>
        <text font-family="'Segoe UI', 'Arial Black', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" fill="#1c3f71" x="94" y="6" letter-spacing="-1">beef</text>
    </g>
</svg>`;

const fs = require('fs');

const btoa = (str) => Buffer.from(str).toString('base64');

const output = `export const minervaLogoBase64 = 'data:image/svg+xml;base64,${btoa(minervaSVG)}';\n` + 
               `export const mercobeefLogoBase64 = 'data:image/svg+xml;base64,${btoa(mercobeefSVG)}';\n`;

fs.writeFileSync('logos.ts', output);
console.log('done');
