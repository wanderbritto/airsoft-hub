const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

// Adicionar coluna is_admin se não existir
db.run(`ALTER TABLE usuarios ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate')) {
        console.log('⚠️ Coluna pode já existir ou erro:', err.message);
    } else {
        console.log('✅ Coluna is_admin adicionada/verificada');
    }
    
    // Agora criar o admin
    db.run(`INSERT OR REPLACE INTO usuarios (nome, email, senha, is_admin) 
            VALUES ('Administrador', 'admin@airsoft.com', 'admin123', 1)`, 
        function(err) {
            if (err) {
                console.log('❌ Erro ao criar admin:', err.message);
            } else {
                console.log('✅ ADMIN CRIADO COM SUCESSO!');
                console.log('📧 Email: admin@airsoft.com');
                console.log('🔑 Senha: admin123');
            }
            db.close();
        }
    );
});