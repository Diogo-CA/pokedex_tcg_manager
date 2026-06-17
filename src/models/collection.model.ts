// src/models/collection.model.ts
import type { PokemonCardData } from './card.model.js';

export interface CollectionItem {
    id: string; // ID da entrada na coleção (ex: hash ou UUID do local)
    userId: string;
    cardId: string;
    cardData: PokemonCardData; // Cache dos dados da carta para exibição instantânea
    quantity: number;
    condition: 'M' | 'NM' | 'LP' | 'PL'; // Mint, Near Mint, Lightly Played, Played
    isFoil: boolean;
    dateAdded: string;
}
