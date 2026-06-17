// src/models/folder.model.ts

export interface Folder {
    id: string;
    userId: string;
    name: string;
    description: string;
    cardIds: string[]; // Lista de IDs de cartas (cardId do TCG) adicionadas nesta pasta
    dateCreated: string;
}
