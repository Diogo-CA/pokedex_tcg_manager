// src/models/transaction.model.ts

export interface Transaction {
    id: string;
    userId: string;
    cardName: string;
    action: 'INPUT' | 'OUTPUT'; // INPUT = Adicionar ou aumentar estoque, OUTPUT = Remover ou diminuir estoque
    quantity: number;
    details: string; // Ex: "Adicionado à Coleção", "Excluído da Coleção", "Movido para Pasta X"
    timestamp: string;
}
