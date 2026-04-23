const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

console.log('🔧 Criando administrador...\n');

// Primeiro, garantir que a coluna is_admin existe
db.run(`ALTER TABLE usuarios ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate')) {
        console.log('⚠️', err.message);
    } else {
        console.log('✅ Coluna is_admin verificada');
    }
    
    // Verificar se admin já existe
    db.get(`SELECT * FROM usuarios WHERE email = 'admin@airsoft.com'`, [], (err, existing) => {
        if (existing) {
            console.log('📧 Admin já existe, atualizando...');
            db.run(`UPDATE usuarios SET is_admin = 1, senha = 'admin123' WHERE email = 'admin@airsoft.com'`, (err) => {
                if (err) {
                    console.log('❌ Erro ao atualizar:', err.message);
                } else {
                    console.log('✅ Admin atualizado com sucesso!');
                    console.log('\n📧 Email: admin@airsoft.com');
                    console.log('🔑 Senha: admin123');
                }
                db.close();
            });
        } else {
            console.log('➕ Criando novo admin...');
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
                        console.log('❌ Erro ao criar admin:', err.message);
                    } else {
                        console.log('\n✅ ADMIN CRIADO COM SUCESSO!');
                        console.log('='.repeat(50));
                        console.log('📧 Email: admin@airsoft.com');
                        console.log('🔑 Senha: admin123');
                        console.log('👑 Nível: Administrador Supremo');
                        console.log('='.repeat(50));
                    }
                    db.close();
                }
            );
        }
    });
});