
import type { Binder } from '../models/binder.model.js';

export class BinderService {
    private baseUrl = `http://${window.location.hostname}:8080/SIdex/colecao/binder`;

    public async criarBinder(binder: Binder): Promise<Binder> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(binder)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao criar binder');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no BinderService.criarBinder:', error);
            throw error;
        }
    }

    public async listarPorUsuario(usuarioId: number): Promise<Binder[]> {
        try {
            const response = await fetch(`${this.baseUrl}?usuarioId=${usuarioId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao listar binders do usuário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no BinderService.listarPorUsuario:', error);
            throw error;
        }
    }

    public async abrirBinderCompleto(binderId: number): Promise<Binder> {
        try {
            const response = await fetch(`${this.baseUrl}?binderId=${binderId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao abrir detalhes do binder');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no BinderService.abrirBinderCompleto:', error);
            throw error;
        }
    }

    public async renomearBinder(binder: Binder): Promise<Binder> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(binder)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao renomear binder');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no BinderService.renomearBinder:', error);
            throw error;
        }
    }

    public async excluirBinder(idBinder: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: idBinder })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao excluir binder');
            }
        } catch (error) {
            console.error('Erro no BinderService.excluirBinder:', error);
            throw error;
        }
    }
}
