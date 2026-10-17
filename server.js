// Archivo de entrada principal para producción en Node.js (Hostinger, cPanel, Cloud)
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
require('./server.cjs');
