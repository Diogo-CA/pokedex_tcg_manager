
import { Page } from '../page.js';
import { ColecaoService } from '../../services/colecao.service.js';
import { BinderService } from '../../services/binder.service.js';
import { WishListService } from '../../services/wishlist.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { CartaColecao } from '../../models/colecao.model.js';
import type { Binder } from '../../models/binder.model.js';
import type { WishList } from '../../models/wishlist.model.js';

export class DashboardPage extends Page {
    private colecaoService: ColecaoService;
    private binderService: BinderService;
    private wishlistService: WishListService;
    private authService: AuthService;

    constructor(
        colecaoService: ColecaoService, 
        binderService: BinderService, 
        wishlistService: WishListService,
        authService: AuthService
    ) {
        super();
        this.colecaoService = colecaoService;
        this.binderService = binderService;
        this.wishlistService = wishlistService;
        this.authService = authService;
    }

    public getTemplate(): string {
        return `
            <div id="dashboard-async-container" class="animate-fade container pt-2 h-100 d-flex flex-column justify-content-center align-items-center">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-3 text-secondary">Sincronizando com o SIdex...</p>
            </div>
        `;
    }

    public async init(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;
        
        try {

            const [colecao, binders, wishlist] = await Promise.all([
                this.colecaoService.buscarPorUsuario(user.id),
                this.binderService.listarPorUsuario(user.id),
                this.wishlistService.listarPorUsuario(user.id)
            ]);

            this.renderData(user.nome || "", colecao, binders, wishlist);
        } catch (error) {
            console.error('Erro ao carregar o dashboard:', error);
            const container = document.getElementById('dashboard-async-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger w-100 text-center">
                        <i class="bi bi-exclamation-triangle-fill fs-4 d-block mb-2"></i>
                        Não foi possível conectar ao servidor. Verifique se o Tomcat está rodando em localhost:8080.
                    </div>
                `;
                container.classList.remove('justify-content-center');
            }
        }
    }

    private renderData(userNome: string, colecao: CartaColecao[], binders: Binder[], wishlist: WishList[]): void {
        const container = document.getElementById('dashboard-async-container');
        if (!container) return;
        
        container.classList.remove('justify-content-center', 'align-items-center', 'h-100');
        
        // 1. Métricas
        const totalCards = colecao.length;

        const uniqueWishlist = wishlist.length;

        // 3. Montar thumbnails sobrepostas para cada pasta
        const foldersWithDetails = binders.slice(0, 3).map(f => {
            const folderCardImages: string[] = [];

            if (f.cartasDoBinder) {
                f.cartasDoBinder.slice(0, 4).forEach(cartaColecao => {
                    if (cartaColecao.cartaBase && cartaColecao.cartaBase.imagem) {
                        folderCardImages.push(cartaColecao.cartaBase.imagem);
                    }
                });
            }
            return {
                ...f,
                images: folderCardImages
            };
        });

        container.innerHTML = /*html*/`
            <!-- Cabeçalho de Boas-vindas Moderno -->
            <div class="mb-4">
                <h3 class="text-dark mb-1">Olá, ${userNome}!</h3>
                <p class="text-secondary m-0" style="font-size: 0.95rem;">
                    Sua jornada no SIdex continua — você possui <strong class="text-danger">${totalCards}</strong> cartas em sua coleção.
                </p>
            </div>

            <!-- Painel de Métricas de 3 Cards (Atividade Recente removido) -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="clean-card d-flex align-items-center py-3">
                        <div class="fs-2 text-primary me-3 ps-2"><i class="bi bi-collection"></i></div>
                        <div>
                            <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">COLEÇÃO</h6>
                            <h4 class="text-dark m-0 font-weight-bold">${totalCards}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="clean-card d-flex align-items-center py-3">
                        <div class="fs-2 text-danger me-3 ps-2"><i class="bi bi-heart-fill"></i></div>
                        <div>
                            <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">WISHLIST</h6>
                            <h4 class="text-dark m-0 font-weight-bold">${uniqueWishlist}</h4>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="clean-card d-flex align-items-center py-3">
                        <div class="fs-2 text-success me-3 ps-2"><i class="bi bi-folder2-open"></i></div>
                        <div>
                            <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">BINDERS</h6>
                            <h4 class="text-dark m-0 font-weight-bold">${binders.length}</h4>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <!-- Coluna: Binders -->
                <div class="col-md-6 d-flex flex-column gap-4">
                    <div class="clean-card flex-grow-1">
                        <div class="clean-card-header mb-3 border-bottom pb-2">
                            <h5 class="text-dark m-0" style="font-size: 0.95rem;"><i class="bi bi-journal-bookmark text-success"></i> Meus Binders</h5>
                            <a href="#/folders" class="text-danger text-decoration-none" style="font-size: 0.8rem; font-weight: normal;">Ver todos <i class="bi bi-arrow-right"></i></a>
                        </div>

                        ${foldersWithDetails.length === 0 ? `
                            <div class="text-center py-4 text-secondary" style="font-size: 0.82rem;">
                                Nenhum binder criado. Comece na aba Binders!
                            </div>
                        ` : `
                            <div class="d-flex flex-column gap-3">
                                ${foldersWithDetails.map(f => {
                                    const totalInFolder = f.cartasDoBinder ? f.cartasDoBinder.length : 0;
                                    const progressPercent = Math.min(100, Math.round((totalInFolder / 9) * 100)); // Base de 9 slots
                                    return `
                                        <div class="p-2.5 bg-light-gray border border-light-gray rounded-3 d-flex justify-content-between align-items-center">
                                            <div>
                                                <div class="fw-bold text-dark mb-1" style="font-size: 0.85rem;">${f.nome}</div>
                                                <div class="text-secondary mb-2" style="font-size: 0.75rem;">${totalInFolder} / 9 cartas organizadas</div>
                                                <!-- Barra de Progresso Simples -->
                                                <div style="width: 140px; height: 5px; background: #e1e4e8; border-radius: 3px; overflow:hidden;">
                                                    <div style="width: ${progressPercent}%; height: 100%; background: #28a745; border-radius: 3px;"></div>
                                                </div>
                                            </div>
                                            <!-- Miniatures -->
                                            <div class="binder-thumbnails pe-1">
                                                ${f.images.length === 0 ? `
                                                    <div class="text-secondary opacity-50" style="font-size: 0.7rem;"><i class="bi bi-inbox fs-4"></i></div>
                                                ` : f.images.map(img => `
                                                    <img src="${img}" class="binder-thumbnail-img border-0" alt="Card preview">
                                                `).join('')}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <!-- Coluna: Wishlist Recente -->
                <div class="col-md-6 d-flex flex-column gap-4">
                    <div class="clean-card flex-grow-1">
                        <div class="clean-card-header mb-3 border-bottom pb-2">
                            <h5 class="text-dark m-0" style="font-size: 0.95rem;"><i class="bi bi-heart text-danger"></i> Wishlist</h5>
                            <a href="#/collection" class="text-danger text-decoration-none" style="font-size: 0.8rem; font-weight: normal;">Ver tudo <i class="bi bi-arrow-right"></i></a>
                        </div>

                        ${wishlist.length === 0 ? `
                            <div class="text-center py-4 text-secondary" style="font-size: 0.82rem;">
                                Sua wishlist está vazia. Adicione cartas pelo Catálogo!
                            </div>
                        ` : `
                            <div class="d-flex flex-column gap-2">
                                ${wishlist.slice(0, 4).map(w => `
                                    <div class="d-flex align-items-center p-2 border border-light-gray rounded-3 bg-light-gray">
                                        <img src="${w.cartaDesejada?.imagem || ''}" alt="${w.cartaDesejada?.nome || 'Carta'}" class="rounded me-3 border" style="width: 40px; height: 55px; object-fit: cover;">
                                        <div class="flex-grow-1">
                                            <div class="fw-bold text-dark" style="font-size: 0.85rem;">${w.cartaDesejada?.nome || 'Desconhecida'}</div>
                                            <div class="text-secondary" style="font-size: 0.75rem;">Condição Desejada: ${w.condicaoDesejada}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
}
