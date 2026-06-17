// src/pages/collection/collection-page.ts
import { Page } from '../page.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { CollectionItem } from '../../models/collection.model.js';

export class CollectionPage extends Page {
    private storageService: StorageService;
    private authService: AuthService;
    private filterName: string = '';
    private editingItem: CollectionItem | null = null;

    constructor(storageService: StorageService, authService: AuthService) {
        super();
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const collection = this.storageService.getCollection(user?.id || '');

        // Filtragem local por nome
        const filteredCollection = collection.filter(item => 
            item.cardData.name.toLowerCase().includes(this.filterName.toLowerCase())
        );

        // Calcular Valor Estimado da Coleção (Efeito Visual Tema Colecionador)
        const totalValue = collection.reduce((sum, item) => sum + this.calculateCardPrice(item), 0);
        const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0);

        return `
            <div class="animate-fade">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="text-white m-0"><i class="bi bi-journal-album"></i> Meu Acervo Binder</h4>
                    <div class="text-end">
                        <span class="badge bg-success py-2 px-3 border border-success border-opacity-25" style="font-size: 0.9rem;">
                            Valor Estimado: $${totalValue.toFixed(2)} USD
                        </span>
                    </div>
                </div>

                <!-- Barra de Pesquisa e Filtros -->
                <div class="glass-card mb-4">
                    <div class="row g-2 align-items-center">
                        <div class="col-md-9">
                            <input type="text" id="filter-collection-name" class="form-control form-control-sm" placeholder="Filtrar por nome na minha pasta..." value="${this.filterName}">
                        </div>
                        <div class="col-md-3 text-end">
                            <span class="text-secondary" style="font-size: 0.85rem;">Mostrando: ${filteredCollection.length} de ${collection.length} tipos</span>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Cards da Coleção (Visual Compacto) -->
                ${filteredCollection.length === 0 ? `
                    <div class="text-center py-5 text-secondary glass-card">
                        <i class="bi bi-folder-symlink fs-1 mb-2 d-block opacity-25"></i>
                        A sua pasta binder está vazia ou nenhuma correspondência foi encontrada.<br>
                        Vá para o <a href="#/catalog" class="text-info text-decoration-none">Catálogo</a> para escanear novas cartas!
                    </div>
                ` : `
                    <div class="glass-card p-0 overflow-hidden">
                        <div class="table-responsive">
                            <table class="table table-dark table-hover align-middle m-0" style="font-size: 0.85rem;">
                                <thead>
                                    <tr class="text-secondary">
                                        <th class="ps-3" style="width: 80px;">Mini</th>
                                        <th>Nome</th>
                                        <th>Tipo</th>
                                        <th>Raridade</th>
                                        <th class="text-center">Quantidade</th>
                                        <th class="text-center">Estado</th>
                                        <th class="text-center">Foil</th>
                                        <th class="text-end">Valor Est.</th>
                                        <th class="text-end pe-3" style="width: 150px;">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredCollection.map(item => {
                                        const cardValue = this.calculateCardPrice(item);
                                        const type = item.cardData.types ? item.cardData.types[0] : 'Colorless';
                                        return `
                                            <tr class="border-secondary border-opacity-25">
                                                <td class="ps-3">
                                                    <img src="${item.cardData.images.small}" alt="${item.cardData.name}" style="height: 50px; border-radius: 4px; object-fit: contain; cursor: pointer;" class="item-img" data-id="${item.cardId}">
                                                </td>
                                                <td>
                                                    <span class="fw-bold text-white">${item.cardData.name}</span>
                                                    <div class="text-secondary" style="font-size: 0.75rem;">Nº ${item.cardData.number}</div>
                                                </td>
                                                <td>
                                                    <span class="badge-energy energy-${type ? type.toLowerCase() : 'colorless'}" style="font-size: 0.65rem;">
                                                        ${type}
                                                    </span>
                                                </td>
                                                <td class="text-secondary">${item.cardData.rarity || 'Comum'}</td>
                                                <td class="text-center fw-bold text-info">${item.quantity}</td>
                                                <td class="text-center">
                                                    <span class="badge bg-secondary" style="font-size: 0.7rem;">
                                                        ${this.translateCondition(item.condition)}
                                                    </span>
                                                </td>
                                                <td class="text-center">
                                                    ${item.isFoil ? `
                                                        <span class="text-warning" style="font-size: 0.95rem;"><i class="bi bi-stars"></i> Sim</span>
                                                    ` : `
                                                        <span class="text-secondary">-</span>
                                                    `}
                                                </td>
                                                <td class="text-end fw-bold text-success">$${cardValue.toFixed(2)}</td>
                                                <td class="text-end pe-3">
                                                    <button class="btn btn-outline-info btn-xs edit-btn me-1" data-id="${item.id}" title="Editar quantidade/estado">
                                                        <i class="bi bi-pencil"></i>
                                                    </button>
                                                    <button class="btn btn-outline-danger btn-xs delete-btn" data-id="${item.id}" title="Remover da coleção">
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

                <!-- Modal de Edição de Card (CRUD 2 Update) -->
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

            </div>
        `;
    }

    public init(): void {
        const user = this.authService.getCurrentUser();
        const userId = user?.id || '';

        // 1. Vincula pesquisa de texto com atraso pequeno
        const searchInput = document.getElementById('filter-collection-name') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.filterName = searchInput.value;
                // Atualiza tela
                const container = document.getElementById('dashboard-content');
                if (container) {
                    container.innerHTML = this.getTemplate();
                    this.init(); // re-vincula
                }
            });
        }

        // 2. Vincula ações de clique em imagens para "escanear" na Pokedex à esquerda
        const images = document.querySelectorAll('.item-img');
        images.forEach(img => {
            img.addEventListener('click', () => {
                const cardId = img.getAttribute('data-id');
                if (cardId) {
                    this.scanCardOnPokedex(cardId);
                }
            });
        });

        // 3. Botão Editar (Abre o Modal com valores)
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-id');
                const items = this.storageService.getCollection(userId);
                const item = items.find(i => i.id === itemId);
                if (item) {
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
                }
            });
        });

        // 4. Salvar Edição do Form (com validação)
        const editForm = document.getElementById('edit-card-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEdit(userId);
            });
        }

        // 5. Botão Excluir (Deleta da coleção)
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-id');
                if (itemId && confirm('Tem certeza que deseja remover esta carta da sua binder?')) {
                    this.storageService.deleteCollectionItem(userId, itemId);
                    
                    // Pisca LED vermelho indicando saída
                    const ledRed = document.getElementById('led-red');
                    if (ledRed) {
                        ledRed.classList.add('blinking');
                        setTimeout(() => ledRed.classList.remove('blinking'), 1200);
                    }

                    // Atualiza tela
                    const container = document.getElementById('dashboard-content');
                    if (container) {
                        container.innerHTML = this.getTemplate();
                        this.init();
                    }
                }
            });
        });
    }

    private saveEdit(userId: string): void {
        if (!this.editingItem) return;

        const qtyInput = document.getElementById('edit-quantity') as HTMLInputElement;
        const conditionSelect = document.getElementById('edit-condition') as HTMLSelectElement;
        const foilCheck = document.getElementById('edit-foil') as HTMLInputElement;

        const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
        const condition = conditionSelect ? conditionSelect.value as any : 'NM';
        const isFoil = foilCheck ? foilCheck.checked : false;

        // Validação
        if (isNaN(quantity) || quantity <= 0) {
            alert('A quantidade deve ser de pelo menos 1.');
            return;
        }

        this.storageService.updateCollectionItem(userId, this.editingItem.id, quantity, condition, isFoil);

        // Fecha Modal
        const modalElement = document.getElementById('editCardModal');
        if (modalElement) {
            // @ts-ignore
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();
        }

        // Pisca LED amarelo para sucesso
        const ledYellow = document.getElementById('led-yellow');
        if (ledYellow) {
            ledYellow.classList.add('blinking');
            setTimeout(() => ledYellow.classList.remove('blinking'), 1200);
        }

        // Atualiza tela
        const container = document.getElementById('dashboard-content');
        if (container) {
            container.innerHTML = this.getTemplate();
            this.init();
        }

        this.editingItem = null;
    }

    private scanCardOnPokedex(cardId: string): void {
        const user = this.authService.getCurrentUser();
        const collection = this.storageService.getCollection(user?.id || '');
        const item = collection.find(i => i.cardId === cardId);
        if (!item) return;

        const card = item.cardData;

        // Pisca e roda animação na Pokédex
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
                        <div class="text-center mb-2">
                            <img src="${card.images.small}" alt="${card.name}" style="height: 140px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); object-fit: contain;">
                        </div>
                        <div style="font-size: 0.72rem;" class="text-start">
                            <strong>Nome:</strong> ${card.name}<br>
                            <strong>Status:</strong> ${item.quantity} unidades (${this.translateCondition(item.condition)})<br>
                            <strong>Holográfico:</strong> ${item.isFoil ? 'Sim' : 'Não'}<br>
                            <strong>Nº:</strong> ${card.number} | <strong>Raridade:</strong> ${card.rarity || 'Comum'}<br>
                        </div>
                    </div>
                    <div class="text-center text-success fw-bold" style="font-size: 0.75rem;">
                        Valor Unit: $${(this.calculateCardPrice(item) / item.quantity).toFixed(2)}
                    </div>
                </div>
            `;
        }
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
        // Lógica simples e coerente de precificação mockada
        let basePrice = 1.50; // Preço base comum
        const rarity = item.cardData.rarity ? item.cardData.rarity.toLowerCase() : '';
        
        if (rarity.includes('vmax')) {
            basePrice = 18.00;
        } else if (rarity.includes('v')) {
            basePrice = 8.50;
        } else if (rarity.includes('rare holo')) {
            basePrice = 4.50;
        } else if (rarity.includes('rare')) {
            basePrice = 2.50;
        } else if (rarity.includes('uncommon')) {
            basePrice = 0.50;
        }
        
        // Fatores de valorização
        if (item.isFoil) basePrice *= 1.4; // +40% por ser brilhante
        if (item.condition === 'M') basePrice *= 1.25; // +25% se estado impecável
        if (item.condition === 'LP') basePrice *= 0.75; // -25% se usada
        if (item.condition === 'PL') basePrice *= 0.45; // -55% se desgastada

        return basePrice * item.quantity;
    }
}
