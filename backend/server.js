const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./database/airsoft.db');

// Criar tabelas (sem ALTER TABLE - tudo de uma vez)
db.serialize(() => {
  // Tabela de usuários com TODAS as colunas
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      data_nascimento TEXT NOT NULL,
      telefone TEXT NOT NULL,
      endereco TEXT NOT NULL,
      nome_equipe TEXT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) {
      console.log('Erro ao criar tabela usuarios:', err.message);
    } else {
      console.log('✅ Tabela usuarios verificada');
    }
  });

  // Tabela de jogos com TODAS as colunas
  db.run(`
    CREATE TABLE IF NOT EXISTS jogos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      data TEXT NOT NULL,
      horario TEXT NOT NULL,
      localizacao TEXT,
      descricao TEXT,
      vagas INTEGER NOT NULL,
      vagas_ocupadas INTEGER DEFAULT 0,
      campo TEXT,
      tipo TEXT,
      regras TEXT,
      equipamentos TEXT,
      valor TEXT,
      criado_por INTEGER
    )
  `, (err) => {
    if (err) {
      console.log('Erro ao criar tabela jogos:', err.message);
    } else {
      console.log('✅ Tabela jogos verificada');
    }
  });

  // Tabela de inscrições
  db.run(`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      jogo_id INTEGER,
      data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY(jogo_id) REFERENCES jogos(id)
    )
  `, (err) => {
    if (err) {
      console.log('Erro ao criar tabela inscricoes:', err.message);
    } else {
      console.log('✅ Tabela inscricoes verificada');
    }
  });

  // Tabela de operadores
  db.run(`
    CREATE TABLE IF NOT EXISTS operadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      campo TEXT NOT NULL,
      permissao TEXT DEFAULT 'campo',
      status TEXT DEFAULT 'pendente',
      data_convite TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.log('Erro ao criar tabela operadores:', err.message);
    } else {
      console.log('✅ Tabela operadores verificada');
    }
  });

  // Verificar se já existem jogos, se não, inserir exemplos
  db.get(`SELECT COUNT(*) as total FROM jogos`, [], (err, result) => {
    if (!err && result && result.total === 0) {
      const jogosExemplo = [
        ['OPERAÇÃO TROVÃO', '2025-01-20', '19:00', 'Arena Sul', 'Jogo noturno especial', 30, 0, 'Arena Sul', 'Mata-Mata', '• 3 vidas por jogador\n• Proibido tirar máscara\n• Tempo: 30 minutos', 'Óculos, máscara, lanterna', 'R$ 45,00', 1],
        ['CAPTURA NA MONTANHA', '2025-01-22', '14:00', 'Campo Montanha', 'Modo captura da bandeira', 25, 0, 'Campo Montanha', 'Captura da Bandeira', '• Capture a bandeira inimiga\n• Revive permitido (10s)\n• Time com mais capturas vence', 'Rádio, colete tático', 'R$ 50,00', 1],
        ['RESGATE NA FLORESTA', '2025-01-28', '09:00', 'Floresta Negra', 'Modo resgate de reféns', 40, 0, 'Floresta Negra', 'Resgate de Reféns', '• Resgate os reféns em 40min\n• Equipe A: Resgate\n• Equipe B: Guardas', 'Kit médico, algemas', 'R$ 40,00', 1]
      ];

      jogosExemplo.forEach(jogo => {
        db.run(`INSERT INTO jogos (titulo, data, horario, localizacao, descricao, vagas, vagas_ocupadas, campo, tipo, regras, equipamentos, valor, criado_por) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, jogo);
      });
      console.log('✅ Jogos de exemplo inseridos');
    }
  });
});

// ========== ROTAS ==========

