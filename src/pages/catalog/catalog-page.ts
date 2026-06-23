
import { Page } from '../page.js';
import { CartaService } from '../../services/carta.service.js';
import { ColecaoService } from '../../services/colecao.service.js';
import { WishListService } from '../../services/wishlist.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { Carta } from '../../models/carta.model.js';
import type { CartaColecao, CondicaoEnum } from '../../models/colecao.model.js';
import type { WishList } from '../../models/wishlist.model.js';

export class CatalogPage extends Page {
    private cartaService: CartaService;
    private colecaoService: ColecaoService;
    private wishListService: WishListService;
    private authService: AuthService;
    
    private cartas: Carta[] = [];
    private colecao: CartaColecao[] = [];
    private wishlist: WishList[] = [];
    private loading: boolean = false;
    private selectedCardForAdd: Carta | null = null;

    private searchName: string = '';
    private searchAttributeState: string | undefined;
    private searchValueState: string | undefined;
    private searchOriginState: 'tcg' | 'local' = 'tcg';
    private currentPage: number = 1;

    constructor(
        cartaService: CartaService, 
        colecaoService: ColecaoService, 
        wishListService: WishListService,
        authService: AuthService
    ) {
        super();
        this.cartaService = cartaService;
        this.colecaoService = colecaoService;
        this.wishListService = wishListService;
        this.authService = authService;
    }

    public getTemplate(): string {
        return /*html*/`
            <div id="catalog-container" class="animate-fade container pt-2 d-flex flex-column h-100">
                <div class="row g-4 flex-grow-1">
                    <div class="col-md-3">
                        <div class="clean-card h-100 position-sticky" style="top: 20px;">
                            <h5 class="text-dark mb-4 border-bottom pb-2">Pesquisa</h5>
                            
                            <div class="mb-4">
                                <label class="form-label text-secondary mb-1" style="font-size: 0.8rem;">Onde Buscar?</label>
                                <select id="search-origin" class="form-select form-select-sm mb-3">
                                    <option value="tcg">Catálogo Global (TCG)</option>
                                    <option value="local">Acervo Local (Banco)</option>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="form-label text-secondary mb-1" style="font-size: 0.8rem;">Filtrar por</label>
                                <select id="filter-attribute" class="form-select form-select-sm mb-3">
                                    <option value="nome">Nome</option>
                                    <option value="colecao">Coleção</option>
                                    <option value="raridade">Raridade</option>
                                </select>
                            </div>

                            <div class="mb-4">
                                <label class="form-label text-secondary mb-1" style="font-size: 0.8rem;">Valor da Busca</label>
                                <input type="text" id="filter-value" class="form-control form-control-sm mb-4" placeholder="Ex: Charizard">
                            </div>

                            <button id="btn-search" class="btn pokedex-btn-dark btn-sm w-100 py-2">
                                <i class="bi bi-search"></i> BUSCAR NA SIDEX
                            </button>
                        </div>
                    </div>

                    <div class="col-md-9 d-flex flex-column" id="catalog-grid-area">
                        <div class="d-flex justify-content-center align-items-center h-100 flex-column">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-3 text-secondary">Carregando catálogo do SIdex...</p>
                        </div>
                    </div>
                </div>
                </div>
                <div id="catalog-modal-wrapper"></div>
            </div>
        `;
    }

    public async init(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        // 1. Tenta buscar os dados do usuário de forma isolada para não travar a página
        try {
            const [colecao, wishlist] = await Promise.all([
                this.colecaoService.buscarPorUsuario(user.id),
                this.wishListService.listarPorUsuario(user.id)
            ]);
            this.colecao = colecao;
            this.wishlist = wishlist;
        } catch (error) {
            // Se der erro 500 no banco, avisa no console mas NÃO quebra o resto da página
            console.warn('Não foi possível carregar os selos de coleção/wishlist:', error);
        }

        // 2. Garante que os eventos do botão de busca SEMPRE serão atrelados
        this.attachEvents();

        // 3. Tenta buscar as cartas do catálogo
        try {
            await this.fetchCards(undefined, undefined);
        } catch (error) {
            console.error('Erro ao iniciar o catálogo:', error);
            const gridArea = document.getElementById('catalog-grid-area');
            if (gridArea) {
                gridArea.innerHTML = `
                    <div class="alert alert-danger w-100 text-center mt-4">
                        Falha ao conectar com o catálogo de cartas da SIdex (localhost:8080).
                    </div>
                `;
            }
        }
    }

