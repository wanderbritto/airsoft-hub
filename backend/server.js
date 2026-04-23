const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Banco de dados
const db = new Database('./database/airsoft.db');

// Criar tabelas
db.exec(`
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
  );

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
  );

  CREATE TABLE IF NOT EXISTS inscricoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    jogo_id INTEGER,
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY(jogo_id) REFERENCES jogos(id)
  );

  CREATE TABLE IF NOT EXISTS operadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    campo TEXT NOT NULL,
    permissao TEXT DEFAULT 'campo',
    status TEXT DEFAULT 'pendente',
    data_convite TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ Banco de dados inicializado');

// Inserir jogos exemplo se não houver nenhum
const count = db.prepare('SELECT COUNT(*) as total FROM jogos').get();
if (count.total === 0) {
  const insert = db.prepare(`INSERT INTO jogos 
    (titulo, data, horario, localizacao, descricao, vagas, vagas_ocupadas, campo, tipo, regras, equipamentos, valor, criado_por) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const jogosExemplo = [
    ['OPERAÇÃO TROVÃO', '2025-01-20', '19:00', 'Arena Sul', 'Jogo noturno especial', 30, 0, 'Arena Sul', 'Mata-Mata', '• 3 vidas por jogador\n• Proibido tirar máscara', 'Óculos, máscara, lanterna', 'R$ 45,00', 1],
    ['CAPTURA NA MONTANHA', '2025-01-22', '14:00', 'Campo Montanha', 'Modo captura da bandeira', 25, 0, 'Campo Montanha', 'Captura da Bandeira', '• Capture a bandeira inimiga\n• Revive permitido', 'Rádio, colete tático', 'R$ 50,00', 1],
    ['RESGATE NA FLORESTA', '2025-01-28', '09:00', 'Floresta Negra', 'Modo resgate de reféns', 40, 0, 'Floresta Negra', 'Resgate de Reféns', '• Resgate os reféns em 40min', 'Kit médico, algemas', 'R$ 40,00', 1]
  ];
  
  for (const jogo of jogosExemplo) {
    insert.run(jogo);
  }
  console.log('✅ Jogos de exemplo inseridos');
}

// ========== ROTAS ==========