// Cadastro
app.post('/api/cadastro', (req, res) => {
  const { nome, data_nascimento, telefone, endereco, nome_equipe, email, senha } = req.body;
  
  db.run(`INSERT INTO usuarios (nome, data_nascimento, telefone, endereco, nome_equipe, email, senha, is_admin) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [nome, data_nascimento, telefone, endereco, nome_equipe, email, senha],
    function(err) {
      if (err) {
        res.status(400).json({ erro: 'Email já cadastrado' });
      } else {
        res.json({ sucesso: true, id: this.lastID });
      }
    });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  db.get(`SELECT * FROM usuarios WHERE email = ? AND senha = ?`, [email, senha], (err, usuario) => {
    if (usuario) {
      res.json({ sucesso: true, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, is_admin: usuario.is_admin } });
    } else {
      res.status(401).json({ erro: 'Email ou senha inválidos' });
    }
  });
});

// Listar jogos disponíveis
app.get('/api/jogos', (req, res) => {
  db.all(`SELECT * FROM jogos WHERE vagas > vagas_ocupadas AND data >= date('now') ORDER BY data ASC`, [], (err, jogos) => {
    res.json(jogos || []);
  });
});

// Próximos jogos
app.get('/api/proximos-jogos', (req, res) => {
  db.all(`SELECT * FROM jogos WHERE data >= date('now') ORDER BY data ASC LIMIT 3`, [], (err, jogos) => {
    res.json(jogos || []);
  });
});

// Últimos jogos
app.get('/api/ultimos-jogos', (req, res) => {
  db.all(`SELECT * FROM jogos WHERE data < date('now') ORDER BY data DESC LIMIT 3`, [], (err, jogos) => {
    res.json(jogos || []);
  });
});

// Inscrever
app.post('/api/inscrever', (req, res) => {
  const { usuario_id, jogo_id } = req.body;
  
  db.run(`INSERT INTO inscricoes (usuario_id, jogo_id) VALUES (?, ?)`, [usuario_id, jogo_id], (err) => {
    if (err) {
      res.status(400).json({ erro: 'Você já está inscrito neste jogo' });
    } else {
      db.run(`UPDATE jogos SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?`, [jogo_id]);
      res.json({ sucesso: true });
    }
  });
});

// Minhas inscrições
app.get('/api/minhas-inscricoes/:usuario_id', (req, res) => {
  db.all(`
    SELECT j.*, i.data_inscricao 
    FROM inscricoes i 
    JOIN jogos j ON i.jogo_id = j.id 
    WHERE i.usuario_id = ? 
    ORDER BY j.data ASC
  `, [req.params.usuario_id], (err, inscricoes) => {
    res.json(inscricoes || []);
  });
});

// ========== ROTAS ADMIN ==========

// Criar jogo
app.post('/api/admin/criar-jogo', (req, res) => {
  const { titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, criado_por } = req.body;
  
  db.run(`INSERT INTO jogos (titulo, campo, data, horario, tipo, regras, equipamentos, vagas, vagas_ocupadas, valor, criado_por, localizacao) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    [titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, criado_por, campo],
    function(err) {
      if (err) {
        res.status(500).json({ erro: err.message });
      } else {
        res.json({ sucesso: true, id: this.lastID });
      }
    });
});

// Editar jogo
app.put('/api/admin/editar-jogo/:id', (req, res) => {
  const { titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, descricao, localizacao } = req.body;
  const jogoId = req.params.id;
  
  db.run(`UPDATE jogos SET 
          titulo = ?, 
          campo = ?, 
          data = ?, 
          horario = ?, 
          tipo = ?, 
          regras = ?, 
          equipamentos = ?, 
          vagas = ?, 
          valor = ?,
          descricao = ?,
          localizacao = ?
          WHERE id = ?`,
    [titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, descricao, localizacao, jogoId],
    function(err) {
      if (err) {
        res.status(500).json({ erro: err.message });
      } else {
        res.json({ sucesso: true });
      }
    });
});

// Listar todos os jogos (admin)
app.get('/api/admin/jogos', (req, res) => {
  db.all(`SELECT * FROM jogos ORDER BY data DESC`, [], (err, jogos) => {
    res.json(jogos || []);
  });
});

// Deletar jogo
app.delete('/api/admin/deletar-jogo/:id', (req, res) => {
  db.run(`DELETE FROM jogos WHERE id = ?`, [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ erro: err.message });
    } else {
      res.json({ sucesso: true });
    }
  });
});

// Estatísticas
app.get('/api/admin/estatisticas', (req, res) => {
  db.get(`SELECT COUNT(*) as totalJogos FROM jogos`, [], (err, totalJogos) => {
    db.get(`SELECT COUNT(*) as totalJogadores FROM usuarios`, [], (err, totalJogadores) => {
      db.get(`SELECT COUNT(DISTINCT campo) as totalCampos FROM jogos WHERE campo IS NOT NULL`, [], (err, totalCampos) => {
        db.get(`SELECT COUNT(*) as proximosJogos FROM jogos WHERE data >= date('now')`, [], (err, proximosJogos) => {
          res.json({
            totalJogos: totalJogos?.totalJogos || 0,
            totalJogadores: totalJogadores?.totalJogadores || 0,
            totalCampos: totalCampos?.totalCampos || 0,
            proximosJogos: proximosJogos?.proximosJogos || 0
          });
        });
      });
    });
  });
});

// Detalhes do jogo
app.get('/api/jogo/:id', (req, res) => {
  db.get(`SELECT * FROM jogos WHERE id = ?`, [req.params.id], (err, jogo) => {
    if (jogo) {
      res.json(jogo);
    } else {
      res.status(404).json({ erro: 'Jogo não encontrado' });
    }
  });
});

// Promover usuário a admin
app.post('/api/admin/promover', (req, res) => {
  const { email } = req.body;
  
  db.run(`UPDATE usuarios SET is_admin = 1 WHERE email = ?`, [email], function(err) {
    if (err) {
      res.status(500).json({ erro: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
    } else {
      res.json({ sucesso: true });
    }
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📧 Admin: admin@airsoft.com`);
  console.log(`🔑 Senha: admin123\n`);
});