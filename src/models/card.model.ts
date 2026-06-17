// src/models/card.model.ts

export interface PokemonCardData {
    id: string;
    name: string;
    supertype: string;
    subtypes?: string[];
    types?: string[];
    images: {
        small: string;
        large: string;
    };
    rarity?: string;
    number: string;
    artist?: string;
}
