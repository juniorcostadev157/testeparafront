const fs = require('fs');
const dotenv = require('dotenv');

// Carregar as variáveis do arquivo .env
dotenv.config();

// Caminho do arquivo que contém as variáveis a serem substituídas
const filepath = './public/js/firebaseConfig.js';

// Lê o conteúdo do arquivo firebaseConfig.js
let content = fs.readFileSync(filepath, 'utf8');

// Substituir as variáveis de ambiente no arquivo
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_API_KEY/g, `"${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN/g, `"${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_PROJECT_ID/g, `"${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET/g, `"${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID/g, `"${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_APP_ID/g, `"${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}"`);
content = content.replace(/process\.env\.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID/g, `"${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}"`);

// Escreve de volta o arquivo com as variáveis substituídas
fs.writeFileSync(filepath, content, 'utf8');

console.log('Variáveis de ambiente injetadas no código frontend.');
