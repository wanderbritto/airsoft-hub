const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/airsoft.db');

// Primeiro, verificar se a coluna is_admin existe
db.run(`ALTER TABLE usuarios ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate')) {
        console.log('⚠️ Erro ao adicionar coluna:', err.message);
    } else {
        console.log('✅ Coluna is_admin verificada');
    }
    
    // Inserir admin com TODOS os campos obrigatórios
    db.run(`INSERT OR REPLACE INTO usuarios 
            (nome, data_nascimento, telefone, endereco, nome_equipe, email, senha, is_admin) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            'Comandante Supremo',  // nome
            '1990-01-01',          // data_nascimento
            '(11) 99999-9999',     // telefone
            'Quartel General',     // endereco
            'High Command',        // nome_equipe
            'admin@airsoft.com',   // email
            'admin123',            // senha
            1                      // is_admin
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
});