    private async fetchCards(atributo?: string, valor?: string): Promise<void> {
        this.loading = true;
        this.reloadView(); // Mostra o spinner

        try {
            if (this.searchOriginState === 'local') {
                this.cartas = await this.cartaService.buscarCatalogo(atributo, valor, this.currentPage);
            } else {
                this.cartas = await this.cartaService.buscarVitrini(atributo, valor, this.currentPage);
            }
        } catch (error) {
            console.error('Erro ao buscar cartas:', error);
            this.cartas = [];
        } finally {
            this.loading = false;
            this.reloadView(); // Desenha as cartas
        }
    }

    private attachEvents(): void {
        const btnSearch = document.getElementById('btn-search');
        const searchOrigin = document.getElementById('search-origin') as HTMLSelectElement;

        if (btnSearch) {
            btnSearch.addEventListener('click', () => {
                const searchAttribute = document.getElementById('filter-attribute') as HTMLSelectElement;
                const searchValue = document.getElementById('filter-value') as HTMLInputElement;
                
                let atributoFiltro: string | undefined = searchAttribute ? searchAttribute.value : undefined;
                let valorFiltro: string | undefined = searchValue ? searchValue.value.trim() : undefined;

                if (!valorFiltro || valorFiltro.length === 0) {
                    atributoFiltro = undefined;
                    valorFiltro = undefined;
                }
                
                this.searchOriginState = searchOrigin ? (searchOrigin.value as 'tcg' | 'local') : 'tcg';
                
                if (this.searchOriginState === 'tcg' && atributoFiltro) {
                    if (atributoFiltro === 'nome') atributoFiltro = 'name';
                    if (atributoFiltro === 'colecao') atributoFiltro = 'set';
                    if (atributoFiltro === 'raridade') atributoFiltro = 'rarity';
                }

                this.searchAttributeState = atributoFiltro;
                this.searchValueState = valorFiltro;
                
                this.currentPage = 1; // Reset to first page on new search
                
                this.fetchCards(this.searchAttributeState, this.searchValueState);
            });
        }
    }

