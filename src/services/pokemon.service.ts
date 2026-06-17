// src/services/pokemon.service.ts
import type { PokemonCardData } from '../models/card.model.js';

export class PokemonTcgService {
    private baseUrl = 'https://api.pokemontcg.io/v2/cards';
    private cache: Map<string, PokemonCardData[]> = new Map();

    // Banco de dados local para funcionamento offline (Fallback)
    private offlineBackupCards: PokemonCardData[] = [
        {
            id: 'xy1-46',
            name: 'Charizard-EX',
            supertype: 'Pokémon',
            subtypes: ['Basic', 'EX'],
            types: ['Fire'],
            images: {
                small: 'https://images.pokemontcg.io/xy1/46.png',
                large: 'https://images.pokemontcg.io/xy1/46_hires.png'
            },
            rarity: 'Rare Holo EX',
            number: '46',
            artist: 'Eske Yoshinob'
        },
        {
            id: 'base1-4',
            name: 'Charizard',
            supertype: 'Pokémon',
            subtypes: ['Stage 2'],
            types: ['Fire'],
            images: {
                small: 'https://images.pokemontcg.io/base1/4.png',
                large: 'https://images.pokemontcg.io/base1/4_hires.png'
            },
            rarity: 'Rare Holo',
            number: '4',
            artist: 'Mitsuhiro Arita'
        },
        {
            id: 'base1-58',
            name: 'Pikachu',
            supertype: 'Pokémon',
            subtypes: ['Basic'],
            types: ['Lightning'],
            images: {
                small: 'https://images.pokemontcg.io/base1/58.png',
                large: 'https://images.pokemontcg.io/base1/58_hires.png'
            },
            rarity: 'Common',
            number: '58',
            artist: 'Mitsuhiro Arita'
        },
        {
            id: 'swsh1-120',
            name: 'Snorlax VMAX',
            supertype: 'Pokémon',
            subtypes: ['VMAX'],
            types: ['Colorless'],
            images: {
                small: 'https://images.pokemontcg.io/swsh1/120.png',
                large: 'https://images.pokemontcg.io/swsh1/120_hires.png'
            },
            rarity: 'Rare Holo VMAX',
            number: '120',
            artist: 'aKy CG Works'
        },
        {
            id: 'swsh1-1',
            name: 'Celebi V',
            supertype: 'Pokémon',
            subtypes: ['Basic', 'V'],
            types: ['Grass'],
            images: {
                small: 'https://images.pokemontcg.io/swsh1/1.png',
                large: 'https://images.pokemontcg.io/swsh1/1_hires.png'
            },
            rarity: 'Rare Holo V',
            number: '1',
            artist: 'Mitsuhiro Arita'
        },
        {
            id: 'swsh1-22',
            name: 'Victini V',
            supertype: 'Pokémon',
            subtypes: ['Basic', 'V'],
            types: ['Fire'],
            images: {
                small: 'https://images.pokemontcg.io/swsh1/22.png',
                large: 'https://images.pokemontcg.io/swsh1/22_hires.png'
            },
            rarity: 'Rare Holo V',
            number: '22',
            artist: 'Planeta Mochizuki'
        },
        {
            id: 'swsh1-44',
            name: 'Keldeo V',
            supertype: 'Pokémon',
            subtypes: ['Basic', 'V'],
            types: ['Water'],
            images: {
                small: 'https://images.pokemontcg.io/swsh1/44.png',
                large: 'https://images.pokemontcg.io/swsh1/44_hires.png'
            },
            rarity: 'Rare Holo V',
            number: '44',
            artist: 'Kyohei Ando'
        },
        {
            id: 'swsh4-29',
            name: 'Pikachu VMAX',
            supertype: 'Pokémon',
            subtypes: ['VMAX'],
            types: ['Lightning'],
            images: {
                small: 'https://images.pokemontcg.io/swsh4/29.png',
                large: 'https://images.pokemontcg.io/swsh4/29_hires.png'
            },
            rarity: 'Rare Holo VMAX',
            number: '29',
            artist: 'aKy CG Works'
        },
        {
            id: 'swsh8-245',
            name: 'Mew VMAX',
            supertype: 'Pokémon',
            subtypes: ['VMAX'],
            types: ['Psychic'],
            images: {
                small: 'https://images.pokemontcg.io/swsh8/245.png',
                large: 'https://images.pokemontcg.io/swsh8/245_hires.png'
            },
            rarity: 'Rare Holo VMAX',
            number: '245',
            artist: 'Akira Egawa'
        },
        {
            id: 'base1-2',
            name: 'Blastoise',
            supertype: 'Pokémon',
            subtypes: ['Stage 2'],
            types: ['Water'],
            images: {
                small: 'https://images.pokemontcg.io/base1/2.png',
                large: 'https://images.pokemontcg.io/base1/2_hires.png'
            },
            rarity: 'Rare Holo',
            number: '2',
            artist: 'Ken Sugimori'
        },
        {
            id: 'base1-15',
            name: 'Venusaur',
            supertype: 'Pokémon',
            subtypes: ['Stage 2'],
            types: ['Grass'],
            images: {
                small: 'https://images.pokemontcg.io/base1/15.png',
                large: 'https://images.pokemontcg.io/base1/15_hires.png'
            },
            rarity: 'Rare Holo',
            number: '15',
            artist: 'Mitsuhiro Arita'
        },
        {
            id: 'sm12-75',
            name: 'Darkrai',
            supertype: 'Pokémon',
            subtypes: ['Basic'],
            types: ['Darkness'],
            images: {
                small: 'https://images.pokemontcg.io/sm12/75.png',
                large: 'https://images.pokemontcg.io/sm12/75_hires.png'
            },
            rarity: 'Rare',
            number: '75',
            artist: 'Anesaki Dynamic'
        }
    ];

