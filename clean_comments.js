const fs = require('fs');

const files = [
    'src/app.ts',
    'src/pages/collection/collection-page.ts',
    'src/pages/catalog/catalog-page.ts',
    'src/pages/dashboard/dashboard-page.ts',
    'src/pages/profile/profile-page.ts',
    'src/pages/login/login-page.ts',
    'src/services/auth.service.ts',
    'src/services/wishlist.service.ts',
    'src/services/binder.service.ts',
    'src/services/carta.service.ts',
    'src/services/colecao.service.ts',
    'src/models/colecao.model.ts',
    'src/models/binder.model.ts',
    'src/models/carta.model.ts',
    'src/models/wishlist.model.ts',
    'src/models/usuario.model.ts',
    'src/pages/page.ts'
];

// Regras para remover comentários:
// - Comentários que são apenas // src/...
// - Comentários óbvios como // Elementos do DOM principais, // Limpa a página anterior
// Vamos usar um filtro que checa substrings ou regex.

const uselessPatterns = [
    /^\s*\/\/\s*src\/.*$/gm,
    /^\s*\/\/\s*Elementos do DOM principais\s*$/gm,
    /^\s*\/\/\s*Limpa a página anterior se houver\s*$/gm,
    /^\s*\/\/\s*Executa rota inicial\s*$/gm,
    /^\s*\/\/\s*Se o usuário não está autenticado, abre a Pokedex e exibe o login\s*$/gm,
    /^\s*\/\/\s*Redireciona para login\s*$/gm,
    /^\s*\/\/\s*Se logado e tentar ir pro login, manda pro dashboard\s*$/gm,
    /^\s*\/\/\s*Atualizar o nome do usuário na navbar\s*$/gm,
    /^\s*\/\/\s*Atualiza barra de navegação ativa do painel\s*$/gm,
    /^\s*\/\/\s*Pequeno delay para animação de fechar antes de redefinir rota\s*$/gm,
    /^\s*\/\/\s*limpa estados residuais\s*$/gm,
    /^\s*\/\/\s*Se já está logado, garante a abertura visual e rotas protegidas\s*$/gm,
    /^\s*\/\/\s*Se não logado, garante fechado\s*$/gm,
    /^\s*\/\/\s*Estado da tela\s*$/gm,
    /^\s*\/\/\s*Dados cacheados\s*$/gm,
    /^\s*\/\/\s*Estado do Binder selecionado\s*$/gm,
    /^\s*\/\/\s*Shows loader\s*$/gm,
    /^\s*\/\/\s*Tab switching\s*$/gm,
    /^\s*\/\/\s*Inputs\s*$/gm,
    /^\s*\/\/\s*Set focus back\s*$/gm,
    /^\s*\/\/\s*Deletions\s*$/gm,
    /^\s*\/\/\s*Binder interaction\s*$/gm,
    /^\s*\/\/\s*Filtros de busca\s*$/gm,
    /^\s*\/\/\s*Mostra o spinner\s*$/gm,
    /^\s*\/\/\s*Desenha as cartas\s*$/gm,
    /^\s*\/\/\s*Reset to first page on new search\s*$/gm,
    /^\s*\/\/\s*Atrela o evento de clique em cada card desenhado para abrir o Modal\s*$/gm,
    /^\s*\/\/\s*Restaura o botão caso dê erro\s*$/gm,
    /^\s*\/\/\s*Buscas paralelas para otimizar\s*$/gm,
    /^\s*\/\/\s*Métricas\s*$/gm,
    /^\s*\/\/\s*As cartas na wishlist\s*$/gm,
    /^\s*\/\/\s*Montar thumbnails sobrepostas para cada pasta\s*$/gm,
    /^\s*\/\/\s*Coleta as imagens correspondentes aos cartões no binder\s*$/gm,
    /^\s*\/\/\s*Base de 9 slots\s*$/gm,
    /^\s*\/\/\s*Implementação padrão vazia, pode ser sobrescrita pelas classes filhas\s*$/gm,
    /^\s*\/\/\s*Envio de formulário de atualização de perfil\s*$/gm,
    /^\s*\/\/\s*Exclusão de conta\s*$/gm,
    /^\s*\/\/\s*Re-renderiza para mostrar o feedback\s*$/gm,
    /^\s*\/\/\s*Limpa o feedback depois de 4 segundos\s*$/gm,
    /^\s*\/\/\s*Remove após 1\.5s\s*$/gm,
    /^\s*\/\/\s*Deixa o vermelho piscando se for tela de login por padrão, desliga outros\s*$/gm
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let oldContent = content;
        for (const pattern of uselessPatterns) {
            content = content.replace(pattern, '');
        }
        
        // Remove excessive empty lines that might have been left
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        if (oldContent !== content) {
            fs.writeFileSync(file, content);
            console.log(`Cleaned comments in ${file}`);
        }
    }
}
