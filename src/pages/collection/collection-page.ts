// src/pages/collection/collection-page.ts
import { Page } from '../page.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { CollectionItem } from '../../models/collection.model.js';
import type { WishlistItem } from '../../models/wishlist.model.js';
import type { Folder } from '../../models/folder.model.js';

export class CollectionPage extends Page {
    private storageService: StorageService;
    private authService: AuthService;
    
    // Estado da tela
    private activeTab: 'collection' | 'wishlist' | 'binders';
    private filterName: string = '';
    private editingItem: CollectionItem | null = null;
    
    // Estado do Binder selecionado
    private selectedFolderId: string | null = null;

    constructor(storageService: StorageService, authService: AuthService, initialTab: 'collection' | 'wishlist' | 'binders' = 'collection') {
        super();
        this.storageService = storageService;
        this.authService = authService;
        this.activeTab = initialTab;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';

        // Obter dados do storage
        const collection = this.storageService.getCollection(userId);
        const wishlist = this.storageService.getWishlist(userId);
        const folders = this.storageService.getFolders(userId);

        // Abas header
        const tabHeader = `
            <div class="collection-header-tabs">
                <button class="tab-btn ${this.activeTab === 'collection' ? 'active' : ''}" data-tab="collection">
                    <i class="bi bi-collection"></i> Coleção (${collection.length})
                </button>
                <button class="tab-btn ${this.activeTab === 'wishlist' ? 'active' : ''}" data-tab="wishlist">
                    <i class="bi bi-heart"></i> Wishlist (${wishlist.length})
                </button>
                <button class="tab-btn ${this.activeTab === 'binders' ? 'active' : ''}" data-tab="binders">
                    <i class="bi bi-journal-bookmark"></i> Binders (${folders.length})
                </button>
            </div>
        `;

        if (this.activeTab === 'collection') {
            return `
                <div class="animate-fade">
                    ${tabHeader}
                    ${this.getCollectionTabTemplate(userId, collection)}
                </div>
            `;
        } else if (this.activeTab === 'wishlist') {
            return `
                <div class="animate-fade">
                    ${tabHeader}
                    ${this.getWishlistTabTemplate(userId, wishlist)}
                </div>
            `;
        } else {
            return `
                <div class="animate-fade">
                    ${tabHeader}
                    ${this.getBindersTabTemplate(userId, collection, folders)}
                </div>
            `;
        }
    }

