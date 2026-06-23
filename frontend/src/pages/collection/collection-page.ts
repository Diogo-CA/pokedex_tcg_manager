
import { Page } from '../page.js';
import { ColecaoService } from '../../services/colecao.service.js';
import { BinderService } from '../../services/binder.service.js';
import { WishListService } from '../../services/wishlist.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { CartaColecao, CondicaoEnum } from '../../models/colecao.model.js';
import type { Binder } from '../../models/binder.model.js';
import type { WishList } from '../../models/wishlist.model.js';

export class CollectionPage extends Page {
    private colecaoService: ColecaoService;
    private binderService: BinderService;
    private wishlistService: WishListService;
    private authService: AuthService;

    private activeTab: 'collection' | 'wishlist' | 'binders';
    private filterName: string = '';

    private colecao: CartaColecao[] = [];
    private wishlist: WishList[] = [];
    private binders: Binder[] = [];
    private loading: boolean = false;

    private selectedBinderId: number | null = null;

    constructor(
        colecaoService: ColecaoService,
        binderService: BinderService,
        wishlistService: WishListService,
        authService: AuthService,
        initialTab: 'collection' | 'wishlist' | 'binders' = 'collection'
    ) {
        super();
        this.colecaoService = colecaoService;
        this.binderService = binderService;
        this.wishlistService = wishlistService;
        this.authService = authService;
        this.activeTab = initialTab;
    }

    public getTemplate(): string {
        return `
            <div id="collection-async-container" class="animate-fade h-100 d-flex flex-column justify-content-center align-items-center">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-secondary">Carregando acervo do banco de dados...</p>
            </div>
        `;
    }

    public async init(): Promise<void> {
        await this.loadData();
    }

