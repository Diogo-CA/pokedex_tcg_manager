// src/services/storage.service.ts
import type { User } from '../models/user.model.js';
import type { CollectionItem } from '../models/collection.model.js';
import type { Folder } from '../models/folder.model.js';
import type { Transaction } from '../models/transaction.model.js';

export class StorageService {
    private static KEYS = {
        USERS: 'pkdx_users',
        COLLECTION: 'pkdx_collection_',
        FOLDERS: 'pkdx_folders_',
        TRANSACTIONS: 'pkdx_transactions_'
    };

    constructor() {
        this.initSeeds();
    }

    // --- Métodos Gerais de Ler/Escrever do LocalStorage ---
    private get<T>(key: string, defaultValue: T): T {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultValue;
    }

    private set<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }

    // --- CRUD de Usuários ---
    public getUsers(): User[] {
        return this.get<User[]>(StorageService.KEYS.USERS, []);
    }

    public saveUsers(users: User[]): void {
        this.set(StorageService.KEYS.USERS, users);
    }

    public addUser(user: User): void {
        const users = this.getUsers();
        users.push(user);
        this.saveUsers(users);
    }

    public updateUser(updatedUser: User): void {
        let users = this.getUsers();
        users = users.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u);
        this.saveUsers(users);
    }

    public deleteUser(userId: string): void {
        // Remove usuário
        let users = this.getUsers();
        users = users.filter(u => u.id !== userId);
        this.saveUsers(users);

        // Limpa coleções, pastas e transações do usuário
        localStorage.removeItem(`${StorageService.KEYS.COLLECTION}${userId}`);
        localStorage.removeItem(`${StorageService.KEYS.FOLDERS}${userId}`);
        localStorage.removeItem(`${StorageService.KEYS.TRANSACTIONS}${userId}`);
    }

    // --- CRUD da Coleção de Cartas ---
    public getCollection(userId: string): CollectionItem[] {
        return this.get<CollectionItem[]>(`${StorageService.KEYS.COLLECTION}${userId}`, []);
    }

    public saveCollection(userId: string, items: CollectionItem[]): void {
        this.set(`${StorageService.KEYS.COLLECTION}${userId}`, items);
    }

    public addCollectionItem(userId: string, item: CollectionItem): void {
        const items = this.getCollection(userId);
        const existsIndex = items.findIndex(i => i.cardId === item.cardId && i.condition === item.condition && i.isFoil === item.isFoil);
        
        if (existsIndex > -1) {
            const existing = items[existsIndex];
            if (existing) {
                existing.quantity += item.quantity;
            }
        } else {
            items.push(item);
        }
        
        this.saveCollection(userId, items);
        this.addTransaction(userId, item.cardData.name, 'INPUT', item.quantity, 'Adicionado à Coleção');
    }

    public updateCollectionItem(userId: string, itemId: string, quantity: number, condition: 'M' | 'NM' | 'LP' | 'PL', isFoil: boolean): void {
        const items = this.getCollection(userId);
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
            const item = items[itemIndex];
            if (item) {
                const diff = quantity - item.quantity;
                item.quantity = quantity;
                item.condition = condition;
                item.isFoil = isFoil;
                this.saveCollection(userId, items);

                if (diff !== 0) {
                    const action = diff > 0 ? 'INPUT' : 'OUTPUT';
                    this.addTransaction(userId, item.cardData.name, action, Math.abs(diff), 'Ajuste de quantidade');
                }
            }
        }
    }

    public deleteCollectionItem(userId: string, itemId: string): void {
        const items = this.getCollection(userId);
        const item = items.find(i => i.id === itemId);
        if (item) {
            const filtered = items.filter(i => i.id !== itemId);
            this.saveCollection(userId, filtered);
            this.addTransaction(userId, item.cardData.name, 'OUTPUT', item.quantity, 'Removido da Coleção');
            
            // Remove a referência do card nas pastas do usuário
            this.removeCardFromAllFolders(userId, item.cardId);
        }
    }

    // --- CRUD de Pastas/Áreas ---
    public getFolders(userId: string): Folder[] {
        return this.get<Folder[]>(`${StorageService.KEYS.FOLDERS}${userId}`, []);
    }

    public saveFolders(userId: string, folders: Folder[]): void {
        this.set(`${StorageService.KEYS.FOLDERS}${userId}`, folders);
    }

    public addFolder(userId: string, name: string, description: string): void {
        const folders = this.getFolders(userId);
        const newFolder: Folder = {
            id: 'fold_' + Math.random().toString(36).substring(2, 9),
            userId,
            name,
            description,
            cardIds: [],
            dateCreated: new Date().toISOString()
        };
        folders.push(newFolder);
        this.saveFolders(userId, folders);
    }

    public updateFolder(userId: string, updatedFolder: Folder): void {
        let folders = this.getFolders(userId);
        folders = folders.map(f => f.id === updatedFolder.id ? updatedFolder : f);
        this.saveFolders(userId, folders);
    }

    public deleteFolder(userId: string, folderId: string): void {
        let folders = this.getFolders(userId);
        folders = folders.filter(f => f.id !== folderId);
        this.saveFolders(userId, folders);
    }

    public addCardToFolder(userId: string, folderId: string, cardId: string, cardName: string): boolean {
        const folders = this.getFolders(userId);
        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex > -1) {
            const folder = folders[folderIndex];
            if (folder && !folder.cardIds.includes(cardId)) {
                folder.cardIds.push(cardId);
                this.saveFolders(userId, folders);
                this.addTransaction(userId, cardName, 'INPUT', 1, `Organizada na pasta: ${folder.name}`);
                return true;
            }
        }
        return false;
    }

    public removeCardFromFolder(userId: string, folderId: string, cardId: string, cardName: string): void {
        const folders = this.getFolders(userId);
        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex > -1) {
            const folder = folders[folderIndex];
            if (folder) {
                folder.cardIds = folder.cardIds.filter(id => id !== cardId);
                this.saveFolders(userId, folders);
                this.addTransaction(userId, cardName, 'OUTPUT', 1, `Removida da pasta: ${folder.name}`);
            }
        }
    }

    private removeCardFromAllFolders(userId: string, cardId: string): void {
        const folders = this.getFolders(userId);
        let changed = false;
        folders.forEach(f => {
            if (f.cardIds.includes(cardId)) {
                f.cardIds = f.cardIds.filter(id => id !== cardId);
                changed = true;
            }
        });
        if (changed) {
            this.saveFolders(userId, folders);
        }
    }

    // --- Log de Transações (Histórico de Estoque) ---
    public getTransactions(userId: string): Transaction[] {
        return this.get<Transaction[]>(`${StorageService.KEYS.TRANSACTIONS}${userId}`, []);
    }

    public saveTransactions(userId: string, list: Transaction[]): void {
        this.set(`${StorageService.KEYS.TRANSACTIONS}${userId}`, list);
    }

    public addTransaction(userId: string, cardName: string, action: 'INPUT' | 'OUTPUT', quantity: number, details: string): void {
        const list = this.getTransactions(userId);
        const newTx: Transaction = {
            id: 'tx_' + Math.random().toString(36).substring(2, 9),
            userId,
            cardName,
            action,
            quantity,
            details,
            timestamp: new Date().toISOString()
        };
        list.unshift(newTx); // Adiciona no início da lista (mais recente primeiro)
        this.saveTransactions(userId, list.slice(0, 50)); // Guarda no máximo as últimas 50 transações
    }

    public clearTransactions(userId: string): void {
        this.saveTransactions(userId, []);
    }

    // --- Inicialização de Sementes de Testes (Seeds) ---
    private initSeeds(): void {
        const users = this.getUsers();
        if (users.length === 0) {
            // Cria usuário administrador de testes
            const mockUser: User = {
                id: 'usr_ash123',
                name: 'Ash Ketchum',
                email: 'colecionador@tcg.com',
                password: '123456' // senha em texto simples para fins acadêmicos do protótipo
            };
            this.addUser(mockUser);

            const userId = mockUser.id;

            // Cria coleção de cartas iniciais mockadas para o Ash
            const mockCards = [
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
                    number: '1'
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
                    number: '22'
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
                    number: '44'
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
                    number: '120'
                }
            ];

            const initialCollection: CollectionItem[] = [
                {
                    id: 'col_1',
                    userId,
                    cardId: 'swsh1-1',
                    cardData: mockCards[0]!,
                    quantity: 1,
                    condition: 'M',
                    isFoil: true,
                    dateAdded: new Date().toISOString()
                },
                {
                    id: 'col_2',
                    userId,
                    cardId: 'swsh1-22',
                    cardData: mockCards[1]!,
                    quantity: 2,
                    condition: 'NM',
                    isFoil: false,
                    dateAdded: new Date().toISOString()
                },
                {
                    id: 'col_3',
                    userId,
                    cardId: 'swsh1-120',
                    cardData: mockCards[3]!,
                    quantity: 1,
                    condition: 'M',
                    isFoil: true,
                    dateAdded: new Date().toISOString()
                }
            ];
            this.saveCollection(userId, initialCollection);

            // Cria Pastas organizacionais iniciais
            const initialFolders: Folder[] = [
                {
                    id: 'fold_favs',
                    userId,
                    name: 'Meus Favoritos',
                    description: 'Cartas mais raras e brilhantes da minha coleção.',
                    cardIds: ['swsh1-120', 'swsh1-1'],
                    dateCreated: new Date().toISOString()
                },
                {
                    id: 'fold_trade',
                    userId,
                    name: 'Para Trocas',
                    description: 'Cartas repetidas para negociar no próximo evento.',
                    cardIds: ['swsh1-22'],
                    dateCreated: new Date().toISOString()
                }
            ];
            this.saveFolders(userId, initialFolders);

            // Cria Histórico de transações iniciais
            const initialTransactions: Transaction[] = [
                {
                    id: 'tx_init_1',
                    userId,
                    cardName: 'Snorlax VMAX',
                    action: 'INPUT',
                    quantity: 1,
                    details: 'Adicionado à Coleção',
                    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
                },
                {
                    id: 'tx_init_2',
                    userId,
                    cardName: 'Victini V',
                    action: 'INPUT',
                    quantity: 2,
                    details: 'Adicionado à Coleção',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 'tx_init_3',
                    userId,
                    cardName: 'Snorlax VMAX',
                    action: 'INPUT',
                    quantity: 1,
                    details: 'Organizada na pasta: Meus Favoritos',
                    timestamp: new Date().toISOString()
                }
            ];
            this.saveTransactions(userId, initialTransactions);
        }
    }
}
