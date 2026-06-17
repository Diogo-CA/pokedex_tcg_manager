// src/services/auth.service.ts
import type { User } from '../models/user.model.js';
import { StorageService } from './storage.service.js';

export class AuthService {
    private storage: StorageService;
    private static SESSION_KEY = 'pkdx_current_session';

    constructor(storage: StorageService) {
        this.storage = storage;
    }

    /**
     * Tenta realizar o login do usuário
     */
    public login(email: string, password: string): boolean {
        const users = this.storage.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (user) {
            // Salva a sessão ativa (sem a senha por segurança no tráfego)
            const sessionUser: User = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            sessionStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(sessionUser));
            return true;
        }
        return false;
    }

    /**
     * Registra um novo usuário com validações básicas
     */
    public register(name: string, email: string, password: string): { success: boolean; message: string } {
        const users = this.storage.getUsers();
        
        // Verifica se o e-mail já existe
        const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
            return { success: false, message: 'Este e-mail já está cadastrado.' };
        }

        const newUser: User = {
            id: 'usr_' + Math.random().toString(36).substring(2, 9),
            name,
            email,
            password
        };

        this.storage.addUser(newUser);
        return { success: true, message: 'Usuário cadastrado com sucesso!' };
    }

    /**
     * Finaliza a sessão atual
     */
    public logout(): void {
        sessionStorage.removeItem(AuthService.SESSION_KEY);
    }

    /**
     * Retorna o usuário logado atualmente ou null se não houver sessão ativa
     */
    public getCurrentUser(): User | null {
        const session = sessionStorage.getItem(AuthService.SESSION_KEY);
        if (session) {
            return JSON.parse(session) as User;
        }
        return null;
    }

    /**
     * Verifica se o usuário está autenticado
     */
    public isAuthenticated(): boolean {
        return sessionStorage.getItem(AuthService.SESSION_KEY) !== null;
    }
}