    private async loadData(): Promise<void> {
        const user = this.authService.getCurrentUser();
        if (!user) return;

        this.loading = true;
        this.reloadView(); // Shows loader

        try {
            const [colecao, wishlist, binders] = await Promise.all([
                this.colecaoService.buscarPorUsuario(user.id),
                this.wishlistService.listarPorUsuario(user.id),
                this.binderService.listarPorUsuario(user.id)
            ]);
            this.colecao = colecao;
            this.wishlist = wishlist;
            this.binders = binders;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            const container = document.getElementById('collection-async-container');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger w-100 text-center m-4">
                        <i class="bi bi-x-circle fs-2 d-block mb-2"></i>
                        Erro ao conectar com a SIdex API. Verifique a sua conexão com o backend.
                    </div>
                `;
            }
            return;
        } finally {
            this.loading = false;
        }

        this.reloadView();
    }

    private reloadView(): void {
        const container = document.getElementById('collection-async-container');
        if (!container) return;

        if (this.loading) {
            container.classList.add('justify-content-center', 'align-items-center');
            container.innerHTML = `
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3 text-secondary">Sincronizando...</p>
            `;
            return;
        }

        container.classList.remove('justify-content-center', 'align-items-center');

        const tabHeader = `
            <div class="collection-header-tabs mb-3 border-bottom border-secondary border-opacity-25 pb-2 pt-2">
                <button class="btn btn-sm ${this.activeTab === 'collection' ? 'btn-primary' : 'btn-outline-secondary'} me-2" id="tab-collection">
                    <i class="bi bi-collection"></i> Coleção (${this.colecao.length})
                </button>
                <button class="btn btn-sm ${this.activeTab === 'wishlist' ? 'btn-primary' : 'btn-outline-secondary'} me-2" id="tab-wishlist">
                    <i class="bi bi-heart"></i> Wishlist (${this.wishlist.length})
                </button>
                <button class="btn btn-sm ${this.activeTab === 'binders' ? 'btn-primary' : 'btn-outline-secondary'}" id="tab-binders">
                    <i class="bi bi-journal-bookmark"></i> Binders (${this.binders.length})
                </button>
            </div>
        `;

        let content = '';
        if (this.activeTab === 'collection') content = this.getCollectionTemplate();
        else if (this.activeTab === 'wishlist') content = this.getWishlistTemplate();
        else content = this.getBindersTemplate();

        container.innerHTML = `
            <div class="d-flex flex-column h-100 w-100 px-3">
                ${tabHeader}
                <div class="flex-grow-1 overflow-y-auto">
                    ${content}
                </div>
            </div>
            <div id="modal-wrapper"></div>
        `;

        this.attachEvents();
    }

    private getCollectionTemplate(): string {
        const filtered = this.colecao.filter(item => 
            (item.cartaBase?.nome || "").toLowerCase().includes(this.filterName.toLowerCase())
        );

        return `
            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <input type="text" id="filter-input" class="form-control" placeholder="Buscar nas minhas cartas..." value="${this.filterName}">
                </div>
            </div>

            ${filtered.length === 0 ? `
                <div class="text-center py-5 text-secondary">
                    <i class="bi bi-inbox fs-1 mb-3 opacity-25"></i>
                    <p>Nenhuma carta encontrada na sua coleção.</p>
                </div>
            ` : `
                <div class="row g-3">
                    ${filtered.map(item => `
                        <div class="col-6 col-sm-4 col-md-3">
                            <div class="card bg-transparent border-0 h-100">
                                <div class="position-relative">
                                    <img src="${item.cartaBase.imagem}" class="img-fluid rounded shadow-sm" alt="${item.cartaBase.nome}">
                                    ${item.isFoil ? `<span class="badge bg-warning text-dark position-absolute top-0 end-0 mt-2 me-2 shadow"><i class="bi bi-stars"></i> FOIL</span>` : ''}
                                </div>
                                <div class="mt-2 px-1">
                                    <div class="text-dark fw-bold text-truncate" style="font-size: 0.85rem;" title="${item.cartaBase.nome}">${item.cartaBase.nome}</div>
                                    <div class="d-flex justify-content-between align-items-center mt-1">
                                        <span class="badge border border-secondary text-secondary" style="font-size: 0.7rem;">${item.condicao}</span>
                                        <button class="btn btn-sm btn-outline-danger py-0 px-2 btn-del-col" data-id="${item.id}"><i class="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    }

    private getWishlistTemplate(): string {
        return `
            ${this.wishlist.length === 0 ? `
                <div class="text-center py-5 text-secondary">
                    <i class="bi bi-heartbreak fs-1 mb-3 opacity-25"></i>
                    <p>Sua wishlist está vazia.</p>
                </div>
            ` : `
                <div class="row g-3">
                    ${this.wishlist.map(w => `
                        <div class="col-6 col-sm-4 col-md-3">
                            <div class="card bg-transparent border-0 h-100">
                                <div class="position-relative">
                                    <img src="${w.cartaDesejada.imagem}" class="img-fluid rounded shadow-sm" alt="${w.cartaDesejada.nome}">
                                </div>
                                <div class="mt-2 px-1">
                                    <div class="text-dark fw-bold text-truncate" style="font-size: 0.85rem;">${w.cartaDesejada.nome}</div>
                                    <div class="d-flex justify-content-between align-items-center mt-1">
                                        <span class="badge border border-secondary text-secondary" style="font-size: 0.7rem;">Deseja: ${w.condicaoDesejada || 'N/A'}${w.foilDesejada ? ' (Foil)' : ''}</span>
                                        <div class="d-flex gap-1">
                                            <button class="btn btn-sm btn-outline-success py-0 px-2 btn-add-wish-col" data-id="${w.id}" title="Passar para Acervo"><i class="bi bi-box-arrow-in-down"></i></button>
                                            <button class="btn btn-sm btn-outline-danger py-0 px-2 btn-del-wish" data-id="${w.id}" title="Remover"><i class="bi bi-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
    }

    private getBindersTemplate(): string {
        if (this.selectedBinderId !== null) {
            const binder = this.binders.find(b => b.id === this.selectedBinderId);
            if (!binder) {
                this.selectedBinderId = null;
                return this.getBindersTemplate();
            }

            const cartasNesteBinder = this.colecao.filter(c => c.binder && c.binder.id === binder.id);

            return `
                <div class="mb-3">
                    <button class="btn btn-sm btn-outline-secondary" id="btn-back-binders"><i class="bi bi-arrow-left"></i> Voltar para Binders</button>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                    <div>
                        <h4 class="text-dark m-0">${binder.nome}</h4>
                        <div class="text-secondary" style="font-size: 0.85rem;">${cartasNesteBinder.length} cartas organizadas</div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-success me-2" id="btn-add-cards-binder" data-id="${binder.id}"><i class="bi bi-plus-lg"></i> Adicionar Cartas</button>
                        <button class="btn btn-sm btn-danger" id="btn-del-binder" data-id="${binder.id}"><i class="bi bi-trash"></i> Excluir Binder</button>
                    </div>
                </div>

                <div class="row g-3">
                    ${cartasNesteBinder.length === 0 ? `
                        <div class="text-center py-5 text-secondary">Esta pasta está vazia.</div>
                    ` : cartasNesteBinder.map(item => `
                        <div class="col-6 col-sm-4 col-md-3">
                            <div class="position-relative">
                                <img src="${item.cartaBase.imagem}" class="img-fluid rounded shadow-sm">
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="mb-4">
                <button class="btn btn-success btn-sm" id="btn-new-binder"><i class="bi bi-plus-lg"></i> Novo Binder</button>
            </div>
            
            ${this.binders.length === 0 ? `
                <div class="text-center py-5 text-secondary">
                    <i class="bi bi-journal-x fs-1 mb-3 opacity-25"></i>
                    <p>Nenhum binder criado.</p>
                </div>
            ` : `
                <div class="row g-3">
                    ${this.binders.map(b => {
                        const qtd = this.colecao.filter(c => c.binder && c.binder.id === b.id).length;
                        return `
                        <div class="col-md-4">
                            <div class="clean-card h-100" style="cursor: pointer;" data-binder-id="${b.id}">
                                <div class="d-flex align-items-center mb-2">
                                    <i class="bi bi-journal-bookmark fs-3 text-success me-3"></i>
                                    <div>
                                        <h6 class="text-dark m-0">${b.nome}</h6>
                                        <div class="text-secondary" style="font-size: 0.75rem;">${qtd} cartas</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `}
        `;
    }

    private attachEvents(): void {

        document.getElementById('tab-collection')?.addEventListener('click', () => { this.activeTab = 'collection'; this.selectedBinderId = null; this.reloadView(); });
        document.getElementById('tab-wishlist')?.addEventListener('click', () => { this.activeTab = 'wishlist'; this.selectedBinderId = null; this.reloadView(); });
        document.getElementById('tab-binders')?.addEventListener('click', () => { this.activeTab = 'binders'; this.selectedBinderId = null; this.reloadView(); });

        const filterInput = document.getElementById('filter-input') as HTMLInputElement;
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.filterName = (e.target as HTMLInputElement).value;
                this.reloadView();

                setTimeout(() => {
                    const el = document.getElementById('filter-input') as HTMLInputElement;
                    if(el) {
                        el.focus();
                        el.setSelectionRange(el.value.length, el.value.length);
                    }
                }, 0);
            });
        }

        document.querySelectorAll('.btn-del-col').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
                if (window.confirm('Remover esta carta do seu acervo?')) {
                    await this.colecaoService.removerCarta(id);
                    await this.loadData();
                }
            });
        });

        document.querySelectorAll('.btn-del-wish').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
                if (window.confirm('Remover esta carta da wishlist?')) {
                    await this.wishlistService.removerItem(id);
                    await this.loadData();
                }
            });
        });

        document.querySelectorAll('.btn-add-wish-col').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
                this.openWishlistToCollectionModal(id);
            });
        });

        document.getElementById('btn-new-binder')?.addEventListener('click', () => this.handleNewBinder());
        document.getElementById('btn-back-binders')?.addEventListener('click', () => { this.selectedBinderId = null; this.reloadView(); });
        
        document.querySelectorAll('[data-binder-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                this.selectedBinderId = Number((e.currentTarget as HTMLElement).getAttribute('data-binder-id'));
                this.reloadView();
            });
        });

        document.getElementById('btn-del-binder')?.addEventListener('click', async (e) => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
            if (window.confirm('Deletar este binder? (Apenas a pasta será apagada, as cartas voltam para a coleção soltas)')) {
                await this.binderService.excluirBinder(id);
                this.selectedBinderId = null;
                await this.loadData();
            }
        });

        document.getElementById('btn-add-cards-binder')?.addEventListener('click', (e) => {
            const id = Number((e.currentTarget as HTMLElement).getAttribute('data-id'));
            this.openBinderSelectionModal(id);
        });
    }

    private async handleNewBinder(): Promise<void> {
        const name = window.prompt('Qual o nome do novo Binder?');
        if (!name) return;

        const user = this.authService.getCurrentUser();
        if (!user) return;

        try {
            await this.binderService.criarBinder({
                id: 0,
                usuario: user,
                nome: name,
                cartasDoBinder: []
            });
            await this.loadData();
        } catch (error) {
            console.error(error);
            alert('Falha ao criar binder.');
        }
    }
    private openWishlistToCollectionModal(wishId: number): void {
        const wish = this.wishlist.find(w => w.id === wishId);
        if (!wish) return;

        const wrapper = document.getElementById('modal-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = `
            <div class="modal fade show" id="wishlistActionModal" style="display: block; background: rgba(0,0,0,0.7);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 rounded-4 shadow-lg">
                        <div class="modal-header border-bottom-0 pb-0">
                            <h5 class="modal-title fw-bold text-dark">${wish.cartaDesejada.nome}</h5>
                            <button type="button" class="btn-close" id="btn-close-wish-modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-5">
                                    <img src="${wish.cartaDesejada.imagem}" class="img-fluid rounded-3 shadow" alt="${wish.cartaDesejada.nome}">
                                </div>
                                <div class="col-7 d-flex flex-column">
                                    <div class="mb-3">
                                        <div class="text-secondary mb-1" style="font-size: 0.8rem;">Confirmar Adição ao Acervo</div>
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input" type="checkbox" id="add-foil-col" ${wish.foilDesejada ? 'checked' : ''}>
                                            <label class="form-check-label text-dark" style="font-size: 0.85rem;" for="add-foil-col">É Foil / Holográfica?</label>
                                        </div>
                                        <select class="form-select form-select-sm mb-3" id="add-condition-col">
                                            <option value="M" ${wish.condicaoDesejada === 'M' ? 'selected' : ''}>Mint (M)</option>
                                            <option value="NM" ${wish.condicaoDesejada === 'NM' ? 'selected' : ''}>Near Mint (NM)</option>
                                            <option value="SP" ${wish.condicaoDesejada === 'SP' ? 'selected' : ''}>Slightly Played (SP)</option>
                                            <option value="MP" ${wish.condicaoDesejada === 'MP' ? 'selected' : ''}>Moderately Played (MP)</option>
                                            <option value="HP" ${wish.condicaoDesejada === 'HP' ? 'selected' : ''}>Heavily Played (HP)</option>
                                            <option value="D" ${wish.condicaoDesejada === 'D' ? 'selected' : ''}>Damaged (D)</option>
                                        </select>
                                        <button class="btn btn-success btn-sm w-100 py-2 mb-3" id="btn-confirm-add-col">
                                            <i class="bi bi-plus-circle"></i> SALVAR NA COLEÇÃO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-close-wish-modal')?.addEventListener('click', () => {
            wrapper.innerHTML = '';
        });

        document.getElementById('btn-confirm-add-col')?.addEventListener('click', async () => {
            const user = this.authService.getCurrentUser();
            if (!user) return;

            const foilCheck = document.getElementById('add-foil-col') as HTMLInputElement;
            const conditionSelect = document.getElementById('add-condition-col') as HTMLSelectElement;

            const novaCarta = {
                id: 0,
                dono: user,
                cartaBase: wish.cartaDesejada,
                isFoil: foilCheck.checked,
                condicao: conditionSelect.value as CondicaoEnum,
                quantidade: 1,
                dataAdcionada: new Date().toISOString().split('.')[0],
                isFavorita: false
            } as CartaColecao;

            try {
                const btn = document.getElementById('btn-confirm-add-col') as HTMLButtonElement;
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

                await this.colecaoService.adicionarCarta(novaCarta);
                await this.wishlistService.removerItem(wish.id);
                
                wrapper.innerHTML = '';
                await this.loadData();
            } catch (error) {
                alert('Erro ao transferir carta.');
                console.error(error);
                const btn = document.getElementById('btn-confirm-add-col') as HTMLButtonElement;
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-plus-circle"></i> SALVAR NA COLEÇÃO';
                }
            }
        });
    }

    private selectedCardsForBinder: number[] = [];

    private openBinderSelectionModal(binderId: number): void {
        const binder = this.binders.find(b => b.id === binderId);
        if (!binder) return;

        this.selectedCardsForBinder = [];

        const wrapper = document.getElementById('modal-wrapper');
        if (!wrapper) return;

        const availableCards = this.colecao.filter(c => !c.binder || c.binder.id === null);

        wrapper.innerHTML = `
            <div class="modal fade show" id="binderSelectionModal" style="display: block; background: rgba(0,0,0,0.7);" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
                    <div class="modal-content border-0 rounded-4 shadow-lg h-100">
                        <div class="modal-header border-bottom pb-3">
                            <div>
                                <h5 class="modal-title fw-bold text-dark m-0">Adicionar Cartas a ${binder.nome}</h5>
                                <div class="text-secondary" style="font-size: 0.8rem;">Selecione as cartas soltas do seu acervo para guardar nesta pasta.</div>
                            </div>
                            <button type="button" class="btn-close" id="btn-close-binder-sel-modal"></button>
                        </div>
                        <div class="modal-body bg-light">
                            ${availableCards.length === 0 ? `
                                <div class="text-center py-5 text-secondary">
                                    <i class="bi bi-inbox fs-1 mb-3 opacity-25"></i>
                                    <p>Você não tem cartas soltas no acervo.</p>
                                </div>
                            ` : `
                                <div class="row g-3">
                                    ${availableCards.map(c => `
                                        <div class="col-4 col-sm-3 col-md-2">
                                            <div class="position-relative card-select-wrapper" style="cursor: pointer;" data-sel-id="${c.id}">
                                                <img src="${c.cartaBase.imagem}" class="img-fluid rounded shadow-sm card-select-img" style="transition: all 0.2s ease;">
                                                <div class="position-absolute top-50 start-50 translate-middle check-overlay" style="display: none;">
                                                    <i class="bi bi-check-circle-fill text-success" style="font-size: 2rem; background: rgba(255,255,255,0.8); border-radius: 50%;"></i>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                        <div class="modal-footer border-top pt-3">
                            <span class="text-secondary me-auto" id="sel-count">0 cartas selecionadas</span>
                            <button class="btn btn-outline-secondary btn-sm" id="btn-cancel-binder-sel">Cancelar</button>
                            <button class="btn btn-success btn-sm px-4" id="btn-save-binder-sel" ${availableCards.length === 0 ? 'disabled' : ''}>
                                Salvar no Binder
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const updateSelectionVisuals = () => {
            const countEl = document.getElementById('sel-count');
            if (countEl) countEl.innerText = `${this.selectedCardsForBinder.length} cartas selecionadas`;

            document.querySelectorAll('.card-select-wrapper').forEach(el => {
                const id = Number(el.getAttribute('data-sel-id'));
                const img = el.querySelector('.card-select-img') as HTMLElement;
                const overlay = el.querySelector('.check-overlay') as HTMLElement;
                
                if (this.selectedCardsForBinder.includes(id)) {
                    img.style.border = '4px solid #198754';
                    img.style.transform = 'scale(0.95)';
                    img.style.opacity = '0.8';
                    overlay.style.display = 'block';
                } else {
                    img.style.border = 'none';
                    img.style.transform = 'scale(1)';
                    img.style.opacity = '1';
                    overlay.style.display = 'none';
                }
            });
        };

        document.querySelectorAll('.card-select-wrapper').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = Number((e.currentTarget as HTMLElement).getAttribute('data-sel-id'));
                if (this.selectedCardsForBinder.includes(id)) {
                    this.selectedCardsForBinder = this.selectedCardsForBinder.filter(x => x !== id);
                } else {
                    this.selectedCardsForBinder.push(id);
                }
                updateSelectionVisuals();
            });
        });

        const closeIt = () => { wrapper.innerHTML = ''; };
        document.getElementById('btn-close-binder-sel-modal')?.addEventListener('click', closeIt);
        document.getElementById('btn-cancel-binder-sel')?.addEventListener('click', closeIt);

        document.getElementById('btn-save-binder-sel')?.addEventListener('click', async () => {
            if (this.selectedCardsForBinder.length === 0) {
                closeIt();
                return;
            }

            const btn = document.getElementById('btn-save-binder-sel') as HTMLButtonElement;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

            try {
                const promises = this.selectedCardsForBinder.map(async (cardId) => {
                    const carta = this.colecao.find(c => c.id === cardId);
                    if (carta) {
                        carta.binder = binder;
                        await this.colecaoService.atualizarCarta(carta);
                    }
                });
                
                await Promise.all(promises);
                
                closeIt();
                await this.loadData();
            } catch (error) {
                console.error(error);
                alert('Erro ao salvar algumas cartas no binder.');
                btn.disabled = false;
                btn.innerHTML = 'Salvar no Binder';
            }
        });
    }

}