    private reloadView(): void {
        const gridArea = document.getElementById('catalog-grid-area');
        if (!gridArea) return;

        if (this.loading) {
            gridArea.innerHTML = `
                <div class="flex-grow-1 d-flex justify-content-center align-items-center">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
            `;
            return;
        }

        if (this.cartas.length === 0) {
            gridArea.innerHTML = `
                <div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-secondary">
                    <i class="bi bi-search fs-1 mb-3 opacity-25"></i>
                    <p>Nenhuma carta encontrada na SIdex com esses filtros.</p>
                </div>
            `;
            return;
        }

        gridArea.innerHTML = /*html*/`
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="text-secondary" style="font-size: 0.9rem;">
                    Mostrando <strong>${this.cartas.length}</strong> resultados
                </div>
            </div>
            <div class="row g-3 overflow-y-auto pb-4" style="max-height: 800px; align-content: flex-start;">
                ${this.cartas.map(card => {
                    const inCollectionCount = this.colecao.filter(c => c.cartaBase.id.toString() === card.id.toString()).length;
                    const inWishlist = this.wishlist.some(w => w.cartaDesejada.id.toString() === card.id.toString());
                    
                    return `
                        <div class="col-6 col-sm-4 col-md-3">
                            <div class="card bg-transparent border-0 h-100" style="cursor: pointer;" data-card-id="${card.id}">
                                <div class="position-relative">
                                    <img src="${card.imagem}" class="img-fluid rounded-3 shadow-sm hover-zoom" alt="${card.nome}" loading="lazy" style="transition: transform 0.2s ease;">
                                    
                                    ${inCollectionCount > 0 ? `
                                        <span class="position-absolute top-0 start-0 translate-middle badge rounded-pill bg-success" style="z-index: 2; margin-top: 10px; margin-left: 10px;">
                                            ${inCollectionCount}
                                        </span>
                                    ` : ''}
                                    ${inWishlist ? `
                                        <span class="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger" style="z-index: 2; margin-top: 10px; margin-right: -10px;">
                                            <i class="bi bi-heart-fill"></i>
                                        </span>
                                    ` : ''}
                                </div>
                                <div class="mt-2 px-1">
                                    <div class="text-dark fw-bold text-truncate" style="font-size: 0.85rem;" title="${card.nome}">${card.nome}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="d-flex justify-content-center align-items-center mt-4 gap-3 w-100" style="clear: both;">
                <button id="btn-prev-page" class="btn btn-outline-secondary btn-sm" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="bi bi-chevron-left"></i> Anterior
                </button>
                <span class="text-secondary fw-bold">Página ${this.currentPage}</span>
                <button id="btn-next-page" class="btn btn-outline-secondary btn-sm" ${this.cartas.length < 20 ? 'disabled' : ''}>
                    Próxima <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;

        const btnPrev = document.getElementById('btn-prev-page');
        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.fetchCards(this.searchAttributeState, this.searchValueState);
                }
            });
        }

        const btnNext = document.getElementById('btn-next-page');
        if (btnNext) {
            btnNext.addEventListener('click', () => {
                this.currentPage++;
                this.fetchCards(this.searchAttributeState, this.searchValueState);
            });
        }

        const cardElements = document.querySelectorAll('[data-card-id]');
        cardElements.forEach(el => {
            el.addEventListener('click', (e) => {
                const cardId = (e.currentTarget as HTMLElement).getAttribute('data-card-id') || '';
                this.openCardModal(cardId);
            });
        });
    }

    private openCardModal(cardId: string): void {
        const card = this.cartas.find(c => c.id.toString() === cardId.toString());
        if (!card) return;
        this.selectedCardForAdd = card;

        const wrapper = document.getElementById('catalog-modal-wrapper');
        if (!wrapper) return;

        const inWishlist = this.wishlist.some(w => w.cartaDesejada.id.toString() === cardId.toString());

        wrapper.innerHTML = `
            <div class="modal fade show" id="cardActionModal" style="display: block; background: rgba(0,0,0,0.7);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4 shadow-lg">
                        <div class="modal-header border-bottom-0 pb-0">
                            <h5 class="modal-title fw-bold text-dark">${card.nome}</h5>
                            <button type="button" class="btn-close" id="btn-close-modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-5">
                                    <img src="${card.imagem}" class="img-fluid rounded-3 shadow" alt="${card.nome}">
                                </div>
                                <div class="col-7 d-flex flex-column">
                                    <div class="mb-3">
                                        <div class="text-secondary mb-1" style="font-size: 0.8rem;">Adicionar ao Acervo</div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="add-foil">
                                            <label class="form-check-label text-dark" style="font-size: 0.85rem;" for="add-foil">É Foil / Holográfica?</label>
                                        </div>
                                        <select class="form-select form-select-sm mb-3" id="add-condition">
                                            <option value="M">Mint (M)</option>
                                            <option value="NM">Near Mint (NM)</option>
                                            <option value="SP">Slightly Played (SP)</option>
                                            <option value="MP">Moderately Played (MP)</option>
                                            <option value="HP">Heavily Played (HP)</option>
                                            <option value="D">Damaged (D)</option>
                                        </select>
                                        <button class="btn btn-success btn-sm w-100 py-2 mb-3" id="btn-add-collection">
                                            <i class="bi bi-plus-circle"></i> SALVAR NA COLEÇÃO
                                        </button>
                                    </div>

                                    <div class="mt-auto border-top pt-3">
                                        <div class="text-secondary mb-2" style="font-size: 0.8rem;">Lista de Desejos</div>
                                        ${inWishlist ? `
                                            <button class="btn btn-outline-danger btn-sm w-100 py-2" id="btn-remove-wishlist">
                                                <i class="bi bi-heartbreak"></i> REMOVER DA WISHLIST
                                            </button>
                                        ` : `
                                            <button class="btn btn-danger btn-sm w-100 py-2" id="btn-add-wishlist">
                                                <i class="bi bi-heart-fill"></i> ADICIONAR À WISHLIST
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-close-modal')?.addEventListener('click', () => {
            wrapper.innerHTML = '';
            this.selectedCardForAdd = null;
        });

        document.getElementById('btn-add-collection')?.addEventListener('click', () => this.handleAddToCollection());
        document.getElementById('btn-add-wishlist')?.addEventListener('click', () => this.handleAddWishlist());
        document.getElementById('btn-remove-wishlist')?.addEventListener('click', () => this.handleRemoveWishlist());
    }

    private async handleAddToCollection(): Promise<void> {
        if (!this.selectedCardForAdd) return;
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const foilCheck = document.getElementById('add-foil') as HTMLInputElement;
        const conditionSelect = document.getElementById('add-condition') as HTMLSelectElement;

        const novaCarta = {
            id: 0,
            dono: user,
            cartaBase: this.selectedCardForAdd,
            isFoil: foilCheck.checked,
            condicao: conditionSelect.value as CondicaoEnum,
            
            quantidade: 1,
            dataAdcionada: new Date().toISOString().split('.')[0],
            isFavorita: false

        } as CartaColecao;

        try {
            const btn = document.getElementById('btn-add-collection') as HTMLButtonElement;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

            // 1º PASSO: Salva a carta base no banco de dados local primeiro!
            await this.cartaService.salvarCarta(this.selectedCardForAdd.id.toString());

            // 2º PASSO: Agora sim, vincula a carta à coleção do usuário
            await this.colecaoService.adicionarCarta(novaCarta);
            
            const colecao = await this.colecaoService.buscarPorUsuario(user.id);
            this.colecao = colecao;
            
            const wrapper = document.getElementById('catalog-modal-wrapper');
            if (wrapper) wrapper.innerHTML = '';
            this.selectedCardForAdd = null;
            this.reloadView();
        } catch (error) {
            alert('Erro ao salvar carta na coleção.');
            console.error(error);

            const btn = document.getElementById('btn-add-collection') as HTMLButtonElement;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-plus-circle"></i> SALVAR NA COLEÇÃO';
            }
        }
    }

    private async handleAddWishlist(): Promise<void> {
        if (!this.selectedCardForAdd) return;
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const conditionSelect = document.getElementById('add-condition') as HTMLSelectElement;

        const novaWish = {
            id: 0,
            usuario: user,
            cartaDesejada: this.selectedCardForAdd,
            foilDesejada: true,
            condicaoDesejada: conditionSelect.value as CondicaoEnum
        } as WishList;

        try {
            const btn = document.getElementById('btn-add-wishlist') as HTMLButtonElement;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            // 1º PASSO: Salva a carta base no banco de dados local primeiro!
            await this.cartaService.salvarCarta(this.selectedCardForAdd.id.toString());

            // 2º PASSO: Adiciona à Wishlist
            await this.wishListService.adicionarItem(novaWish);
            
            const wishlist = await this.wishListService.listarPorUsuario(user.id);
            this.wishlist = wishlist;
            
            this.openCardModal(this.selectedCardForAdd.id.toString()); // reload modal
            this.reloadView();
        } catch (error) {
            alert('Erro ao adicionar na wishlist.');
            console.error(error);

            const btn = document.getElementById('btn-add-wishlist') as HTMLButtonElement;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-heart-fill"></i> ADICIONAR À WISHLIST';
            }
        }
    }

    private async handleRemoveWishlist(): Promise<void> {
        if (!this.selectedCardForAdd) return;
        const user = this.authService.getCurrentUser();
        if (!user) return;

        const cardId = this.selectedCardForAdd.id;
        const itemToRemove = this.wishlist.find(w => w.cartaDesejada.id.toString() === cardId.toString());
        
        if (itemToRemove) {
            try {
                const btn = document.getElementById('btn-remove-wishlist') as HTMLButtonElement;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

                await this.wishListService.removerItem(itemToRemove.id);
                
                const wishlist = await this.wishListService.listarPorUsuario(user.id);
                this.wishlist = wishlist;
                
                this.openCardModal(this.selectedCardForAdd.id);
                this.reloadView();
            } catch (error) {
                alert('Erro ao remover da wishlist.');
                console.error(error);
            }
        }
    }
}