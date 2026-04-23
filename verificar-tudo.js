const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

console.log('📋 VERIFICANDO BANCO DE DADOS\n');
console.log('='.repeat(50));

db.all(`SELECT id, nome, email, senha, is_admin FROM usuarios`, [], (err, usuarios) => {
    if (err) {
        console.log('Erro:', err.message);
    } else if (usuarios.length === 0) {
        console.log('⚠️ NENHUM USUÁRIO ENCONTRADO!');
        console.log('Você precisa cadastrar um usuário pelo site primeiro.');
    } else {
        console.log(`📊 Total de usuários: ${usuarios.length}\n`);
        usuarios.forEach(user => {
            console.log(`ID: ${user.id}`);
            console.log(`Nome: ${user.nome}`);
            console.log(`Email: ${user.email}`);
            console.log(`Senha: ${user.senha}`);
            console.log(`Admin: ${user.is_admin === 1 ? '✅ SIM' : '❌ NÃO'}`);
            console.log('-'.repeat(30));
        });
    }
    db.close();
});