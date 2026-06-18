// src/pages/catalog/catalog-page.ts
import { Page } from '../page.js';
import { PokemonTcgService } from '../../services/pokemon.service.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { PokemonCardData } from '../../models/card.model.js';
import type { CollectionItem } from '../../models/collection.model.js';
import type { WishlistItem } from '../../models/wishlist.model.js';

export class CatalogPage extends Page {
    private pokemonService: PokemonTcgService;
    private storageService: StorageService;
    private authService: AuthService;
    
    private cards: PokemonCardData[] = [];
    private loading: boolean = false;
    private selectedCardForAdd: PokemonCardData | null = null;
    
    // Filtros de busca (API)
    private searchName: string = '';
    private searchType: string = '';
    private searchRarity: string = '';

    // Filtros de status local (Mockup/Sidebar)
    private filterCollection: boolean = false;
    private filterWishlist: boolean = false;
    private filterFavorites: boolean = false;
    private filterNotOwned: boolean = false;

    // Filtros de expansão local (Mockup/Sidebar)
    private filterSets: string[] = []; // Ex: ['base1', 'jungle', 'fossil', 'rocket', 'gym']

    constructor(pokemonService: PokemonTcgService, storageService: StorageService, authService: AuthService) {
        super();
        this.pokemonService = pokemonService;
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';

        // Obter estados locais do usuário para overlays e filtros
        const userCollection = this.storageService.getCollection(userId);
        const userWishlist = this.storageService.getWishlist(userId);
        const userFavorites = this.storageService.getFavorites(userId);

        // Mapeamento de tipos para os botões circulares da Sidebar
        const types = [
            { id: 'Grass', label: 'Grama', class: 'grass' },
            { id: 'Fire', label: 'Fogo', class: 'fire' },
            { id: 'Water', label: 'Água', class: 'water' },
            { id: 'Lightning', label: 'Elétrico', class: 'lightning' },
            { id: 'Psychic', label: 'Psíquico', class: 'psychic' },
            { id: 'Fighting', label: 'Lutador', class: 'fighting' },
            { id: 'Darkness', label: 'Sombrio', class: 'darkness' },
            { id: 'Metal', label: 'Metal', class: 'metal' },
            { id: 'Dragon', label: 'Dragão', class: 'dragon' },
            { id: 'Colorless', label: 'Incolor', class: 'colorless' },
            { id: 'Fairy', label: 'Fada', class: 'fairy' }
        ];

        // Mapeamento de raridades e expansões
        const rarities = [
            { id: 'Common', label: 'Comum' },
            { id: 'Uncommon', label: 'Incomum' },
            { id: 'Rare', label: 'Rara' },
            { id: 'Rare Holo', label: 'Holo Rara' }
        ];

        const expansions = [
            { id: 'base1', label: 'Base Set' },
            { id: 'jungle', label: 'Jungle' },
            { id: 'fossil', label: 'Fossil' },
            { id: 'rocket', label: 'Team Rocket' },
            { id: 'gym', label: 'Gym Heroes' }
        ];

        // Filtragem local
        let filteredCards = [...this.cards];

        // 1. Filtragem por Status do Acervo
        if (this.filterCollection || this.filterWishlist || this.filterFavorites || this.filterNotOwned) {
            filteredCards = filteredCards.filter(card => {
                const inCollection = userCollection.some(item => item.cardId === card.id);
                const inWishlist = userWishlist.some(item => item.cardId === card.id);
                const inFavorites = userFavorites.includes(card.id);

                let match = false;
                if (this.filterCollection && inCollection) match = true;
                if (this.filterWishlist && inWishlist) match = true;
                if (this.filterFavorites && inFavorites) match = true;
                if (this.filterNotOwned && !inCollection) match = true;
                return match;
            });
        }

        // 2. Filtragem por Expansão Local
        if (this.filterSets.length > 0) {
            filteredCards = filteredCards.filter(card => {
                return this.filterSets.some(setPrefix => card.id.toLowerCase().startsWith(setPrefix.toLowerCase()));
            });
        }

        return `
            <div class="animate-fade">
                <!-- Layout Grid do Catálogo (Sidebar + Grade) -->
                <div class="catalog-layout">
                    
                    <!-- Sidebar de Filtros (Esquerda) -->
                    <aside class="glass-card d-flex flex-column gap-3 py-3" style="max-height: 620px; overflow-y: auto;">
                        <h6 class="text-white border-bottom border-secondary border-opacity-25 pb-2 mb-0" style="font-size: 0.85rem;"><i class="bi bi-funnel"></i> FILTROS</h6>

                        <!-- Grupo: Status -->
                        <div>
                            <span class="text-secondary d-block mb-2 fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">STATUS</span>
                            <div class="d-flex flex-column gap-1.5" style="font-size: 0.8rem;">
                                <div class="form-check form-check-inline m-0">
                                    <input class="form-check-input filter-status-chk" type="checkbox" id="chk-in-col" ${this.filterCollection ? 'checked' : ''}>
                                    <label class="form-check-label text-white" for="chk-in-col">Na coleção</label>
                                </div>
                                <div class="form-check form-check-inline m-0">
                                    <input class="form-check-input filter-status-chk" type="checkbox" id="chk-in-wish" ${this.filterWishlist ? 'checked' : ''}>
                                    <label class="form-check-label text-white" for="chk-in-wish">Na wishlist</label>
                                </div>
                                <div class="form-check form-check-inline m-0">
                                    <input class="form-check-input filter-status-chk" type="checkbox" id="chk-in-favs" ${this.filterFavorites ? 'checked' : ''}>
                                    <label class="form-check-label text-white" for="chk-in-favs">Favoritas</label>
                                </div>
                                <div class="form-check form-check-inline m-0">
                                    <input class="form-check-input filter-status-chk" type="checkbox" id="chk-not-owned" ${this.filterNotOwned ? 'checked' : ''}>
                                    <label class="form-check-label text-white" for="chk-not-owned">Não tenho</label>
                                </div>
                            </div>
                        </div>

                        <!-- Grupo: Tipo -->
                        <div>
                            <span class="text-secondary d-block mb-2 fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">TIPO</span>
                            <div class="type-filter-container">
                                ${types.map(t => {
                                    const activeClass = this.searchType === t.id ? `active ${t.class}` : '';
                                    return `<span class="type-filter-pill ${activeClass}" data-type="${t.id}">${t.label}</span>`;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Grupo: Raridade -->
                        <div>
                            <span class="text-secondary d-block mb-2 fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">RARIDADE</span>
                            <div class="d-flex flex-column gap-1.5" style="font-size: 0.8rem;">
                                ${rarities.map(r => `
                                    <div class="form-check m-0">
                                        <input class="form-check-input filter-rarity-chk" type="checkbox" id="rarity-${r.id}" value="${r.id}" ${this.searchRarity === r.id ? 'checked' : ''}>
                                        <label class="form-check-label text-white" for="rarity-${r.id}">${r.label}</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Grupo: Expansão -->
                        <div>
                            <span class="text-secondary d-block mb-2 fw-bold" style="font-size: 0.72rem; letter-spacing: 0.5px;">EXPANSÃO</span>
                            <div class="d-flex flex-column gap-1.5" style="font-size: 0.8rem;">
                                ${expansions.map(e => `
                                    <div class="form-check m-0">
                                        <input class="form-check-input filter-set-chk" type="checkbox" id="set-${e.id}" value="${e.id}" ${this.filterSets.includes(e.id) ? 'checked' : ''}>
                                        <label class="form-check-label text-white" for="set-${e.id}">${e.label}</label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </aside>

                    <!-- Área da Grade de Cartas (Direita) -->
                    <div class="d-flex flex-column gap-3">
                        
                        <!-- Barra de Busca de Cima -->
                        <div class="glass-card py-2.5 px-3">
                            <form id="filter-form" class="row g-2 align-items-center">
                                <div class="col-md-9 position-relative">
                                    <input type="text" id="search-name" class="form-control form-control-sm ps-4" placeholder="Buscar por nome no catálogo..." value="${this.searchName}">
                                    <i class="bi bi-search position-absolute text-secondary" style="left: 12px; top: 7px; font-size: 0.85rem;"></i>
                                </div>
                                <div class="col-md-3">
                                    <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-1"><i class="bi bi-search"></i> Buscar na API</button>
                                </div>
                            </form>
                        </div>

                        <!-- Header de Resultados -->
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="text-white m-0" style="font-size: 0.95rem;">
                                ${filteredCards.length} cartas encontradas
                            </h5>
                            <span class="text-secondary" style="font-size: 0.8rem;">Clique na carta para detalhes no scanner</span>
                        </div>

                        <!-- Carregando / Grade -->
                        ${this.loading ? `
                            <div class="text-center py-5">
                                <div class="spinner-border text-info" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                                <p class="text-secondary mt-2" style="font-size: 0.85rem;">Sintonizando frequências de rádio Pokémon...</p>
                            </div>
                        ` : `
                            ${filteredCards.length === 0 ? `
                                <div class="text-center py-5 text-secondary glass-card">
                                    <i class="bi bi-search-heart fs-1 mb-2 d-block opacity-25"></i>
                                    Nenhuma carta correspondente encontrada.
                                </div>
                            ` : `
                                <div class="row row-cols-2 row-cols-md-4 g-3 overflow-y-auto" style="max-height: 480px; padding-bottom: 20px;">
                                    ${filteredCards.map(card => {
                                        // Calcular overlays
                                        const colItem = userCollection.find(item => item.cardId === card.id);
                                        const qtyInCol = colItem ? colItem.quantity : 0;
                                        const isFav = userFavorites.includes(card.id);
                                        const isWish = userWishlist.some(item => item.cardId === card.id);
                                        
                                        const rarityDisplay = card.rarity || 'Comum';
                                        const type = (card.types && card.types[0]) ? card.types[0] : 'Colorless';
                                        
                                        // Preço mockado coerente
                                        const cardPrice = this.calculateMockPrice(card);

                                        return `
                                            <div class="col pokemon-card-container">
                                                <div class="pokemon-card position-relative card-btn" data-id="${card.id}">
                                                    <img src="${card.images.small}" alt="${card.name}" loading="lazy">
                                                    
                                                    <!-- Overlay: Quantidade na Coleção (Top-Left) -->
                                                    ${qtyInCol > 0 ? `
                                                        <div class="card-overlay-indicator check-qty" title="Você tem ${qtyInCol} no acervo">
                                                            <i class="bi bi-check-lg"></i> x${qtyInCol}
                                                        </div>
                                                    ` : ''}

                                                    <!-- Overlay: Estrela de Favorito (Top-Right) -->
                                                    <button class="card-overlay-btn favorite-btn ${isFav ? 'active' : ''}" data-id="${card.id}" title="${isFav ? 'Remover dos favoritos' : 'Favoritar carta'}">
                                                        <i class="bi ${isFav ? 'star-fill' : 'star'}"></i>
                                                    </button>

                                                    <!-- Overlay: Coração de Wishlist (Bottom-Right) -->
                                                    <button class="card-overlay-btn wishlist-btn ${isWish ? 'active' : ''}" data-id="${card.id}" title="${isWish ? 'Remover da wishlist' : 'Adicionar à wishlist'}">
                                                        <i class="bi ${isWish ? 'heart-fill' : 'heart'}"></i>
                                                    </button>
                                                </div>
                                                <div class="mt-2 px-1">
                                                    <div class="d-flex justify-content-between align-items-center">
                                                        <span class="fw-bold text-white text-truncate" style="font-size: 0.75rem; max-width: 65%;">${card.name}</span>
                                                        <span class="badge-energy energy-${type.toLowerCase()}" style="font-size: 0.6rem; padding: 2px 6px;">
                                                            ${type}
                                                        </span>
                                                    </div>
                                                    <div class="d-flex justify-content-between align-items-center mt-1" style="font-size: 0.7rem;">
                                                        <span class="text-secondary">${card.number} / ${rarityDisplay}</span>
                                                        <span class="text-success fw-bold">$${cardPrice.toFixed(2)} USD</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        `}
                    </div>

                </div>

                <!-- Modal de Inclusão no Acervo -->
                <div class="modal fade" id="addCardModal" tabindex="-1" aria-hidden="true" style="backdrop-filter: blur(5px);">
                    <div class="modal-dialog modal-dialog-centered modal-sm">
                        <div class="modal-content bg-dark border border-secondary text-white">
                            <div class="modal-header border-secondary border-opacity-25 pb-2">
                                <h6 class="modal-title" id="addCardModalLabel">Adicionar à Binder</h6>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body py-3">
                                <form id="add-card-form">
                                    <input type="hidden" id="add-card-id">
                                    <div class="mb-2">
                                        <label class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Pokémon</label>
                                        <input type="text" id="add-card-name-display" class="form-control form-control-sm text-secondary bg-transparent border-0 px-0 fw-bold" readonly>
                                    </div>
                                    <div class="mb-2">
                                        <label for="add-quantity" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Quantidade</label>
                                        <input type="number" id="add-quantity" class="form-control form-control-sm" min="1" value="1" required>
                                    </div>
                                    <div class="mb-2">
                                        <label for="add-condition" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Estado de Conservação</label>
                                        <select id="add-condition" class="form-select form-select-sm" required>
                                            <option value="M">Mint (Impecável)</option>
                                            <option value="NM" selected>Near Mint (Quase Impecável)</option>
                                            <option value="LP">Lightly Played (Pouco Usada)</option>
                                            <option value="PL">Played (Usada/Desgastada)</option>
                                        </select>
                                    </div>
                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input" type="checkbox" role="switch" id="add-foil">
                                        <label class="form-check-label text-info" for="add-foil" style="font-size: 0.8rem;"><i class="bi bi-stars"></i> Holográfica (Foil)</label>
                                    </div>
                                    <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-2">INSERIR NO ACERVO</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    public async init(): Promise<void> {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';

        // 1. Carrega dados na inicialização se vazio
        if (this.cards.length === 0) {
            await this.fetchCards();
        }

        // 2. Evento do Formulário de Busca API
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('search-name') as HTMLInputElement;
                this.searchName = nameInput ? nameInput.value : '';
                await this.fetchCards();
            });
        }

        // 3. Evento nos Filtros de Tipo (Sidebar)
        const typePills = document.querySelectorAll('.type-filter-pill');
        typePills.forEach(pill => {
            pill.addEventListener('click', async () => {
                const selectedType = pill.getAttribute('data-type') || '';
                
                // Toggle do tipo
                if (this.searchType === selectedType) {
                    this.searchType = ''; // limpa
                } else {
                    this.searchType = selectedType;
                }
                
                await this.fetchCards();
            });
        });

        // 4. Eventos nos Filtros de Raridade (Sidebar)
        const rarityCheckboxes = document.querySelectorAll('.filter-rarity-chk');
        rarityCheckboxes.forEach(chk => {
            chk.addEventListener('change', async () => {
                const el = chk as HTMLInputElement;
                if (el.checked) {
                    this.searchRarity = el.value;
                } else {
                    this.searchRarity = '';
                }
                // Desmarca outros checkboxes de raridade
                rarityCheckboxes.forEach(o => {
                    const other = o as HTMLInputElement;
                    if (other.value !== this.searchRarity) {
                        other.checked = false;
                    }
                });

                await this.fetchCards();
            });
        });

        // 5. Eventos nos Filtros de Status (Sidebar Local)
        const statusCheckboxes = document.querySelectorAll('.filter-status-chk');
        statusCheckboxes.forEach(chk => {
            chk.addEventListener('change', () => {
                const id = chk.getAttribute('id');
                const isChecked = (chk as HTMLInputElement).checked;

                if (id === 'chk-in-col') this.filterCollection = isChecked;
                else if (id === 'chk-in-wish') this.filterWishlist = isChecked;
                else if (id === 'chk-in-favs') this.filterFavorites = isChecked;
                else if (id === 'chk-not-owned') this.filterNotOwned = isChecked;

                this.reloadView();
            });
        });

        // 6. Eventos nos Filtros de Expansão (Sidebar Local)
        const setCheckboxes = document.querySelectorAll('.filter-set-chk');
        setCheckboxes.forEach(chk => {
            chk.addEventListener('change', () => {
                const val = (chk as HTMLInputElement).value;
                const isChecked = (chk as HTMLInputElement).checked;

                if (isChecked) {
                    if (!this.filterSets.includes(val)) this.filterSets.push(val);
                } else {
                    this.filterSets = this.filterSets.filter(s => s !== val);
                }

                this.reloadView();
            });
        });

        // 7. Eventos de clique nas imagens dos cards para escanear na Pokédex (Lado Esquerdo)
        const cardElements = document.querySelectorAll('.card-btn');
        cardElements.forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.getAttribute('data-id');
                if (cardId) {
                    this.handleCardClick(cardId);
                }
            });
        });

        // 8. Eventos de atalho rápido: Favoritar (Estrela)
        const favBtns = document.querySelectorAll('.favorite-btn');
        favBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita acionar o scanner de Pokédex
                const cardId = btn.getAttribute('data-id') || '';
                
                const active = this.storageService.toggleFavorite(userId, cardId);
                
                // Feedback visual nos leds da Pokedex
                const ledColor = active ? 'yellow' : 'red';
                const led = document.getElementById(`led-${ledColor}`);
                if (led) {
                    led.classList.add('blinking');
                    setTimeout(() => led.classList.remove('blinking'), 1000);
                }

                this.reloadView();
            });
        });

        // 9. Eventos de atalho rápido: Wishlist (Coração)
        const wishBtns = document.querySelectorAll('.wishlist-btn');
        wishBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita acionar o scanner de Pokédex
                const cardId = btn.getAttribute('data-id') || '';
                
                const wishlistItems = this.storageService.getWishlist(userId);
                const wishIndex = wishlistItems.findIndex(i => i.cardId === cardId);

                if (wishIndex > -1) {
                    const item = wishlistItems[wishIndex];
                    if (item) {
                        this.storageService.deleteWishlistItem(userId, item.id);
                        this.flashLED('red');
                    }
                } else {
                    // Adiciona nova carta à Wishlist com prioridade média e quantidade 1
                    const card = this.cards.find(c => c.id === cardId);
                    if (card) {
                        const newWish: WishlistItem = {
                            id: 'wish_' + Math.random().toString(36).substring(2, 9),
                            userId,
                            cardId,
                            cardData: card,
                            quantity: 1,
                            priority: 'medium',
                            dateAdded: new Date().toISOString()
                        };
                        this.storageService.addWishlistItem(userId, newWish);
                        this.flashLED('green');
                    }
                }

                this.reloadView();
            });
        });

        // 10. Evento de envio do formulário de inclusão
        const addCardForm = document.getElementById('add-card-form');
        if (addCardForm) {
            addCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveToCollection();
            });
        }
    }

    private async fetchCards(): Promise<void> {
        this.loading = true;
        this.reloadView();

        this.cards = await this.pokemonService.searchCards(this.searchName, this.searchType, this.searchRarity);
        
        this.loading = false;
        this.reloadView();
    }

    private reloadView(): void {
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = this.getTemplate();
            this.init();
        }
    }

    private async handleCardClick(cardId: string): Promise<void> {
        const card = this.cards.find(c => c.id === cardId) || await this.pokemonService.getCardById(cardId);
        if (!card) return;

        this.selectedCardForAdd = card;

        // Visual scanner pulse
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
                            <i class="bi bi-radar"></i> SCANNER ATIVO
                        </h6>
                        <div class="text-center mb-2">
                            <img src="${card.images.small}" alt="${card.name}" style="height: 135px; border-radius: 6px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); object-fit: contain;">
                        </div>
                        <div style="font-size: 0.72rem;" class="text-start">
                            <strong>Nome:</strong> ${card.name}<br>
                            <strong>Nº:</strong> ${card.number} | <strong>Tipo:</strong> ${card.types?.join('/') || 'Colorless'}<br>
                            <strong>Raridade:</strong> ${card.rarity || 'Comum'}<br>
                            <strong>Preço Est:</strong> $${this.calculateMockPrice(card).toFixed(2)} USD<br>
                        </div>
                    </div>
                    <button class="btn btn-outline-info btn-xs w-100 py-1 mt-1" id="btn-modal-add" style="font-size: 0.75rem;">
                        <i class="bi bi-plus-lg"></i> Adicionar à Coleção
                    </button>
                </div>
            `;
            
            const btnOpenModal = document.getElementById('btn-modal-add');
            if (btnOpenModal) {
                btnOpenModal.addEventListener('click', () => {
                    this.openAddModal();
                });
            }
        }
    }

    private openAddModal(): void {
        if (!this.selectedCardForAdd) return;

        const addCardId = document.getElementById('add-card-id') as HTMLInputElement;
        const addCardName = document.getElementById('add-card-name-display') as HTMLInputElement;
        const qtyInput = document.getElementById('add-quantity') as HTMLInputElement;
        const foilCheck = document.getElementById('add-foil') as HTMLInputElement;

        if (addCardId) addCardId.value = this.selectedCardForAdd.id;
        if (addCardName) addCardName.value = this.selectedCardForAdd.name;
        if (qtyInput) qtyInput.value = '1';
        if (foilCheck) foilCheck.checked = false;

        const modalElement = document.getElementById('addCardModal');
        if (modalElement) {
            // @ts-ignore
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    private saveToCollection(): void {
        const user = this.authService.getCurrentUser();
        if (!user || !this.selectedCardForAdd) return;

        const qtyInput = document.getElementById('add-quantity') as HTMLInputElement;
        const conditionSelect = document.getElementById('add-condition') as HTMLSelectElement;
        const foilCheck = document.getElementById('add-foil') as HTMLInputElement;

        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        const condition = conditionSelect ? conditionSelect.value as any : 'NM';
        const isFoil = foilCheck ? foilCheck.checked : false;

        if (isNaN(quantity) || quantity <= 0) {
            alert('A quantidade deve ser pelo menos 1.');
            return;
        }

        const newItem: CollectionItem = {
            id: 'col_' + Math.random().toString(36).substring(2, 9),
            userId: user.id,
            cardId: this.selectedCardForAdd.id,
            cardData: this.selectedCardForAdd,
            quantity,
            condition,
            isFoil,
            dateAdded: new Date().toISOString()
        };

        this.storageService.addCollectionItem(user.id, newItem);

        const modalElement = document.getElementById('addCardModal');
        if (modalElement) {
            // @ts-ignore
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        this.flashLED('green');

        // Restaura a tela original da Pokédex
        const pokedexScreen = document.getElementById('pokedex-screen');
        if (pokedexScreen) {
            pokedexScreen.innerHTML = `
                <div class="animate-fade text-center p-3">
                    <span class="text-success fs-1 d-block mb-2"><i class="bi bi-check2-circle"></i></span>
                    <h6 class="text-success m-0" style="font-size: 0.85rem;">ADICIONADO COM SUCESSO!</h6>
                    <p class="text-secondary mt-1 mb-0" style="font-size: 0.7rem;">Cartas sincronizadas no acervo local.</p>
                </div>
            `;
            setTimeout(() => {
                if (pokedexScreen && this.selectedCardForAdd === null) {
                    pokedexScreen.innerHTML = `
                        <div class="text-center text-secondary py-5">
                            <i class="bi bi-radar fs-2 mb-2 d-block opacity-25"></i>
                            Aguardando escaneamento...
                        </div>
                    `;
                }
            }, 2000);
        }
        
        this.selectedCardForAdd = null;
        this.reloadView();
    }

    private flashLED(color: 'green' | 'red' | 'yellow'): void {
        const led = document.getElementById(`led-${color}`);
        if (led) {
            led.classList.add('blinking');
            setTimeout(() => led.classList.remove('blinking'), 1200);
        }
    }

    private calculateMockPrice(card: PokemonCardData): number {
        const rarity = card.rarity ? card.rarity.toLowerCase() : '';
        let basePrice = 1.50;
        if (rarity.includes('vmax')) basePrice = 18.00;
        else if (rarity.includes('v')) basePrice = 8.50;
        else if (rarity.includes('rare holo')) basePrice = 4.50;
        else if (rarity.includes('rare')) basePrice = 2.50;
        else if (rarity.includes('uncommon')) basePrice = 0.50;
        return basePrice;
    }
}
