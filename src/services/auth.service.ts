
import type { Usuario } from '../models/usuario.model.js';

export class AuthService {
    private static SESSION_KEY = 'pkdx_current_session';
    private baseUrl = 'http://localhost:8080/SIdex/usuarios';

    constructor() {}

    public async login(email: string, senha: string): Promise<Usuario> {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Falha no login');
            }

            const user: Usuario = await response.json();
            
            // Salva a sessão ativa (garantindo que não guardamos a senha no storage se possível, mas mantemos o que veio)
            sessionStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(user));
            return user;
        } catch (error) {
            throw error;
        }
    }

    public async register(nome: string, email: string, senha: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nome, email, senha })
            });

            if (response.status === 201 || response.ok) {
                return { success: true, message: 'Usuário cadastrado com sucesso!' };
            } else {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Falha ao cadastrar usuário');
            }
        } catch (error: any) {
            return { success: false, message: error.message };
        }
    }

    public logout(): void {
        sessionStorage.removeItem(AuthService.SESSION_KEY);
    }

    public getCurrentUser(): Usuario | null {
        const session = sessionStorage.getItem(AuthService.SESSION_KEY);
        if (session) {
            return JSON.parse(session) as Usuario;
        }
        return null;
    }

    public isAuthenticated(): boolean {
        return sessionStorage.getItem(AuthService.SESSION_KEY) !== null;
    }

    public async updateUser(usuario: Usuario): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(usuario)
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Falha ao atualizar perfil');
            }

            const currentSession = this.getCurrentUser();
            if (currentSession && currentSession.id === usuario.id) {
                const updatedSession: Usuario = {
                    ...currentSession,
                    nome: usuario.nome
                };
                sessionStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(updatedSession));
            }
        } catch (error) {
            throw error;
        }
    }

    public async deleteUser(id: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage || 'Falha ao deletar perfil');
            }

            const currentSession = this.getCurrentUser();
            if (currentSession && currentSession.id === id) {
                this.logout();
            }
        } catch (error) {
            throw error;
        }
    }
}