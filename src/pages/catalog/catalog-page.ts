// src/pages/catalog/catalog-page.ts
import { Page } from '../page.js';
import { PokemonTcgService } from '../../services/pokemon.service.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { PokemonCardData } from '../../models/card.model.js';
import type { CollectionItem } from '../../models/collection.model.js';

export class CatalogPage extends Page {
    private pokemonService: PokemonTcgService;
    private storageService: StorageService;
    private authService: AuthService;
    
    private cards: PokemonCardData[] = [];
    private loading: boolean = false;
    private selectedCardForAdd: PokemonCardData | null = null;
    
    // Filtros atuais
    private searchName: string = '';
    private searchType: string = '';
    private searchRarity: string = '';

    constructor(pokemonService: PokemonTcgService, storageService: StorageService, authService: AuthService) {
        super();
        this.pokemonService = pokemonService;
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        // Tipos e raridades para preencher os selects
        const types = ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless', 'Fairy'];
        const rarities = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Holo V', 'Rare Holo VMAX'];

        return `
            <div class="animate-fade">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white m-0"><i class="bi bi-search"></i> Catálogo de Cartas</h4>
                    <span class="text-secondary" style="font-size: 0.85rem;">Clique em uma carta para escaneá-la e adicioná-la</span>
                </div>

                <!-- Formulário de Filtros (Pesquisa) -->
                <div class="glass-card mb-4">
                    <form id="filter-form" class="row g-2">
                        <div class="col-md-5">
                            <input type="text" id="search-name" class="form-control form-control-sm" placeholder="Nome do Pokémon (ex: Pikachu)..." value="${this.searchName}">
                        </div>
                        <div class="col-md-3">
                            <select id="search-type" class="form-select form-select-sm">
                                <option value="">Todos os Tipos</option>
                                ${types.map(t => `<option value="${t}" ${this.searchType === t ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-3">
                            <select id="search-rarity" class="form-select form-select-sm">
                                <option value="">Todas as Raridades</option>
                                ${rarities.map(r => `<option value="${r}" ${this.searchRarity === r ? 'selected' : ''}>${r}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-md-1">
                            <button type="submit" class="btn pokedex-btn-dark btn-sm w-100"><i class="bi bi-search"></i></button>
                        </div>
                    </form>
                </div>

                <!-- Área de Grade de Cartas -->
                ${this.loading ? `
                    <div class="text-center py-5">
                        <div class="spinner-border text-info" role="status">
                            <span class="visually-hidden">Buscando cartas...</span>
                        </div>
                        <p class="text-secondary mt-2" style="font-size: 0.9rem;">Buscando dados com o scanner da Pokédex...</p>
                    </div>
                ` : `
                    ${this.cards.length === 0 ? `
                        <div class="text-center py-5 text-secondary">
                            <i class="bi bi-search fs-1 mb-2 d-block opacity-25"></i>
                            Nenhuma carta encontrada. Tente redefinir seus filtros.
                        </div>
                    ` : `
                        <div class="row row-cols-2 row-cols-md-4 g-3">
                            ${this.cards.map(card => `
                                <div class="col pokemon-card-container">
                                    <div class="pokemon-card card-btn" data-id="${card.id}">
                                        <img src="${card.images.small}" alt="${card.name}" loading="lazy">
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-2 px-1">
                                        <span class="fw-bold text-white text-truncate" style="font-size: 0.8rem; max-width: 70%;">${card.name}</span>
                                        <span class="badge-energy energy-${(card.types && card.types[0]) ? card.types[0].toLowerCase() : 'colorless'}" style="font-size: 0.65rem;">
                                            ${(card.types && card.types[0]) ? card.types[0] : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                `}

                <!-- Modal de Inclusão de Coleção (Gerado dinamicamente para fácil manipulação no vanilla) -->
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
        // Inicia com uma busca inicial por padrão se o catálogo estiver vazio
        if (this.cards.length === 0) {
            await this.fetchCards();
        }

        // Adiciona escuta do formulário de filtros
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const nameInput = document.getElementById('search-name') as HTMLInputElement;
                const typeSelect = document.getElementById('search-type') as HTMLSelectElement;
                const raritySelect = document.getElementById('search-rarity') as HTMLSelectElement;
                
                this.searchName = nameInput ? nameInput.value : '';
                this.searchType = typeSelect ? typeSelect.value : '';
                this.searchRarity = raritySelect ? raritySelect.value : '';
                
                await this.fetchCards();
            });
        }

        // Adiciona escuta para cliques nas cartas (Escaneamento e Inclusão)
        const cardElements = document.querySelectorAll('.card-btn');
        cardElements.forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.getAttribute('data-id');
                if (cardId) {
                    this.handleCardClick(cardId);
                }
            });
        });

        // Adiciona escuta para submissão do formulário de inclusão na coleção
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
        // Re-renderiza para mostrar o spinner de carregamento
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = this.getTemplate();
        }

        this.cards = await this.pokemonService.searchCards(this.searchName, this.searchType, this.searchRarity);
        
        this.loading = false;
        // Renderiza a grade de cartas
        if (container) {
            container.innerHTML = this.getTemplate();
            await this.init(); // Re-vincula eventos
        }
    }

    private async handleCardClick(cardId: string): Promise<void> {
        const card = this.cards.find(c => c.id === cardId) || await this.pokemonService.getCardById(cardId);
        if (!card) return;

        this.selectedCardForAdd = card;

        // --- Efeito Visual de Scanner na Pokédex ---
        // 1. Acende a lente azul piscando
        const lens = document.getElementById('pokedex-lens');
        if (lens) {
            lens.classList.add('scanning');
            setTimeout(() => lens.classList.remove('scanning'), 1000);
        }
        
        // 2. Pisca o LED verde de sucesso
        const ledGreen = document.getElementById('led-green');
        if (ledGreen) {
            ledGreen.classList.add('blinking');
            setTimeout(() => ledGreen.classList.remove('blinking'), 1000);
        }

        // 3. Atualiza o mini screen da tampa
        const miniScreen = document.getElementById('mini-status-screen');
        if (miniScreen) {
            miniScreen.innerHTML = `Escaneado:<br>${card.name}`;
        }

        // 4. Injeta os dados da carta na tela da Pokédex (Lado Esquerdo)
        const pokedexScreen = document.getElementById('pokedex-screen');
        if (pokedexScreen) {
            pokedexScreen.innerHTML = `
                <div class="animate-fade p-1 d-flex flex-column h-100 justify-content-between">
                    <div>
                        <h6 class="scanner-active-title text-center mb-2" style="font-size: 0.8rem;">
                            <i class="bi bi-radar"></i> SCANNER ATIVO
                        </h6>
                        <div class="text-center mb-2">
                            <img src="${card.images.small}" alt="${card.name}" style="height: 140px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); object-fit: contain;">
                        </div>
                        <div style="font-size: 0.75rem;" class="text-start">
                            <strong>Nome:</strong> ${card.name}<br>
                            <strong>Nº:</strong> ${card.number} | <strong>Tipo:</strong> ${card.types?.join('/') || 'Colorless'}<br>
                            <strong>Raridade:</strong> ${card.rarity || 'Comum'}<br>
                            <strong>Artista:</strong> ${card.artist || 'Desconhecido'}<br>
                        </div>
                    </div>
                    <button class="btn btn-outline-info btn-xs w-100 py-1 mt-2" id="btn-modal-add" style="font-size: 0.75rem;">
                        <i class="bi bi-plus-lg"></i> Adicionar à Coleção
                    </button>
                </div>
            `;
            
            // Adiciona escuta para abrir o modal de inclusão através da tela da Pokedex
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

        // Dispara o Modal do Bootstrap usando o JS nativo
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

        // Validação do Formulário (Requisito do trabalho)
        if (isNaN(quantity) || quantity <= 0) {
            alert('Por favor, insira uma quantidade maior ou igual a 1.');
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

        // Salva
        this.storageService.addCollectionItem(user.id, newItem);

        // Fecha o Modal (nativa do Bootstrap)
        const modalElement = document.getElementById('addCardModal');
        if (modalElement) {
            // @ts-ignore
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        // Dá feedback piscando o LED verde
        const ledGreen = document.getElementById('led-green');
        if (ledGreen) {
            ledGreen.classList.add('blinking');
            setTimeout(() => ledGreen.classList.remove('blinking'), 1500);
        }

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
                // Após 2 segundos, limpa a tela para instrução de escanear novamente
                if (pokedexScreen && this.selectedCardForAdd === null) {
                    pokedexScreen.innerHTML = `
                        <div class="text-center text-secondary py-5">
                            <i class="bi bi-radar fs-2 mb-2 d-block opacity-25"></i>
                            Aguardando escaneamento...
                        </div>
                    `;
                }
            }, 2500);
        }
        
        // Zera seleção atual
        this.selectedCardForAdd = null;
    }
}