    /**
     * Busca cartas da API com base em filtros de nome, tipo e raridade.
     * Retorna fallback se falhar ou estiver offline.
     */
    public async searchCards(queryName: string, type: string, rarity: string): Promise<PokemonCardData[]> {
        const cacheKey = `${queryName}_${type}_${rarity}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        // Montagem do parâmetro de busca Q para a Pokémon TCG API
        // Ex: q=name:pikachu* types:lightning rarity:common
        const qParts: string[] = [];
        
        if (queryName.trim()) {
            qParts.push(`name:"${queryName.trim()}*"`);
        }
        if (type) {
            qParts.push(`types:${type}`);
        }
        if (rarity) {
            qParts.push(`rarity:"${rarity}"`);
        }

        // Restringe a Pokémon supertype para não trazer itens de energia pura ou treinadores de forma indesejada no início, a menos que pesquisado
        if (qParts.length === 0) {
            qParts.push('supertype:pokemon');
        }

        const qString = qParts.join(' ');
        const url = `${this.baseUrl}?q=${encodeURIComponent(qString)}&pageSize=20&page=1`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha na API');
            
            const json = await response.json();
            const cards = (json.data || []) as PokemonCardData[];
            
            this.cache.set(cacheKey, cards);
            return cards;
        } catch (error) {
            console.warn('API Pokémon TCG indisponível ou limite de requisições excedido. Utilizando catálogo fallback local.', error);
            
            // Lógica de filtro local para o Fallback offline
            let filtered = [...this.offlineBackupCards];
            if (queryName.trim()) {
                const search = queryName.toLowerCase();
                filtered = filtered.filter(c => c.name.toLowerCase().includes(search));
            }
            if (type) {
                filtered = filtered.filter(c => c.types?.includes(type));
            }
            if (rarity) {
                filtered = filtered.filter(c => c.rarity?.toLowerCase() === rarity.toLowerCase());
            }
            
            return filtered;
        }
    }

    /**
     * Busca uma única carta pelo seu ID
     */
    public async getCardById(id: string): Promise<PokemonCardData | null> {
        // Verifica nos caches primeiro
        for (const cards of this.cache.values()) {
            const found = cards.find(c => c.id === id);
            if (found) return found;
        }

        // Verifica no backup local
        const localFound = this.offlineBackupCards.find(c => c.id === id);
        if (localFound) return localFound;

        try {
            const response = await fetch(`${this.baseUrl}/${id}`);
            if (!response.ok) throw new Error('Carta não encontrada');
            const json = await response.json();
            return json.data as PokemonCardData;
        } catch (error) {
            console.error('Erro ao buscar carta pelo ID', error);
            return null;
        }
    }
}
