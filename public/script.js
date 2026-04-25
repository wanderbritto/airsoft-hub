let usuarioLogado = null;
let emailParaVerificar = null;

function mostrarCadastro() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('cadastroCard').style.display = 'block';
}

function mostrarLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('cadastroCard').style.display = 'none';
}

function mostrarMensagem(texto, tipo) {
    const msg = document.getElementById('mensagem');
    msg.textContent = texto;
    msg.className = `mensagem ${tipo}`;
    msg.style.display = 'block';
    setTimeout(() => {
        msg.style.display = 'none';
    }, 3000);
}

async function carregarInfoInicial() {
    try {
        const proximosRes = await fetch('/api/proximos-jogos');
        const proximos = await proximosRes.json();
        if (proximos.length > 0) {
            document.getElementById('proximoJogo').textContent = `${proximos[0].titulo} - ${proximos[0].data}`;
        } else {
            document.getElementById('proximoJogo').textContent = 'Nenhum jogo agendado';
        }
        
        const ultimosRes = await fetch('/api/ultimos-jogos');
        const ultimos = await ultimosRes.json();
        if (ultimos.length > 0) {
            const lista = ultimos.map(j => j.titulo).join(', ');
            document.getElementById('ultimosJogos').textContent = lista;
        } else {
            document.getElementById('ultimosJogos').textContent = 'Nenhum jogo realizado';
        }
    } catch (error) {
        console.error('Erro ao carregar informações:', error);
    }
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            mostrarMensagem(`Bem-vindo, ${data.usuario.nome}!`, 'sucesso');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            mostrarMensagem('Email ou senha incorretos', 'erro');
        }
    } catch (error) {
        mostrarMensagem('Erro ao conectar com servidor', 'erro');
    }
});

// Cadastro com verificação de email
document.getElementById('cadastroForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dados = {
        nome: document.getElementById('cadNome').value,
        data_nascimento: document.getElementById('cadDataNasc').value,
        telefone: document.getElementById('cadTelefone').value,
        endereco: document.getElementById('cadEndereco').value,
        nome_equipe: document.getElementById('cadEquipe').value || null,
        email: document.getElementById('cadEmail').value,
        senha: document.getElementById('cadSenha').value
    };
    
    // Validar senha (mínimo 6 caracteres)
    if (dados.senha.length < 6) {
        mostrarMensagem('A senha deve ter no mínimo 6 caracteres', 'erro');
        return;
    }
    
    try {
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.precisaVerificar) {
                // Abrir modal de verificação
                emailParaVerificar = data.email;
                document.getElementById('verificarEmail').textContent = data.email;
                document.getElementById('verificarModal').classList.add('active');
                mostrarMensagem('Código de verificação enviado para seu email!', 'sucesso');
            } else {
                mostrarMensagem('Cadastro realizado com sucesso! Faça login', 'sucesso');
                mostrarLogin();
                document.getElementById('cadastroForm').reset();
            }
        } else {
            mostrarMensagem(data.erro || 'Erro no cadastro', 'erro');
        }
    } catch (error) {
        mostrarMensagem('Erro ao conectar com servidor', 'erro');
    }
});

// Função para confirmar verificação
async function confirmarVerificacao() {
    const codigo = document.getElementById('codigoVerificacao').value;
    
    if (!codigo || codigo.length !== 6) {
        mostrarMensagem('Digite o código de 6 dígitos', 'erro');
        return;
    }
    
    try {
        const response = await fetch('/api/verificar-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailParaVerificar, codigo: codigo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem('✅ Email verificado! Agora você pode fazer login.', 'sucesso');
            fecharModalVerificacao();
            mostrarLogin();
            document.getElementById('cadastroForm').reset();
            document.getElementById('codigoVerificacao').value = '';
        } else {
            mostrarMensagem(data.erro || 'Código inválido ou expirado', 'erro');
        }
    } catch (error) {
        mostrarMensagem('Erro ao verificar código', 'erro');
    }
}

// Função para reenviar código
async function reenviarCodigo() {
    if (!emailParaVerificar) return;
    
    try {
        const response = await fetch('/api/reenviar-codigo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailParaVerificar })
        });
        
        if (response.ok) {
            mostrarMensagem('Novo código enviado para seu email!', 'sucesso');
        } else {
            mostrarMensagem('Erro ao reenviar código', 'erro');
        }
    } catch (error) {
        mostrarMensagem('Erro ao reenviar', 'erro');
    }
}

function fecharModalVerificacao() {
    document.getElementById('verificarModal').classList.remove('active');
    emailParaVerificar = null;
    document.getElementById('codigoVerificacao').value = '';
}

function verificarLogin() {
    const usuario = localStorage.getItem('usuario');
    if (usuario && window.location.pathname.includes('dashboard.html')) {
        // Já está logado no dashboard
    } else if (usuario && !window.location.pathname.includes('dashboard.html') && !window.location.pathname.includes('admin.html')) {
        window.location.href = '/dashboard.html';
    }
}

carregarInfoInicial();
verificarLogin();