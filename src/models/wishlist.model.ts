// src/models/wishlist.model.ts
import type { PokemonCardData } from './card.model.js';

export interface WishlistItem {
    id: string;
    userId: string;
    cardId: string;
    cardData: PokemonCardData;
    quantity: number;
    priority: 'high' | 'medium' | 'low';
    dateAdded: string;
}
