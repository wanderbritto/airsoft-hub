// Arquivo principal para deploy
const { exec } = require('child_process');

console.log('🚀 Iniciando servidor Airsoft Hub...');
console.log('📂 Diretório atual:', __dirname);

// Executar o servidor principal
require('./backend/server.js');