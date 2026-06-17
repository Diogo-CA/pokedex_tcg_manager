// src/pages/folders/folders-page.ts
import { Page } from '../page.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';
import type { Folder } from '../../models/folder.model.js';
import type { CollectionItem } from '../../models/collection.model.js';

export class FoldersPage extends Page {
    private storageService: StorageService;
    private authService: AuthService;
    private selectedFolderId: string | null = null; // Pasta ativa sendo visualizada

    constructor(storageService: StorageService, authService: AuthService) {
        super();
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userId = user?.id || '';
        const folders = this.storageService.getFolders(userId);

        if (this.selectedFolderId) {
            const folder = folders.find(f => f.id === this.selectedFolderId);
            if (folder) {
                return this.getFolderDetailTemplate(userId, folder);
            }
        }

        return `
            <div class="animate-fade">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="text-white m-0"><i class="bi bi-folder2-open"></i> Minhas Pastas de Organização</h4>
                    <button class="btn pokedex-btn-dark btn-sm" id="btn-open-create-modal">
                        <i class="bi bi-folder-plus"></i> Criar Nova Pasta
                    </button>
                </div>

                <!-- Lista de Pastas -->
                ${folders.length === 0 ? `
                    <div class="text-center py-5 text-secondary glass-card">
                        <i class="bi bi-folder-x fs-1 mb-2 d-block opacity-25"></i>
                        Você não possui nenhuma pasta de organização.<br>
                        Clique em "Criar Nova Pasta" para começar a categorizar suas cartas!
                    </div>
                ` : `
                    <div class="row g-3">
                        ${folders.map(f => `
                            <div class="col-md-6">
                                <div class="glass-card d-flex flex-column justify-content-between h-100">
                                    <div>
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <h5 class="text-white m-0">${f.name}</h5>
                                            <span class="badge bg-dark border border-secondary border-opacity-50 text-secondary" style="font-size: 0.75rem;">
                                                ${f.cardIds.length} cartas
                                            </span>
                                        </div>
                                        <p class="text-secondary mb-3" style="font-size: 0.85rem; min-height: 40px;">
                                            ${f.description || 'Sem descrição.'}
                                        </p>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary border-opacity-25">
                                        <span class="text-secondary" style="font-size: 0.75rem;">
                                            Criada em: ${new Date(f.dateCreated).toLocaleDateString()}
                                        </span>
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
                        `).join('')}
                    </div>
                `}

                <!-- Modal de Criação de Pasta (CRUD 3 Create) -->
                <div class="modal fade" id="createFolderModal" tabindex="-1" aria-hidden="true" style="backdrop-filter: blur(5px);">
                    <div class="modal-dialog modal-dialog-centered modal-sm">
                        <div class="modal-content bg-dark border border-secondary text-white">
                            <div class="modal-header border-secondary border-opacity-25 pb-2">
                                <h6 class="modal-title">Nova Pasta</h6>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body py-3">
                                <form id="create-folder-form">
                                    <div class="mb-3">
                                        <label for="folder-name" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Nome da Pasta</label>
                                        <input type="text" id="folder-name" class="form-control form-control-sm" placeholder="Ex: Cartas Raras, Trocas, etc." required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="folder-description" class="form-label text-secondary mb-1" style="font-size: 0.75rem;">Descrição (Objetivo)</label>
                                        <textarea id="folder-description" class="form-control form-control-sm" rows="3" placeholder="Para que serve esta pasta?"></textarea>
                                    </div>
                                    <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-2">CRIAR CATEGORIA</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    private getFolderDetailTemplate(userId: string, folder: Folder): string {
        const collection = this.storageService.getCollection(userId);

        // Mapeia os cardIds da pasta para as cartas reais do acervo
        const folderCards = collection.filter(item => folder.cardIds.includes(item.cardId));

        // Filtra cartas da coleção que NÃO estão na pasta para podermos adicionar
        const cardsAvailableToAdd = collection.filter(item => !folder.cardIds.includes(item.cardId));

        return `
            <div class="animate-fade">
                <!-- Cabeçalho de Navegação Retorno -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <a href="javascript:void(0)" id="back-to-folders" class="text-info text-decoration-none" style="font-size: 0.9rem;">
                            <i class="bi bi-chevron-left"></i> Voltar para Pastas
                        </a>
                        <h4 class="text-white mt-2 mb-1">${folder.name}</h4>
                        <p class="text-secondary m-0" style="font-size: 0.85rem;">${folder.description || 'Sem descrição.'}</p>
                    </div>
                    <span class="badge bg-dark border border-secondary border-opacity-50 text-info py-2 px-3">
                        Total: ${folderCards.length} cartas
                    </span>
                </div>

                <!-- Formulário Rápido para Adicionar Cartas do Acervo nesta Pasta (Movimentação) -->
                <div class="glass-card mb-4">
                    <h6 class="text-white mb-2" style="font-size: 0.8rem;"><i class="bi bi-plus-circle"></i> Adicionar Carta do Acervo nesta Pasta</h6>
                    ${cardsAvailableToAdd.length === 0 ? `
                        <p class="text-secondary m-0" style="font-size: 0.8rem;">Todas as cartas do seu acervo já estão organizadas nesta pasta.</p>
                    ` : `
                        <form id="add-to-folder-form" class="row g-2">
                            <div class="col-md-9">
                                <select id="select-card-to-add" class="form-select form-select-sm" required>
                                    <option value="" disabled selected>Selecione uma carta do seu acervo binder...</option>
                                    ${cardsAvailableToAdd.map(item => `
                                        <option value="${item.cardId}" data-name="${item.cardData.name}">${item.cardData.name} (${item.cardData.rarity || 'Comum'})</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <button type="submit" class="btn pokedex-btn-dark btn-sm w-100 py-1">INSERIR NA PASTA</button>
                            </div>
                        </form>
                    `}
                </div>

                <!-- Grade de Cartas da Pasta -->
                ${folderCards.length === 0 ? `
                    <div class="text-center py-5 text-secondary glass-card">
                        <i class="bi bi-inbox fs-1 mb-2 d-block opacity-25"></i>
                        Esta pasta está vazia. Adicione cartas acima para organizá-la!
                    </div>
                ` : `
                    <div class="row row-cols-2 row-cols-md-4 g-3">
                        ${folderCards.map(item => `
                            <div class="col pokemon-card-container">
                                <div class="pokemon-card folder-card-btn" data-id="${item.cardId}">
                                    <img src="${item.cardData.images.small}" alt="${item.cardData.name}" loading="lazy">
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2 px-1">
                                    <span class="fw-bold text-white text-truncate" style="font-size: 0.8rem; max-width: 60%;">${item.cardData.name}</span>
                                    <button class="btn btn-outline-danger btn-xs py-0 px-2 remove-card-folder-btn" data-id="${item.cardId}" data-name="${item.cardData.name}" title="Remover da pasta">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }

    public init(): void {
        const user = this.authService.getCurrentUser();
        const userId = user?.id || '';

        if (this.selectedFolderId) {
            this.initFolderDetailEvents(userId);
            return;
        }

        // --- Eventos da Lista Geral de Pastas ---
        
        // 1. Abre modal de criação de pasta
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

        // 2. Cria pasta após submissão de formulário
        const createForm = document.getElementById('create-folder-form');
        if (createForm) {
            createForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nameInput = document.getElementById('folder-name') as HTMLInputElement;
                const descInput = document.getElementById('folder-description') as HTMLInputElement;
                
                const name = nameInput ? nameInput.value.trim() : '';
                const desc = descInput ? descInput.value.trim() : '';

                if (name.length === 0) {
                    alert('Nome da pasta é obrigatório.');
                    return;
                }

                this.storageService.addFolder(userId, name, desc);

                // Fecha modal
                const modalElement = document.getElementById('createFolderModal');
                if (modalElement) {
                    // @ts-ignore
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }

                // Pisca LED verde
                const ledGreen = document.getElementById('led-green');
                if (ledGreen) {
                    ledGreen.classList.add('blinking');
                    setTimeout(() => ledGreen.classList.remove('blinking'), 1200);
                }

                // Recarrega
                const container = document.getElementById('dashboard-content');
                if (container) {
                    container.innerHTML = this.getTemplate();
                    this.init();
                }
            });
        }

        // 3. Entra nos detalhes de uma pasta
        const viewBtns = document.querySelectorAll('.view-folder-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (id) {
                    this.selectedFolderId = id;
                    // Recarrega
                    const container = document.getElementById('dashboard-content');
                    if (container) {
                        container.innerHTML = this.getTemplate();
                        this.init();
                    }
                }
            });
        });

        // 4. Exclui pasta (Delete)
        const deleteBtns = document.querySelectorAll('.delete-folder-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (id && confirm('Tem certeza que deseja excluir esta pasta de organização? As cartas continuarão seguras no seu acervo.')) {
                    this.storageService.deleteFolder(userId, id);
                    
                    // Pisca LED vermelho
                    const ledRed = document.getElementById('led-red');
                    if (ledRed) {
                        ledRed.classList.add('blinking');
                        setTimeout(() => ledRed.classList.remove('blinking'), 1200);
                    }

                    // Recarrega
                    const container = document.getElementById('dashboard-content');
                    if (container) {
                        container.innerHTML = this.getTemplate();
                        this.init();
                    }
                }
            });
        });
    }

    private initFolderDetailEvents(userId: string): void {
        // 1. Botão de voltar
        const backBtn = document.getElementById('back-to-folders');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.selectedFolderId = null;
                // Recarrega
                const container = document.getElementById('dashboard-content');
                if (container) {
                    container.innerHTML = this.getTemplate();
                    this.init();
                }
            });
        }

        // 2. Clique em cartas da pasta para escanear na Pokedex
        const folderCardElements = document.querySelectorAll('.folder-card-btn');
        folderCardElements.forEach(el => {
            el.addEventListener('click', () => {
                const cardId = el.getAttribute('data-id');
                if (cardId) {
                    this.scanCardFromFolder(userId, cardId);
                }
            });
        });

        // 3. Adicionar carta à pasta
        const addToFolderForm = document.getElementById('add-to-folder-form');
        if (addToFolderForm) {
            addToFolderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const selectElement = document.getElementById('select-card-to-add') as HTMLSelectElement;
                if (selectElement && selectElement.value && this.selectedFolderId) {
                    const cardId = selectElement.value;
                    const selectedOption = selectElement.options[selectElement.selectedIndex];
                    const cardName = selectedOption ? selectedOption.getAttribute('data-name') || 'Carta' : 'Carta';

                    const success = this.storageService.addCardToFolder(userId, this.selectedFolderId, cardId, cardName);
                    
                    if (success) {
                        // Pisca LED verde
                        const ledGreen = document.getElementById('led-green');
                        if (ledGreen) {
                            ledGreen.classList.add('blinking');
                            setTimeout(() => ledGreen.classList.remove('blinking'), 1000);
                        }

                        // Recarrega
                        const container = document.getElementById('dashboard-content');
                        if (container) {
                            container.innerHTML = this.getTemplate();
                            this.init();
                        }
                    }
                }
            });
        }

        // 4. Remover carta da pasta
        const removeBtns = document.querySelectorAll('.remove-card-folder-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita disparar o click da carta/scanner
                const cardId = btn.getAttribute('data-id');
                const cardName = btn.getAttribute('data-name') || 'Carta';
                
                if (cardId && this.selectedFolderId && confirm(`Deseja retirar ${cardName} desta pasta?`)) {
                    this.storageService.removeCardFromFolder(userId, this.selectedFolderId, cardId, cardName);
                    
                    // Pisca LED vermelho
                    const ledRed = document.getElementById('led-red');
                    if (ledRed) {
                        ledRed.classList.add('blinking');
                        setTimeout(() => ledRed.classList.remove('blinking'), 1000);
                    }

                    // Recarrega
                    const container = document.getElementById('dashboard-content');
                    if (container) {
                        container.innerHTML = this.getTemplate();
                        this.init();
                    }
                }
            });
        });
    }

    private scanCardFromFolder(userId: string, cardId: string): void {
        const collection = this.storageService.getCollection(userId);
        const item = collection.find(i => i.cardId === cardId);
        if (!item) return;

        const card = item.cardData;

        // Visual Scanner
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
                            <i class="bi bi-folder2"></i> SCAN CATEGORY
                        </h6>
                        <div class="text-center mb-2">
                            <img src="${card.images.small}" alt="${card.name}" style="height: 140px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 240, 255, 0.5); object-fit: contain;">
                        </div>
                        <div style="font-size: 0.72rem;" class="text-start">
                            <strong>Nome:</strong> ${card.name}<br>
                            <strong>Binder:</strong> ${item.quantity} un (${item.condition})<br>
                            <strong>Tipo:</strong> ${card.types?.join('/') || 'Colorless'}<br>
                            <strong>Número:</strong> ${card.number}<br>
                        </div>
                    </div>
                    <div class="text-center text-info" style="font-size: 0.7rem;">
                        Classificada nesta pasta
                    </div>
                </div>
            `;
        }
    }
}
