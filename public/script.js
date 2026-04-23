let usuarioLogado = null;

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
    
    try {
        const response = await fetch('/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem('Cadastro realizado com sucesso! Faça login', 'sucesso');
            mostrarLogin();
            document.getElementById('cadastroForm').reset();
        } else {
            mostrarMensagem(data.erro || 'Erro no cadastro', 'erro');
        }
    } catch (error) {
        mostrarMensagem('Erro ao conectar com servidor', 'erro');
    }
});

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