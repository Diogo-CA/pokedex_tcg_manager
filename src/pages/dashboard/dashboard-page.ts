// src/pages/dashboard/dashboard-page.ts
import { Page } from '../page.js';
import { StorageService } from '../../services/storage.service.js';
import { AuthService } from '../../services/auth.service.js';

export class DashboardPage extends Page {
    private storageService: StorageService;
    private authService: AuthService;

    constructor(storageService: StorageService, authService: AuthService) {
        super();
        this.storageService = storageService;
        this.authService = authService;
    }

    public getTemplate(): string {
        const user = this.authService.getCurrentUser();
        const userId = user ? user.id : '';
        const userName = user ? user.name : 'Treinador';

        // Carrega dados reais do local storage
        const collection = this.storageService.getCollection(userId);
        const favorites = this.storageService.getFavorites(userId);
        const wishlist = this.storageService.getWishlist(userId);
        const folders = this.storageService.getFolders(userId);
        const transactions = this.storageService.getTransactions(userId).slice(0, 5); // 5 mais recentes

        // 1. Métricas
        const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueCards = collection.length;

        // 2. Cálculo do total estimado da Wishlist
        const totalWishlistValue = wishlist.reduce((sum, item) => {
            // Lógica de cálculo mockada para a wishlist
            const rarity = item.cardData.rarity ? item.cardData.rarity.toLowerCase() : '';
            let val = 2.50;
            if (rarity.includes('vmax')) val = 20.00;
            else if (rarity.includes('v')) val = 10.00;
            else if (rarity.includes('rare')) val = 5.00;
            return sum + (val * item.quantity);
        }, 0);

        // 3. Montar thumbnails sobrepostas para cada pasta
        const foldersWithDetails = folders.slice(0, 3).map(f => {
            const folderCardImages: string[] = [];
            // Coleta as imagens correspondentes aos cardIds na pasta
            f.cardIds.slice(0, 4).forEach(cid => {
                const item = collection.find(c => c.cardId === cid);
                if (item) {
                    folderCardImages.push(item.cardData.images.small);
                }
            });
            return {
                ...f,
                images: folderCardImages
            };
        });

        return /*html*/`
            <div class="animate-fade">
                <!-- Cabeçalho de Boas-vindas Moderno -->
                <div class="mb-4">
                    <h3 class="text-white mb-1">Olá, ${userName}!</h3>
                    <p class="text-secondary m-0" style="font-size: 0.95rem;">
                        Sua jornada como colecionador continua — você possui <strong class="text-info">${uniqueCards}</strong> cartas únicas no acervo.
                    </p>
                </div>

                <!-- Painel de Métricas de 4 Cards -->
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3">
                        <div class="glass-card d-flex align-items-center py-3">
                            <div class="fs-2 text-info me-3 ps-2"><i class="bi bi-collection"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">COLEÇÃO</h6>
                                <h4 class="text-white m-0 font-weight-bold">${totalCards} <span class="text-success" style="font-size: 0.75rem;">+${collection.slice(0, 3).reduce((sum, i) => sum + i.quantity, 0)}</span></h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="glass-card d-flex align-items-center py-3">
                            <div class="fs-2 text-warning me-3 ps-2"><i class="bi bi-stars"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">FAVORITAS</h6>
                                <h4 class="text-white m-0 font-weight-bold">${favorites.length}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="glass-card d-flex align-items-center py-3">
                            <div class="fs-2 text-danger me-3 ps-2"><i class="bi bi-heart-fill"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">WISHLIST</h6>
                                <h4 class="text-white m-0 font-weight-bold">${wishlist.length}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="glass-card d-flex align-items-center py-3">
                            <div class="fs-2 text-success me-3 ps-2"><i class="bi bi-folder2-open"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.75rem; letter-spacing: 0.5px;">BINDERS</h6>
                                <h4 class="text-white m-0 font-weight-bold">${folders.length}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-4">
                    <!-- Coluna da Esquerda: Atividade Recente -->
                    <div class="col-md-6">
                        <div class="glass-card h-100 d-flex flex-column" style="min-height: 380px;">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="text-white m-0" style="font-size: 0.95rem;"><i class="bi bi-activity text-info"></i> Atividade Recente</h5>
                                <a href="#/collection" class="text-info text-decoration-none" style="font-size: 0.8rem;">Ver tudo <i class="bi bi-arrow-right"></i></a>
                            </div>
                            
                            <div class="flex-grow-1 overflow-y-auto pe-1">
                                ${transactions.length === 0 ? `
                                    <div class="text-center py-5 my-4 text-secondary" style="font-size: 0.85rem;">
                                        <i class="bi bi-calendar-x fs-1 mb-2 d-block opacity-25"></i>
                                        Nenhuma atividade recente registrada.
                                    </div>
                                ` : `
                                    <ul class="list-group list-group-flush bg-transparent">
                                        ${transactions.map(tx => {
                                            const isInput = tx.action === 'INPUT';
                                            const badgeClass = isInput ? 'bg-success bg-opacity-15 text-success border-success' : 'bg-danger bg-opacity-15 text-danger border-danger';
                                            const timeString = new Date(tx.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) + ' ' + new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            return `
                                                <li class="list-group-item bg-transparent text-white border-secondary border-opacity-25 px-0 py-2.5 d-flex justify-content-between align-items-center" style="font-size: 0.82rem;">
                                                    <div>
                                                        <div class="fw-bold text-white">${tx.cardName}</div>
                                                        <span class="text-secondary" style="font-size: 0.75rem;">${tx.details}</span>
                                                    </div>
                                                    <div class="text-end">
                                                        <span class="badge border ${badgeClass}" style="font-size: 0.7rem;">
                                                            ${isInput ? '+' : '-'}${tx.quantity}
                                                        </span>
                                                        <div class="text-secondary mt-1" style="font-size: 0.65rem;">${timeString}</div>
                                                    </div>
                                                </li>
                                            `;
                                        }).join('')}
                                    </ul>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Coluna da Direita: Binders e Wishlist -->
                    <div class="col-md-6 d-flex flex-column gap-4">
                        <!-- Widget: Meus Binders -->
                        <div class="glass-card">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="text-white m-0" style="font-size: 0.95rem;"><i class="bi bi-journal-bookmark text-success"></i> Meus Binders</h5>
                                <a href="#/folders" class="text-success text-decoration-none" style="font-size: 0.8rem;">Ver todos <i class="bi bi-arrow-right"></i></a>
                            </div>

                            ${foldersWithDetails.length === 0 ? `
                                <div class="text-center py-4 text-secondary" style="font-size: 0.82rem;">
                                    Nenhum binder criado. Comece na aba Binders!
                                </div>
                            ` : `
                                <div class="d-flex flex-column gap-3">
                                    ${foldersWithDetails.map(f => {
                                        const totalInFolder = f.cardIds.length;
                                        const progressPercent = Math.min(100, Math.round((totalInFolder / 9) * 100)); // Base de 9 slots
                                        return `
                                            <div class="p-2.5 bg-dark bg-opacity-20 border border-secondary border-opacity-25 rounded-3 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div class="fw-bold text-white mb-1" style="font-size: 0.85rem;">${f.name}</div>
                                                    <div class="text-secondary mb-2" style="font-size: 0.75rem;">${totalInFolder} / 9 cartas organizadas</div>
                                                    <!-- Barra de Progresso Simples -->
                                                    <div style="width: 140px; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow:hidden;">
                                                        <div style="width: ${progressPercent}%; height: 100%; background: var(--pkdx-lens-blue); border-radius: 3px;"></div>
                                                    </div>
                                                </div>
                                                <!-- Miniatures -->
                                                <div class="binder-thumbnails pe-1">
                                                    ${f.images.length === 0 ? `
                                                        <div class="text-secondary opacity-50" style="font-size: 0.7rem;"><i class="bi bi-inbox fs-4"></i></div>
                                                    ` : f.images.map(img => `
                                                        <img src="${img}" class="binder-thumbnail-img" alt="Card preview">
                                                    `).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>

                        <!-- Widget: Wishlist Recente -->
                        <div class="glass-card">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5 class="text-white m-0" style="font-size: 0.95rem;"><i class="bi bi-heart text-danger"></i> Wishlist</h5>
                                <a href="#/collection" class="text-danger text-decoration-none" style="font-size: 0.8rem;">Ver tudo <i class="bi bi-arrow-right"></i></a>
                            </div>

                            ${wishlist.length === 0 ? `
                                <div class="text-center py-4 text-secondary" style="font-size: 0.82rem;">
                                    Sua wishlist está vazia. Adicione pelo catálogo!
                                </div>
                            ` : `
                                <div class="d-flex flex-column gap-2 mb-3">
                                    ${wishlist.slice(0, 3).map(item => {
                                        let priorityLabel = 'Baixa';
                                        let priorityClass = 'wishlist-priority-low';
                                        if (item.priority === 'high') { priorityLabel = 'Alta'; priorityClass = 'wishlist-priority-high'; }
                                        else if (item.priority === 'medium') { priorityLabel = 'Média'; priorityClass = 'wishlist-priority-medium'; }

                                        return `
                                            <div class="d-flex align-items-center justify-content-between py-1.5 px-2 bg-dark bg-opacity-20 border border-secondary border-opacity-10 rounded-2" style="font-size: 0.8rem;">
                                                <div class="d-flex align-items-center">
                                                    <img src="${item.cardData.images.small}" alt="${item.cardData.name}" style="height: 32px; border-radius: 2px; margin-right: 10px; object-fit: contain;">
                                                    <div>
                                                        <span class="fw-bold text-white text-truncate d-inline-block" style="max-width: 140px; vertical-align: bottom;">${item.cardData.name}</span>
                                                        <div class="text-secondary" style="font-size: 0.7rem;">Nº ${item.cardData.number}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="badge ${priorityClass} px-2 py-0.5" style="font-size: 0.65rem;">${priorityLabel}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                                <div class="d-flex justify-content-between align-items-center pt-2.5 border-top border-secondary border-opacity-25" style="font-size: 0.85rem;">
                                    <span class="text-secondary">Valor Total Estimado:</span>
                                    <strong class="text-success">$${totalWishlistValue.toFixed(2)} USD</strong>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    public init(): void {
        // Nada de eventos específicos aqui
    }
}
