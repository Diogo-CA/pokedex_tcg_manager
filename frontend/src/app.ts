
import { AuthService } from './services/auth.service.js';
import { CartaService } from './services/carta.service.js';
import { ColecaoService } from './services/colecao.service.js';
import { BinderService } from './services/binder.service.js';
import { WishListService } from './services/wishlist.service.js';

import { Page } from './pages/page.js';
import { LoginPage } from './pages/login/login-page.js';
import { DashboardPage } from './pages/dashboard/dashboard-page.js';
import { CatalogPage } from './pages/catalog/catalog-page.js';
import { CollectionPage } from './pages/collection/collection-page.js';
import { ProfilePage } from './pages/profile/profile-page.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Inicialização dos Serviços ---
    const auth = new AuthService();
    const cartaService = new CartaService();
    const colecaoService = new ColecaoService();
    const binderService = new BinderService();
    const wishListService = new WishListService();

    const scene = document.getElementById('pokedex-scene');
    const device = document.getElementById('pokedex-device');
    const lid = document.getElementById('pokedex-lid');
    const pokedexScreen = document.getElementById('pokedex-screen');
    const mainLayout = document.getElementById('main-layout');
    const dashboardContent = document.getElementById('dashboard-content');
    const miniStatusScreen = document.getElementById('mini-status-screen');
    const btnLogout = document.getElementById('btn-logout');

    let currentPage: Page | null = null;

    // --- 2. Lógica de Animação 3D Física da Pokédex ---
    if (lid && device) {
        lid.addEventListener('click', () => {

            if (!auth.isAuthenticated()) {
                lid.classList.remove('is-closed');
                device.classList.remove('is-closed');
                lid.style.cursor = 'default';

                window.location.hash = '#/login';
            }
        });
    }

    // --- 3. Roteador Single Page Application (SPA) ---
    const router = async () => {
        const hash = window.location.hash || '#/login';

        if (currentPage) {
            currentPage.destroy();
            currentPage = null;
        }

        // --- Guarda de Rotas (AuthGuard) ---
        const isAuthRoute = hash !== '#/login' && hash !== '#/register';
        const isUserAuthenticated = auth.isAuthenticated();

        if (isAuthRoute && !isUserAuthenticated) {
            // Se tentar acessar área restrita sem login, mostra a Pokedex e manda pro login
            if (scene && mainLayout) {
                scene.style.display = 'flex';
                mainLayout.style.display = 'none';
                document.body.style.backgroundImage = "url('../assets/images/kanto_map.jpeg')";
                
                if (device && lid) {
                    device.classList.add('is-closed');
                    lid.classList.add('is-closed');
                    lid.style.cursor = 'pointer';
                }
            }
            window.location.hash = '#/login';
            return;
        }

        if (!isAuthRoute && isUserAuthenticated) {

            window.location.hash = '#/dashboard';
            return;
        }

        // --- Gerenciamento Visual de Estado (Layout Duplo ou Simples) ---
        if (isUserAuthenticated) {
            // Usuário logado: Esconde a pokedex, mostra layout clean
            if (scene && mainLayout) {
                scene.style.display = 'none';
                mainLayout.style.display = 'flex';
                document.body.style.backgroundImage = 'none';
                document.body.style.backgroundColor = '#f6f8fa';
            }

            const user = auth.getCurrentUser();
            const navUserName = document.getElementById('nav-user-name');
            if (navUserName && user) {
                navUserName.textContent = user.nome || null;
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

            updateActiveNavTab(hash);
        } else {
            // Usuário não logado: Mostra apenas a Pokedex centralizada na tela
            if (scene && mainLayout) {
                scene.style.display = 'flex';
                mainLayout.style.display = 'none';
                document.body.style.backgroundImage = "linear-gradient(rgba(13, 15, 18, 0.82), rgba(13, 15, 18, 0.82)), url('../assets/images/kanto_map.jpeg')";
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
                    const dashboardPage = new DashboardPage(colecaoService, binderService, wishListService, auth);
                    dashboardContent.innerHTML = dashboardPage.getTemplate();
                    await dashboardPage.init();
                    currentPage = dashboardPage;
                    updateMiniScreen('MODO: DASHBOARD');
                }
                break;

            case '#/catalog':
                if (dashboardContent) {
                    const catalogPage = new CatalogPage(cartaService, colecaoService, wishListService, auth);
                    dashboardContent.innerHTML = catalogPage.getTemplate();
                    await catalogPage.init();
                    currentPage = catalogPage;
                    updateMiniScreen('MODO: CATALOGO');
                }
                break;

            case '#/collection':
                if (dashboardContent) {
                    const collectionPage = new CollectionPage(colecaoService, binderService, wishListService, auth, 'collection');
                    dashboardContent.innerHTML = collectionPage.getTemplate();
                    await collectionPage.init();
                    currentPage = collectionPage;
                    updateMiniScreen('MODO: ACERVO');
                }
                break;

            case '#/folders':
                if (dashboardContent) {
                    const collectionPage = new CollectionPage(colecaoService, binderService, wishListService, auth, 'binders');
                    dashboardContent.innerHTML = collectionPage.getTemplate();
                    await collectionPage.init();
                    currentPage = collectionPage;
                    updateMiniScreen('MODO: BINDERS');
                }
                break;

            case '#/profile':
                if (dashboardContent) {
                    const profilePage = new ProfilePage(auth);
                    dashboardContent.innerHTML = profilePage.getTemplate();
                    await profilePage.init();
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

            setTimeout(() => {
                window.location.hash = '#/login';
                window.location.reload(); // limpa estados residuais
            }, 800);
        });
    }

    // --- 5. Inicialização da Sessão Ativa ao atualizar a página ---
    if (auth.isAuthenticated()) {

        if (device && lid && scene) {
            device.classList.remove('is-closed');
            lid.classList.remove('is-closed');
            scene.classList.add('authenticated');
            lid.style.cursor = 'default';
        }
    } else {

        if (device && lid) {
            device.classList.add('is-closed');
            lid.classList.add('is-closed');
            lid.style.cursor = 'pointer';
        }
    }

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