// Cadastro
app.post('/api/cadastro', (req, res) => {
  const { nome, data_nascimento, telefone, endereco, nome_equipe, email, senha } = req.body;
  
  try {
    const stmt = db.prepare(`INSERT INTO usuarios 
      (nome, data_nascimento, telefone, endereco, nome_equipe, email, senha, is_admin) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)`);
    const result = stmt.run(nome, data_nascimento, telefone, endereco, nome_equipe, email, senha);
    res.json({ sucesso: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ erro: 'Email já cadastrado' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  
  const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ? AND senha = ?');
  const usuario = stmt.get(email, senha);
  
  if (usuario) {
    res.json({ sucesso: true, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, is_admin: usuario.is_admin } });
  } else {
    res.status(401).json({ erro: 'Email ou senha inválidos' });
  }
});

// Listar jogos disponíveis
app.get('/api/jogos', (req, res) => {
  const stmt = db.prepare(`SELECT * FROM jogos WHERE vagas > vagas_ocupadas AND data >= date('now') ORDER BY data ASC`);
  const jogos = stmt.all();
  res.json(jogos);
});

// Próximos jogos
app.get('/api/proximos-jogos', (req, res) => {
  const stmt = db.prepare(`SELECT * FROM jogos WHERE data >= date('now') ORDER BY data ASC LIMIT 3`);
  const jogos = stmt.all();
  res.json(jogos);
});

// Últimos jogos
app.get('/api/ultimos-jogos', (req, res) => {
  const stmt = db.prepare(`SELECT * FROM jogos WHERE data < date('now') ORDER BY data DESC LIMIT 3`);
  const jogos = stmt.all();
  res.json(jogos);
});

// Inscrever
app.post('/api/inscrever', (req, res) => {
  const { usuario_id, jogo_id } = req.body;
  
  try {
    const checkStmt = db.prepare('SELECT * FROM inscricoes WHERE usuario_id = ? AND jogo_id = ?');
    const exists = checkStmt.get(usuario_id, jogo_id);
    
    if (exists) {
      return res.status(400).json({ erro: 'Você já está inscrito neste jogo' });
    }
    
    const insertStmt = db.prepare('INSERT INTO inscricoes (usuario_id, jogo_id) VALUES (?, ?)');
    insertStmt.run(usuario_id, jogo_id);
    
    const updateStmt = db.prepare('UPDATE jogos SET vagas_ocupadas = vagas_ocupadas + 1 WHERE id = ?');
    updateStmt.run(jogo_id);
    
    res.json({ sucesso: true });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao inscrever' });
  }
});

// Minhas inscrições
app.get('/api/minhas-inscricoes/:usuario_id', (req, res) => {
  const stmt = db.prepare(`
    SELECT j.*, i.data_inscricao 
    FROM inscricoes i 
    JOIN jogos j ON i.jogo_id = j.id 
    WHERE i.usuario_id = ? 
    ORDER BY j.data ASC
  `);
  const inscricoes = stmt.all(req.params.usuario_id);
  res.json(inscricoes);
});

// ========== ROTAS ADMIN ==========

// Criar jogo
app.post('/api/admin/criar-jogo', (req, res) => {
  const { titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, criado_por } = req.body;
  
  try {
    const stmt = db.prepare(`INSERT INTO jogos 
      (titulo, campo, data, horario, tipo, regras, equipamentos, vagas, vagas_ocupadas, valor, criado_por, localizacao) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`);
    const result = stmt.run(titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, criado_por, campo);
    res.json({ sucesso: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Editar jogo
app.put('/api/admin/editar-jogo/:id', (req, res) => {
  const { titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, descricao, localizacao } = req.body;
  const jogoId = req.params.id;
  
  try {
    const stmt = db.prepare(`UPDATE jogos SET 
      titulo = ?, campo = ?, data = ?, horario = ?, tipo = ?, regras = ?, equipamentos = ?, vagas = ?, valor = ?, descricao = ?, localizacao = ?
      WHERE id = ?`);
    stmt.run(titulo, campo, data, horario, tipo, regras, equipamentos, vagas, valor, descricao, localizacao, jogoId);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Listar todos os jogos (admin)
app.get('/api/admin/jogos', (req, res) => {
  const stmt = db.prepare('SELECT * FROM jogos ORDER BY data DESC');
  const jogos = stmt.all();
  res.json(jogos);
});

// Deletar jogo
app.delete('/api/admin/deletar-jogo/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM jogos WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Estatísticas
app.get('/api/admin/estatisticas', (req, res) => {
  const totalJogos = db.prepare('SELECT COUNT(*) as total FROM jogos').get();
  const totalJogadores = db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
  const totalCampos = db.prepare('SELECT COUNT(DISTINCT campo) as total FROM jogos WHERE campo IS NOT NULL').get();
  const proximosJogos = db.prepare('SELECT COUNT(*) as total FROM jogos WHERE data >= date("now")').get();
  
  res.json({
    totalJogos: totalJogos.total,
    totalJogadores: totalJogadores.total,
    totalCampos: totalCampos.total,
    proximosJogos: proximosJogos.total
  });
});

// Detalhes do jogo
app.get('/api/jogo/:id', (req, res) => {
  const stmt = db.prepare('SELECT * FROM jogos WHERE id = ?');
  const jogo = stmt.get(req.params.id);
  
  if (jogo) {
    res.json(jogo);
  } else {
    res.status(404).json({ erro: 'Jogo não encontrado' });
  }
});

// Promover usuário a admin
app.post('/api/admin/promover', (req, res) => {
  const { email } = req.body;
  
  try {
    const stmt = db.prepare('UPDATE usuarios SET is_admin = 1 WHERE email = ?');
    const result = stmt.run(email);
    
    if (result.changes === 0) {
      res.status(404).json({ erro: 'Usuário não encontrado' });
    } else {
      res.json({ sucesso: true });
    }
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📧 Admin: admin@airsoft.com`);
  console.log(`🔑 Senha: admin123`);
  console.log(`✅ Database: SQLite com better-sqlite3\n`);
});