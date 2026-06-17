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
        const userName = user ? user.name : 'Treinador';
        
        const collection = this.storageService.getCollection(user?.id || '');
        const folders = this.storageService.getFolders(user?.id || '');
        const transactions = this.storageService.getTransactions(user?.id || '').slice(0, 5); // Apenas as 5 mais recentes

        // 1. Calcular total de cartas e itens únicos
        const totalCards = collection.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueCards = collection.length;

        // 2. Calcular distribuição de tipos para o gráfico em CSS
        const typeCounts: { [type: string]: number } = {};
        collection.forEach(item => {
            const types = item.cardData.types || ['Outro'];
            types.forEach(t => {
                typeCounts[t] = (typeCounts[t] || 0) + item.quantity;
            });
        });

        // Ordena os tipos por quantidade descrescente
        const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        const maxTypeVal = sortedTypes.length > 0 && sortedTypes[0] ? sortedTypes[0][1] : 1;

        // Cores CSS mapeadas para o gráfico
        const typeColors: { [t: string]: string } = {
            Grass: 'var(--tcg-grass)',
            Fire: 'var(--tcg-fire)',
            Water: 'var(--tcg-water)',
            Lightning: 'var(--tcg-lightning)',
            Psychic: 'var(--tcg-psychic)',
            Fighting: 'var(--tcg-fighting)',
            Darkness: 'var(--tcg-darkness)',
            Metal: 'var(--tcg-metal)',
            Dragon: 'var(--tcg-dragon)',
            Colorless: 'var(--tcg-colorless)',
            Fairy: 'var(--tcg-fairy)'
        };

        return `
            <div class="animate-fade">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 class="text-white mb-1">Bem-vindo de volta, ${userName}!</h4>
                        <p class="text-secondary m-0" style="font-size: 0.9rem;">Aqui está o resumo do seu acervo de colecionador.</p>
                    </div>
                    <span class="badge bg-dark border border-secondary border-opacity-50 py-2 px-3">
                        <i class="bi bi-clock-history"></i> Sessão Ativa
                    </span>
                </div>

                <!-- Painel de Métricas Rápidas -->
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="glass-card d-flex align-items-center">
                            <div class="fs-1 text-info me-3"><i class="bi bi-collection"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.8rem;">TOTAL DE CARTAS</h6>
                                <h3 class="text-white m-0 font-weight-bold">${totalCards}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card d-flex align-items-center">
                            <div class="fs-1 text-warning me-3"><i class="bi bi-journal-check"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.8rem;">ITENS ÚNICOS</h6>
                                <h3 class="text-white m-0 font-weight-bold">${uniqueCards}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="glass-card d-flex align-items-center">
                            <div class="fs-1 text-success me-3"><i class="bi bi-folder2"></i></div>
                            <div>
                                <h6 class="text-secondary mb-1" style="font-size: 0.8rem;">PASTAS CRIADAS</h6>
                                <h3 class="text-white m-0 font-weight-bold">${folders.length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-4">
                    <!-- Gráfico de Tipos em CSS Puro (Requisito de Front-end Agradável) -->
                    <div class="col-md-7">
                        <div class="glass-card h-100">
                            <h5 class="text-white mb-3" style="font-size: 1rem;"><i class="bi bi-bar-chart-fill"></i> Tipos na Coleção</h5>
                            
                            ${sortedTypes.length === 0 ? `
                                <div class="text-center py-5 text-secondary" style="font-size: 0.9rem;">
                                    <i class="bi bi-bar-chart fs-1 mb-2 d-block opacity-25"></i>
                                    Nenhuma carta adicionada para gerar estatísticas.
                                </div>
                            ` : `
                                <div class="graph-container">
                                    ${sortedTypes.map(([type, count]) => {
                                        const percentage = Math.max(10, (count / maxTypeVal) * 100);
                                        const color = typeColors[type] || '#888';
                                        return `
                                            <div class="graph-row">
                                                <div class="graph-label text-secondary">${type}</div>
                                                <div class="graph-bar-outer">
                                                    <div class="graph-bar-inner" style="width: ${percentage}%; background-color: ${color};"></div>
                                                </div>
                                                <div class="graph-value text-white">${count}</div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Log de Movimentações (Histórico/Estoque - Requisito de Movimentação) -->
                    <div class="col-md-5">
                        <div class="glass-card h-100 d-flex flex-column">
                            <h5 class="text-white mb-3" style="font-size: 1rem;"><i class="bi bi-activity"></i> Movimentações Recentes</h5>
                            
                            <div class="flex-grow-1 overflow-y-auto" style="max-height: 250px;">
                                ${transactions.length === 0 ? `
                                    <div class="text-center py-5 text-secondary" style="font-size: 0.9rem;">
                                        <i class="bi bi-receipt-cutoff fs-1 mb-2 d-block opacity-25"></i>
                                        Nenhum registro de movimentação.
                                    </div>
                                ` : `
                                    <ul class="list-group list-group-flush bg-transparent">
                                        ${transactions.map(tx => {
                                            const isInput = tx.action === 'INPUT';
                                            const badgeClass = isInput ? 'bg-success bg-opacity-25 text-success border-success' : 'bg-danger bg-opacity-25 text-danger border-danger';
                                            const timeString = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            return `
                                                <li class="list-group-item bg-transparent text-white border-secondary border-opacity-25 px-0 py-2 d-flex justify-content-between align-items-start" style="font-size: 0.8rem;">
                                                    <div>
                                                        <div class="font-weight-bold text-white">${tx.cardName}</div>
                                                        <span class="text-secondary">${tx.details}</span>
                                                    </div>
                                                    <div class="text-end">
                                                        <span class="badge border ${badgeClass}">
                                                            ${isInput ? '+' : '-'}${tx.quantity}
                                                        </span>
                                                        <div class="text-secondary mt-1" style="font-size: 0.7rem;">${timeString}</div>
                                                    </div>
                                                </li>
                                            `;
                                        }).join('')}
                                    </ul>
                                `}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    public init(): void {
        // Sem eventos complexos nesta tela, apenas exibição de métricas
    }
}
