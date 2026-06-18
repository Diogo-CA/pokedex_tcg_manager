// src/app.ts
import { StorageService } from './services/storage.service.js';
import { AuthService } from './services/auth.service.js';
import { PokemonTcgService } from './services/pokemon.service.js';

import { Page } from './pages/page.js';
import { LoginPage } from './pages/login/login-page.js';
import { DashboardPage } from './pages/dashboard/dashboard-page.js';
import { CatalogPage } from './pages/catalog/catalog-page.js';
import { CollectionPage } from './pages/collection/collection-page.js';
import { FoldersPage } from './pages/folders/folders-page.js';
import { ProfilePage } from './pages/profile/profile-page.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Inicialização dos Serviços ---
    const storage = new StorageService();
    const auth = new AuthService(storage);
    const pokemonTcg = new PokemonTcgService();

    // Elementos do DOM principais
    const scene = document.getElementById('pokedex-scene');
    const device = document.getElementById('pokedex-device');
    const lid = document.getElementById('pokedex-lid');
    const pokedexScreen = document.getElementById('pokedex-screen');
    const dashboardContent = document.getElementById('dashboard-content');
    const miniStatusScreen = document.getElementById('mini-status-screen');
    const btnLogout = document.getElementById('btn-logout');

    let currentPage: Page | null = null;

    // --- 2. Lógica de Animação 3D Física da Pokédex ---
    if (lid && device) {
        lid.addEventListener('click', () => {
            // Se o usuário não está autenticado, abre a Pokedex e exibe o login
            if (!auth.isAuthenticated()) {
                lid.classList.remove('is-closed');
                device.classList.remove('is-closed');
                lid.style.cursor = 'default';
                
                // Redireciona para login
                window.location.hash = '#/login';
            }
        });
    }

    // --- 3. Roteador Single Page Application (SPA) ---
    const router = async () => {
        const hash = window.location.hash || '#/login';
        
        // Limpa a página anterior se houver
        if (currentPage) {
            currentPage.destroy();
            currentPage = null;
        }

        // --- Guarda de Rotas (AuthGuard) ---
        const isAuthRoute = hash !== '#/login' && hash !== '#/register';
        const isUserAuthenticated = auth.isAuthenticated();

        if (isAuthRoute && !isUserAuthenticated) {
            // Se tentar acessar área restrita sem login, fecha a Pokedex e manda pro login
            if (device && lid && scene) {
                device.classList.add('is-closed');
                lid.classList.add('is-closed');
                scene.classList.remove('authenticated');
                lid.style.cursor = 'pointer';
            }
            window.location.hash = '#/login';
            return;
        }

        if (!isAuthRoute && isUserAuthenticated) {
            // Se logado e tentar ir pro login, manda pro dashboard
            window.location.hash = '#/dashboard';
            return;
        }

        // --- Gerenciamento Visual de Estado (Layout Duplo ou Simples) ---
        if (isUserAuthenticated) {
            // Usuário logado: Pokedex à esquerda (Holo Scanner) e Dashboard à direita
            if (scene && device && lid) {
                scene.classList.add('authenticated');
                device.classList.remove('is-closed');
                lid.classList.remove('is-closed');
                lid.style.cursor = 'default';
            }

            // Garante o Standby do Scanner da Pokédex se a tela estiver com conteúdo obsoleto
            if (pokedexScreen && (pokedexScreen.querySelector('form') || pokedexScreen.innerHTML === '' || pokedexScreen.querySelector('#btn-login'))) {
                pokedexScreen.innerHTML = `
                    <div class="text-center text-secondary py-5 animate-fade">
                        <i class="bi bi-radar fs-2 mb-2 d-block opacity-25"></i>
                        Aguardando escaneamento...
                    </div>
                `;
            }

            // Atualiza barra de navegação ativa do painel
            updateActiveNavTab(hash);
        } else {
            // Usuário não logado: Apenas a Pokédex centralizada na tela
            if (scene && device) {
                scene.classList.remove('authenticated');
            }
        }

        // --- Injeção do Controlador/View correspondente ---
        switch (hash) {
            case '#/login':
            case '#/register':
                if (pokedexScreen) {
                    const loginPage = new LoginPage(auth, pokedexScreen);
                    loginPage.render();
                    currentPage = loginPage;
                    if (miniStatusScreen) {
                        miniStatusScreen.innerHTML = 'Aguardando login...';
                    }
                }
                break;

            case '#/dashboard':
                if (dashboardContent) {
                    const dashboardPage = new DashboardPage(storage, auth);
                    dashboardContent.innerHTML = dashboardPage.getTemplate();
                    dashboardPage.init();
                    currentPage = dashboardPage;
                    updateMiniScreen('MODO: DASHBOARD');
                }
                break;

            case '#/catalog':
                if (dashboardContent) {
                    const catalogPage = new CatalogPage(pokemonTcg, storage, auth);
                    dashboardContent.innerHTML = catalogPage.getTemplate();
                    await catalogPage.init();
                    currentPage = catalogPage;
                    updateMiniScreen('MODO: CATALOGO');
                }
                break;

            case '#/collection':
                if (dashboardContent) {
                    const collectionPage = new CollectionPage(storage, auth, 'collection');
                    dashboardContent.innerHTML = collectionPage.getTemplate();
                    collectionPage.init();
                    currentPage = collectionPage;
                    updateMiniScreen('MODO: ACERVO');
                }
                break;

            case '#/folders':
                if (dashboardContent) {
                    const collectionPage = new CollectionPage(storage, auth, 'binders');
                    dashboardContent.innerHTML = collectionPage.getTemplate();
                    collectionPage.init();
                    currentPage = collectionPage;
                    updateMiniScreen('MODO: BINDERS');
                }
                break;

            case '#/profile':
                if (dashboardContent) {
                    const profilePage = new ProfilePage(storage, auth);
                    dashboardContent.innerHTML = profilePage.getTemplate();
                    profilePage.init();
                    currentPage = profilePage;
                    updateMiniScreen('MODO: PERFIL');
                }
                break;

            default:
                window.location.hash = '#/dashboard';
                break;
        }
    };

    // --- 4. Eventos de Rota e Sair ---
    window.addEventListener('hashchange', router);

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.logout();
            
            // Animação de fechamento da Pokedex ao deslogar
            if (device && lid && scene) {
                device.classList.add('is-closed');
                lid.classList.add('is-closed');
                scene.classList.remove('authenticated');
                lid.style.cursor = 'pointer';
            }

            // Pequeno delay para animação de fechar antes de redefinir rota
            setTimeout(() => {
                window.location.hash = '#/login';
                window.location.reload(); // limpa estados residuais
            }, 800);
        });
    }

    // --- 5. Inicialização da Sessão Ativa ao atualizar a página ---
    if (auth.isAuthenticated()) {
        // Se já está logado, garante a abertura visual e rotas protegidas
        if (device && lid && scene) {
            device.classList.remove('is-closed');
            lid.classList.remove('is-closed');
            scene.classList.add('authenticated');
            lid.style.cursor = 'default';
        }
    } else {
        // Se não logado, garante fechado
        if (device && lid) {
            device.classList.add('is-closed');
            lid.classList.add('is-closed');
            lid.style.cursor = 'pointer';
        }
    }

    // Executa rota inicial
    router();

    // --- Funções Auxiliares ---
    function updateActiveNavTab(hash: string): void {
        const navLinks = document.querySelectorAll('#main-nav .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function updateMiniScreen(text: string): void {
        if (miniStatusScreen) {
            miniStatusScreen.innerHTML = `Sessão ativa<br>${text}`;
        }
    }
});