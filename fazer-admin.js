const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

// Email que será promovido a ADMIN
const emailAdmin = 'admin@airsoft.com';

console.log('🔧 Verificando e criando administrador...\n');

// Primeiro, verificar se o admin já existe
db.get(`SELECT * FROM usuarios WHERE email = ?`, [emailAdmin], (err, usuario) => {
    if (err) {
        console.log('❌ Erro:', err.message);
        db.close();
        return;
    }
    
    if (usuario) {
        // Se existe, apenas promover a admin
        db.run(`UPDATE usuarios SET is_admin = 1 WHERE email = ?`, [emailAdmin], (err) => {
            if (err) {
                console.log('❌ Erro ao promover:', err.message);
            } else {
                console.log('✅ Usuário PROMOVIDO a ADMIN!');
                console.log('📧 Email:', emailAdmin);
                console.log('🔑 Use a senha que você cadastrou');
            }
            db.close();
        });
    } else {
        // Se não existe, criar novo admin
        console.log('📧 Admin não encontrado, criando novo...');
        db.run(`INSERT INTO usuarios 
                (nome, data_nascimento, telefone, endereco, nome_equipe, email, senha, is_admin) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Comandante Supremo',
                '1990-01-01',
                '(11) 99999-9999',
                'Quartel General',
                'Comando Central',
                'admin@airsoft.com',
                'admin123',
                1
            ],
            function(err) {
                if (err) {
                    console.log('❌ Erro ao criar:', err.message);
                } else {
                    console.log('\n✅ ADMIN CRIADO COM SUCESSO!');
                    console.log('='.repeat(50));
                    console.log('📧 Email: admin@airsoft.com');
                    console.log('🔑 Senha: admin123');
                    console.log('='.repeat(50));
                }
                db.close();
            }
        );
    }
});