    // --- TEMPLATE: COLEÇÃO ---
    private getCollectionTabTemplate(userId: string, collection: CollectionItem[]): string {
        // Filtragem por nome
        const filtered = collection.filter(item => 
            item.cardData.name.toLowerCase().includes(this.filterName.toLowerCase())
        );

        // Calcular Métricas
        const totalCopies = collection.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = collection.reduce((sum, item) => sum + this.calculateCardPrice(item), 0);

        return `
            <!-- Painel de Métricas -->
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="glass-card py-2 px-3 text-center">
                        <span class="text-secondary d-block" style="font-size: 0.75rem;">CARTAS ÚNICAS</span>
                        <h4 class="text-white m-0 font-weight-bold">${collection.length}</h4>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card py-2 px-3 text-center">
                        <span class="text-secondary d-block" style="font-size: 0.75rem;">TOTAL DE CÓPIAS</span>
                        <h4 class="text-white m-0 font-weight-bold">${totalCopies}</h4>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="glass-card py-2 px-3 text-center border-success border-opacity-25">
                        <span class="text-success d-block" style="font-size: 0.75rem;">VALOR ESTIMADO</span>
                        <h4 class="text-success m-0 font-weight-bold">$${totalValue.toFixed(2)} USD</h4>
                    </div>
                </div>
            </div>

            <!-- Barra de Busca -->
            <div class="glass-card mb-4 py-2 px-3">
                <div class="position-relative">
                    <input type="text" id="collection-search-input" class="form-control form-control-sm ps-4" placeholder="Filtrar minhas cartas..." value="${this.filterName}">
                    <i class="bi bi-search position-absolute text-secondary" style="left: 10px; top: 7px; font-size: 0.8rem;"></i>
                </div>
            </div>

            <!-- Grid de Cartas da Coleção -->
            ${filtered.length === 0 ? `
                <div class="text-center py-5 text-secondary glass-card">
                    <i class="bi bi-collection fs-1 mb-2 d-block opacity-25"></i>
                    Seu acervo está vazio ou nenhuma correspondência foi encontrada.<br>
                    Explore o <a href="#/catalog" class="text-info text-decoration-none">Catálogo</a> para escanear novas cartas!
                </div>
            ` : `
                <div class="row row-cols-2 row-cols-md-4 g-3 overflow-y-auto" style="max-height: 400px; padding-bottom: 20px;">
                    ${filtered.map(item => {
                        const type = item.cardData.types ? item.cardData.types[0] : 'Colorless';
                        const price = this.calculateCardPrice(item);
                        return `
                            <div class="col pokemon-card-container">
                                <div class="pokemon-card position-relative collection-card-btn" data-id="${item.cardId}">
                                    <img src="${item.cardData.images.small}" alt="${item.cardData.name}">
                                    
                                    <!-- Overlay: Quantidade (Multiplicador) -->
                                    <div class="card-overlay-indicator check-qty">
                                        x${item.quantity}
                                    </div>
                                </div>
                                <div class="mt-2 px-1">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="fw-bold text-white text-truncate" style="font-size: 0.75rem; max-width: 65%;">${item.cardData.name}</span>
                                        <span class="badge-energy energy-${type ? type.toLowerCase() : 'colorless'}" style="font-size: 0.6rem; padding: 2px 6px;">
                                            ${type}
                                        </span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-1" style="font-size: 0.7rem;">
                                        <span class="text-secondary">${this.translateCondition(item.condition)}</span>
                                        <span class="text-success fw-bold">$${price.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}

            <!-- Modal de Edição (Injetado) -->
            <div class="modal fade" id="editCardModal" tabindex="-1" aria-hidden="true" style="backdrop-filter: blur(5px);">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content bg-dark border border-secondary text-white">
                        <div class="modal-header border-secondary border-opacity-25 pb-2">
                            <h6 class="modal-title">Editar Cadastro</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body py-3">
                            <form id="edit-card-form">
                                <div class="mb-2">
                                    <label class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nome da Carta</label>
                                    <input type="text" id="edit-card-name-display" class="form-control form-control-sm text-secondary bg-transparent border-0 px-0 fw-bold" readonly>
                                </div>
                                <div class="mb-2">
                                    <label for="edit-quantity" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Quantidade (Estoque)</label>
                                    <input type="number" id="edit-quantity" class="form-control form-control-sm" min="1" required>
                                </div>
                                <div class="mb-2">
                                    <label for="edit-condition" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Estado de Conservação</label>
                                    <select id="edit-condition" class="form-select form-select-sm" required>
                                        <option value="M">Mint (Impecável)</option>
                                        <option value="NM">Near Mint (Quase Impecável)</option>
                                        <option value="LP">Lightly Played (Pouco Usada)</option>
                                        <option value="PL">Played (Usada/Desgastada)</option>
                                    </select>
                                </div>
                                <div class="form-check form-switch mb-3">
                                    <input class="form-check-input" type="checkbox" role="switch" id="edit-foil">
                                    <label class="form-check-label text-info" for="edit-foil" style="font-size: 0.8rem;"><i class="bi bi-stars"></i> Holográfica (Foil)</label>
                                </div>
                                <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-2">SALVAR ALTERAÇÕES</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TEMPLATE: WISHLIST ---
    private getWishlistTabTemplate(userId: string, wishlist: WishlistItem[]): string {
        const totalValue = wishlist.reduce((sum, item) => {
            const rarity = item.cardData.rarity ? item.cardData.rarity.toLowerCase() : '';
            let val = 2.50;
            if (rarity.includes('vmax')) val = 20.00;
            else if (rarity.includes('v')) val = 10.00;
            else if (rarity.includes('rare')) val = 5.00;
            return sum + (val * item.quantity);
        }, 0);

        return `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="text-white m-0" style="font-size: 0.95rem;">Minha Lista de Desejos</h5>
                <span class="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 py-2 px-3">
                    Valor Total Estimado: $${totalValue.toFixed(2)} USD
                </span>
            </div>

            ${wishlist.length === 0 ? `
                <div class="text-center py-5 text-secondary glass-card">
                    <i class="bi bi-heart fs-1 mb-2 d-block opacity-25"></i>
                    Sua lista de desejos está vazia. Adicione corações a partir do catálogo!
                </div>
            ` : `
                <div class="glass-card p-0 overflow-hidden">
                    <div class="table-responsive">
                        <table class="table table-dark table-hover align-middle m-0" style="font-size: 0.82rem;">
                            <thead>
                                <tr class="text-secondary">
                                    <th class="ps-3" style="width: 70px;">Mini</th>
                                    <th>Nome</th>
                                    <th>Raridade</th>
                                    <th class="text-center">Prioridade</th>
                                    <th class="text-center">Quantidade</th>
                                    <th class="text-end">Preço Est.</th>
                                    <th class="text-end pe-3" style="width: 140px;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${wishlist.map(item => {
                                    let priorityLabel = 'Baixa';
                                    let priorityClass = 'wishlist-priority-low';
                                    if (item.priority === 'high') { priorityLabel = 'Alta'; priorityClass = 'wishlist-priority-high'; }
                                    else if (item.priority === 'medium') { priorityLabel = 'Média'; priorityClass = 'wishlist-priority-medium'; }

                                    const rarity = item.cardData.rarity ? item.cardData.rarity.toLowerCase() : '';
                                    let val = 2.50;
                                    if (rarity.includes('vmax')) val = 20.00;
                                    else if (rarity.includes('v')) val = 10.00;
                                    else if (rarity.includes('rare')) val = 5.00;
                                    const totalItemVal = val * item.quantity;

                                    return `
                                        <tr class="border-secondary border-opacity-15">
                                            <td class="ps-3">
                                                <img src="${item.cardData.images.small}" alt="${item.cardData.name}" style="height: 45px; border-radius: 2px; object-fit: contain;">
                                            </td>
                                            <td>
                                                <span class="fw-bold text-white">${item.cardData.name}</span>
                                                <div class="text-secondary" style="font-size: 0.72rem;">Nº ${item.cardData.number}</div>
                                            </td>
                                            <td>${item.cardData.rarity || 'Comum'}</td>
                                            <td class="text-center">
                                                <span class="badge ${priorityClass} px-2 py-0.5" style="font-size: 0.65rem;">${priorityLabel}</span>
                                            </td>
                                            <td class="text-center fw-bold text-info">${item.quantity}</td>
                                            <td class="text-end text-success font-weight-bold">$${totalItemVal.toFixed(2)}</td>
                                            <td class="text-end pe-3">
                                                <button class="btn btn-outline-success btn-xs btn-acquire me-1" data-id="${item.id}" title="Adquiri esta carta! (Mover para coleção)">
                                                    <i class="bi bi-check-circle"></i> Adquiri
                                                </button>
                                                <button class="btn btn-outline-danger btn-xs btn-delete-wish" data-id="${item.id}" title="Remover da lista">
                                                    <i class="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}
        `;
    }

    // --- TEMPLATE: BINDERS ---
    private getBindersTabTemplate(userId: string, collection: CollectionItem[], folders: Folder[]): string {
        if (this.selectedFolderId) {
            const folder = folders.find(f => f.id === this.selectedFolderId);
            if (folder) {
                return this.getFolderDetailTemplate(userId, collection, folder);
            }
        }

        // Modo Lista
        return /*html*/`
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="text-white m-0" style="font-size: 0.95rem;">Pastas de Organização / Binders</h5>
                <button class="btn pokedex-btn-dark btn-sm" id="btn-open-create-modal">
                    <i class="bi bi-folder-plus"></i> Criar Novo Binder
                </button>
            </div>

            ${folders.length === 0 ? `
                <div class="text-center py-5 text-secondary glass-card">
                    <i class="bi bi-journal-x fs-1 mb-2 d-block opacity-25"></i>
                    Nenhum binder criado. Clique no botão acima para organizar suas cartas!
                </div>
            ` : `
                <div class="row g-3">
                    ${folders.map(f => {
                        const totalInFolder = f.cardIds.length;
                        const progressPercent = Math.min(100, Math.round((totalInFolder / 9) * 100));
                        
                        // Coleta miniaturas de imagens
                        const thumbnails: string[] = [];
                        f.cardIds.slice(0, 4).forEach(cid => {
                            const item = collection.find(c => c.cardId === cid);
                            if (item) thumbnails.push(item.cardData.images.small);
                        });

                        return /*html*/`
                            <div class="col-md-6">
                                <div class="glass-card d-flex flex-column justify-content-between h-100 py-3 px-3">
                                    <div>
                                        <div class="d-flex justify-content-between align-items-start mb-1">
                                            <h5 class="text-white m-0" style="font-size: 0.95rem;">${f.name}</h5>
                                            <span class="badge bg-dark border border-secondary border-opacity-50 text-secondary" style="font-size: 0.72rem;">
                                                ${totalInFolder} / 9 cartas
                                            </span>
                                        </div>
                                        <p class="text-secondary mb-3" style="font-size: 0.8rem; min-height: 35px;">
                                            ${f.description || 'Sem descrição.'}
                                        </p>

                                        <!-- Thumbnails sobrepostas -->
                                        <div class="binder-thumbnails pe-1">
                                            ${thumbnails.length === 0 ? `
                                                <div class="text-secondary opacity-25" style="font-size: 0.75rem;"><i class="bi bi-inbox fs-4"></i></div>
                                            ` : thumbnails.map(img => `
                                                <img src="${img}" class="binder-thumbnail-img" alt="Card thumbnail">
                                            `).join('')}
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top border-secondary border-opacity-15">
                                        <!-- Progresso -->
                                        <div class="d-flex align-items-center gap-2">
                                            <div style="width: 80px; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow:hidden;">
                                                <div style="width: ${progressPercent}%; height: 100%; background: var(--pkdx-lens-blue); border-radius: 3px;"></div>
                                            </div>
                                            <span class="text-secondary" style="font-size: 0.7rem;">${progressPercent}%</span>
                                        </div>
                                        <div>
                                            <button class="btn btn-outline-info btn-xs view-folder-btn me-1" data-id="${f.id}">
                                                <i class="bi bi-eye"></i> Entrar
                                            </button>
                                            <button class="btn btn-outline-danger btn-xs delete-folder-btn" data-id="${f.id}">
                                                <i class="bi bi-trash"></i> Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}

            <!-- Modal de Criação de Pasta -->
            <div class="modal fade" id="createFolderModal" tabindex="-1" aria-hidden="true" style="backdrop-filter: blur(5px);">
                <div class="modal-dialog modal-dialog-centered modal-sm">
                    <div class="modal-content bg-dark border border-secondary text-white">
                        <div class="modal-header border-secondary border-opacity-25 pb-2">
                            <h6 class="modal-title">Nova Pasta / Binder</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body py-3">
                            <form id="create-folder-form">
                                <div class="mb-3">
                                    <label for="folder-name" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nome do Binder</label>
                                    <input type="text" id="folder-name" class="form-control form-control-sm" placeholder="Ex: Melhores Holos, Eeveelutions..." required>
                                </div>
                                <div class="mb-3">
                                    <label for="folder-description" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Descrição</label>
                                    <textarea id="folder-description" class="form-control form-control-sm" rows="3" placeholder="Para que serve este binder?"></textarea>
                                </div>
                                <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-2">CRIAR BINDER</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- TEMPLATE: DETALHE DO BINDER (GRADE 3X3 INTERATIVA) ---
    private getFolderDetailTemplate(userId: string, collection: CollectionItem[], folder: Folder): string {
        // Mapear os cardIds da pasta para as cartas reais do acervo
        const folderCards = collection.filter(item => folder.cardIds.includes(item.cardId));

        // Filtrar cartas da coleção que NÃO estão no binder para o painel lateral
        const cardsAvailableToAdd = collection.filter(item => !folder.cardIds.includes(item.cardId));

        // Grade de 9 slots
        const slotsHtml: string[] = [];
        for (let i = 0; i < 9; i++) {
            const cardIdInSlot = folder.cardIds[i];
            
            if (cardIdInSlot) {
                const item = collection.find(c => c.cardId === cardIdInSlot);
                if (item) {
                    slotsHtml.push(`
                        <div class="binder-slot filled">
                            <div class="pokemon-card hover-foil collection-card-btn" data-id="${item.cardId}">
                                <img src="${item.cardData.images.small}" alt="${item.cardData.name}">
                            </div>
                            <button class="binder-slot-remove remove-card-folder-btn" data-id="${item.cardId}" data-name="${item.cardData.name}" title="Retirar do binder">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    `);
                } else {
                    // Se o cardId existe mas o item não foi encontrado (deletado do acervo)
                    slotsHtml.push(`
                        <div class="binder-slot">
                            <span class="slot-number">${i + 1}</span>
                            <div class="text-secondary opacity-50" style="font-size: 0.7rem;">Inexistente</div>
                        </div>
                    `);
                }
            } else {
                slotsHtml.push(`
                    <div class="binder-slot">
                        <span class="slot-number">${i + 1}</span>
                        <div class="text-secondary opacity-25" style="font-size: 0.75rem;"><i class="bi bi-plus-lg fs-3"></i></div>
                    </div>
                `);
            }
        }

        return `
            <div class="row g-4">
                <!-- Coluna Binder (Esquerda): Folha 3x3 -->
                <div class="col-md-7">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <a href="javascript:void(0)" id="back-to-folders" class="text-info text-decoration-none" style="font-size: 0.82rem;">
                                <i class="bi bi-chevron-left"></i> Voltar para Binders
                            </a>
                            <h4 class="text-white mt-1 mb-0" style="font-size: 1.1rem;">${folder.name}</h4>
                        </div>
                        <span class="badge bg-dark border border-secondary border-opacity-50 text-info py-2 px-3">
                            Binder: ${folderCards.length} / 9 cartas
                        </span>
                    </div>

                    <!-- Folha Organizadora 3x3 -->
                    <div class="binder-sheet-grid">
                        ${slotsHtml.join('')}
                    </div>
                </div>

                <!-- Coluna Painel de Inserção (Direita) -->
                <div class="col-md-5">
                    <div class="glass-card h-100 d-flex flex-column" style="min-height: 420px;">
                        <h6 class="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-3" style="font-size: 0.85rem;">
                            <i class="bi bi-plus-circle text-info"></i> ADICIONAR AO BINDER
                        </h6>

                        <div class="flex-grow-1 overflow-y-auto pe-1" style="max-height: 350px;">
                            ${cardsAvailableToAdd.length === 0 ? `
                                <div class="text-center py-5 text-secondary" style="font-size: 0.8rem;">
                                    Não há cartas disponíveis no seu acervo fora deste binder.
                                </div>
                            ` : `
                                <div class="d-flex flex-column gap-2">
                                    ${cardsAvailableToAdd.map(item => `
                                        <div class="d-flex justify-content-between align-items-center py-2 px-2.5 bg-dark bg-opacity-25 border border-secondary border-opacity-15 rounded-3 select-card-add-binder" data-id="${item.cardId}" data-name="${item.cardData.name}" style="cursor: pointer; transition: background 0.2s ease;">
                                            <div class="d-flex align-items-center gap-2">
                                                <img src="${item.cardData.images.small}" alt="${item.cardData.name}" style="height: 35px; border-radius: 2px;">
                                                <div>
                                                    <div class="fw-bold text-white" style="font-size: 0.8rem;">${item.cardData.name}</div>
                                                    <div class="text-secondary" style="font-size: 0.7rem;">${item.cardData.rarity || 'Comum'}</div>
                                                </div>
                                            </div>
                                            <span class="text-info fs-5"><i class="bi bi-plus-square"></i></span>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    public init(): void {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';

        // 1. Vincula cliques nas abas
        const tabButtons = document.querySelectorAll('.collection-header-tabs .tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab') as any;
                this.activeTab = tab;
                this.filterName = '';
                this.selectedFolderId = null; // limpa seleção de pasta ao trocar de aba
                this.reloadView();
            });
        });

        if (this.activeTab === 'collection') {
            this.initCollectionEvents(userId);
        } else if (this.activeTab === 'wishlist') {
            this.initWishlistEvents(userId);
        } else {
            this.initBindersEvents(userId);
        }
    }

    private reloadView(): void {
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = this.getTemplate();
            this.init();
        }
    }

    // --- LOGICA EVENTOS: COLEÇÃO ---
    private initCollectionEvents(userId: string): void {
        // Busca de texto
        const searchInput = document.getElementById('collection-search-input') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterName = searchInput.value;
                // Renderização parcial para evitar lag
                const collection = this.storageService.getCollection(userId);
                const filtered = collection.filter(item => 
                    item.cardData.name.toLowerCase().includes(this.filterName.toLowerCase())
                );
                
                // Recarrega apenas a lista para manter o foco no input
                this.reloadView();
                // Foca novamente no input e joga cursor ao final
                const refreshedInput = document.getElementById('collection-search-input') as HTMLInputElement;
                if (refreshedInput) {
                    refreshedInput.focus();
                    refreshedInput.setSelectionRange(refreshedInput.value.length, refreshedInput.value.length);
                }
            });
        }

        // Clique para escanear
        const cards = document.querySelectorAll('.collection-card-btn');
        cards.forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.getAttribute('data-id');
                if (cardId) {
                    this.scanCardOnPokedex(cardId);
                }
            });
        });

        // Formulário de Edição
        const editForm = document.getElementById('edit-card-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit(userId);
            });
        }
    }

    // --- LOGICA EVENTOS: WISHLIST ---
    private initWishlistEvents(userId: string): void {
        // Excluir item da Wishlist
        const deleteBtns = document.querySelectorAll('.btn-delete-wish');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id') || '';
                if (confirm('Deseja remover esta carta da sua wishlist?')) {
                    this.storageService.deleteWishlistItem(userId, id);
                    this.flashLED('red');
                    this.reloadView();
                }
            });
        });

        // Mover para Coleção ("Adquiri!")
        const acquireBtns = document.querySelectorAll('.btn-acquire');
        acquireBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const wishId = btn.getAttribute('data-id') || '';
                const wishlist = this.storageService.getWishlist(userId);
                const wishItem = wishlist.find(i => i.id === wishId);
                if (wishItem) {
                    // Remove da wishlist e adiciona na Coleção
                    this.storageService.deleteWishlistItem(userId, wishId);
                    
                    // Cria o item para o acervo de Coleção
                    const newCollectionItem: CollectionItem = {
                        id: 'col_' + Math.random().toString(36).substring(2, 9),
                        userId,
                        cardId: wishItem.cardId,
                        cardData: wishItem.cardData,
                        quantity: wishItem.quantity,
                        condition: 'NM',
                        isFoil: false,
                        dateAdded: new Date().toISOString()
                    };
                    this.storageService.addCollectionItem(userId, newCollectionItem);
                    
                    this.flashLED('green');
                    
                    // Informa e redireciona para a aba Coleção
                    this.activeTab = 'collection';
                    this.reloadView();
                }
            });
        });
    }

    // --- LOGICA EVENTOS: BINDERS ---
    private initBindersEvents(userId: string): void {
        if (this.selectedFolderId) {
            this.initFolderDetailEvents(userId);
            return;
        }

        // Abre modal de criação de pasta/binder
        const btnOpenCreate = document.getElementById('btn-open-create-modal');
        if (btnOpenCreate) {
            btnOpenCreate.addEventListener('click', () => {
                const modalElement = document.getElementById('createFolderModal');
                if (modalElement) {
                    // @ts-ignore
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            });
        }

        // Formulário de criação de binder
        const createForm = document.getElementById('create-folder-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('folder-name') as HTMLInputElement;
                const descInput = document.getElementById('folder-description') as HTMLInputElement;
                
                const name = nameInput ? nameInput.value.trim() : '';
                const desc = descInput ? descInput.value.trim() : '';

                if (name.length === 0) {
                    alert('Nome do binder é obrigatório.');
                    return;
                }

                this.storageService.addFolder(userId, name, desc);

                const modalElement = document.getElementById('createFolderModal');
                if (modalElement) {
                    // @ts-ignore
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }

                this.flashLED('green');
                this.reloadView();
            });
        }

        // Ver Binder (Entrar)
        const viewBtns = document.querySelectorAll('.view-folder-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (id) {
                    this.selectedFolderId = id;
                    this.reloadView();
                }
            });
        });

        // Deletar Binder
        const deleteBtns = document.querySelectorAll('.delete-folder-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (id && confirm('Excluir este binder? As cartas continuarão intactas na sua coleção principal.')) {
                    this.storageService.deleteFolder(userId, id);
                    this.flashLED('red');
                    this.reloadView();
                }
            });
        });
    }

    private initFolderDetailEvents(userId: string): void {
        // Voltar
        const backBtn = document.getElementById('back-to-folders');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.selectedFolderId = null;
                this.reloadView();
            });
        }

        // Clique nas cartas do binder para escanear na Pokédex
        const cards = document.querySelectorAll('.binder-slot .collection-card-btn');
        cards.forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.getAttribute('data-id');
                if (cardId) {
                    this.scanCardOnPokedex(cardId);
                }
            });
        });

        // Remover carta do binder
        const removeBtns = document.querySelectorAll('.remove-card-folder-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita abrir o scanner
                const cardId = btn.getAttribute('data-id') || '';
                const cardName = btn.getAttribute('data-name') || 'Carta';

                if (this.selectedFolderId && confirm(`Retirar ${cardName} do binder?`)) {
                    this.storageService.removeCardFromFolder(userId, this.selectedFolderId, cardId, cardName);
                    this.flashLED('red');
                    this.reloadView();
                }
            });
        });

        // Adicionar carta selecionada na lateral do binder
        const listItems = document.querySelectorAll('.select-card-add-binder');
        listItems.forEach(item => {
            item.addEventListener('click', () => {
                const cardId = item.getAttribute('data-id') || '';
                const cardName = item.getAttribute('data-name') || 'Carta';

                if (this.selectedFolderId) {
                    const folders = this.storageService.getFolders(userId);
                    const currentFolder = folders.find(f => f.id === this.selectedFolderId);
                    
                    if (currentFolder && currentFolder.cardIds.length >= 9) {
                        alert('Este binder (folha 3x3) está cheio! Limite de 9 slots.');
                        return;
                    }

                    const success = this.storageService.addCardToFolder(userId, this.selectedFolderId, cardId, cardName);
                    if (success) {
                        this.flashLED('green');
                        this.reloadView();
                    }
                }
            });
        });
    }

    // --- LEITURA / DETALHES DE UMA CARTA NO SCANNER DA POKEDEX (Esquerda) ---
    private scanCardOnPokedex(cardId: string): void {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';
        
        const collection = this.storageService.getCollection(userId);
        const item = collection.find(i => i.cardId === cardId);
        if (!item) return;

        const card = item.cardData;

        // Piscar led azul de scanner
        const lens = document.getElementById('pokedex-lens');
        if (lens) {
            lens.classList.add('scanning');
            setTimeout(() => lens.classList.remove('scanning'), 1000);
        }

        const pokedexScreen = document.getElementById('pokedex-screen');
        if (pokedexScreen) {
            pokedexScreen.innerHTML = `
                <div class="animate-fade p-1 d-flex flex-column h-100 justify-content-between">
                    <div>
                        <h6 class="scanner-active-title text-center mb-2" style="font-size: 0.8rem;">
                            <i class="bi bi-journal-check"></i> SCAN BINDER
                        </h6>
                        <div class="text-center mb-1">
                            <img src="${card.images.small}" alt="${card.name}" style="height: 125px; border-radius: 6px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); object-fit: contain;">
                        </div>
                        <div style="font-size: 0.7rem;" class="text-start mb-1">
                            <strong>Nome:</strong> ${card.name}<br>
                            <strong>Status:</strong> ${item.quantity} un (${this.translateCondition(item.condition)})<br>
                            <strong>Holográfico:</strong> ${item.isFoil ? 'Sim' : 'Não'}<br>
                            <strong>Valor Unit:</strong> $${(this.calculateCardPrice(item) / item.quantity).toFixed(2)}
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button class="btn btn-xs btn-outline-info w-50 py-1" id="btn-edit-collection" style="font-size: 0.7rem;">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-xs btn-outline-danger w-50 py-1" id="btn-delete-collection" style="font-size: 0.7rem;">
                            <i class="bi bi-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;

            // Vincula Editar
            const btnEdit = document.getElementById('btn-edit-collection');
            if (btnEdit) {
                btnEdit.addEventListener('click', () => {
                    this.editingItem = item;
                    
                    const nameDisp = document.getElementById('edit-card-name-display') as HTMLInputElement;
                    const qtyInput = document.getElementById('edit-quantity') as HTMLInputElement;
                    const conditionSelect = document.getElementById('edit-condition') as HTMLSelectElement;
                    const foilCheck = document.getElementById('edit-foil') as HTMLInputElement;

                    if (nameDisp) nameDisp.value = item.cardData.name;
                    if (qtyInput) qtyInput.value = item.quantity.toString();
                    if (conditionSelect) conditionSelect.value = item.condition;
                    if (foilCheck) foilCheck.checked = item.isFoil;

                    const modalElement = document.getElementById('editCardModal');
                    if (modalElement) {
                        // @ts-ignore
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                });
            }

            // Vincula Excluir
            const btnDelete = document.getElementById('btn-delete-collection');
            if (btnDelete) {
                btnDelete.addEventListener('click', () => {
                    if (confirm('Tem certeza que deseja remover esta carta da sua binder?')) {
                        this.storageService.deleteCollectionItem(userId, item.id);
                        this.flashLED('red');
                        
                        // Reseta pokedex screen
                        pokedexScreen.innerHTML = `
                            <div class="text-center text-secondary py-5">
                                <i class="bi bi-radar fs-2 mb-2 d-block opacity-25"></i>
                                Aguardando escaneamento...
                            </div>
                        `;

                        this.reloadView();
                    }
                });
            }
        }
    }

    private saveEdit(userId: string): void {
        if (!this.editingItem) return;

        const qtyInput = document.getElementById('edit-quantity') as HTMLInputElement;
        const conditionSelect = document.getElementById('edit-condition') as HTMLSelectElement;
        const foilCheck = document.getElementById('edit-foil') as HTMLInputElement;

        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        const condition = conditionSelect ? conditionSelect.value as any : 'NM';
        const isFoil = foilCheck ? foilCheck.checked : false;

        if (isNaN(quantity) || quantity <= 0) {
            alert('A quantidade deve ser de pelo menos 1.');
            return;
        }

        this.storageService.updateCollectionItem(userId, this.editingItem.id, quantity, condition, isFoil);

        const modalElement = document.getElementById('editCardModal');
        if (modalElement) {
            // @ts-ignore
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        this.flashLED('yellow');

        // Atualiza a Pokédex com os dados atualizados
        this.scanCardOnPokedex(this.editingItem.cardId);

        this.editingItem = null;
        this.reloadView();
    }

    private translateCondition(condition: string): string {
        switch(condition) {
            case 'M': return 'Mint (Impecável)';
            case 'NM': return 'Near Mint';
            case 'LP': return 'Lightly Played';
            case 'PL': return 'Played';
            default: return condition;
        }
    }

    private calculateCardPrice(item: CollectionItem): number {
        let basePrice = 1.50;
        const rarity = item.cardData.rarity ? item.cardData.rarity.toLowerCase() : '';
        
        if (rarity.includes('vmax')) basePrice = 18.00;
        else if (rarity.includes('v')) basePrice = 8.50;
        else if (rarity.includes('rare holo')) basePrice = 4.50;
        else if (rarity.includes('rare')) basePrice = 2.50;
        else if (rarity.includes('uncommon')) basePrice = 0.50;
        
        if (item.isFoil) basePrice *= 1.4;
        if (item.condition === 'M') basePrice *= 1.25;
        if (item.condition === 'LP') basePrice *= 0.75;
        if (item.condition === 'PL') basePrice *= 0.45;

        return basePrice * item.quantity;
    }

    private flashLED(color: 'green' | 'red' | 'yellow'): void {
        const led = document.getElementById(`led-${color}`);
        if (led) {
            led.classList.add('blinking');
            setTimeout(() => led.classList.remove('blinking'), 1000);
        }
    }
}
