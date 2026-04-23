const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

const email = 'admin@airsoft.com';
const senha = 'admin123';

console.log(`🔍 Testando login: ${email}\n`);

db.get(`SELECT * FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, user) => {
    if (err) {
        console.log('❌ Erro:', err.message);
    } else if (user) {
        console.log('✅ LOGIN FUNCIONARIA PERFEITAMENTE!');
        console.log('='.repeat(40));
        console.log(`ID: ${user.id}`);
        console.log(`Nome: ${user.nome}`);
        console.log(`Email: ${user.email}`);
        console.log(`Admin: ${user.is_admin === 1 ? 'SIM' : 'NÃO'}`);
        console.log('='.repeat(40));
    } else {
        console.log('❌ LOGIN NÃO FUNCIONARIA!');
        console.log('Usuário não encontrado ou senha incorreta.');
        
        // Mostrar usuários existentes
        db.all(`SELECT id, nome, email FROM usuarios`, [], (err, users) => {
            if (users && users.length > 0) {
                console.log('\n📋 Usuários cadastrados:');
                users.forEach(u => {
                    console.log(`   - ${u.email}`);
                });
            }
            db.close();
        });
        return;
    }
    db.close();
});