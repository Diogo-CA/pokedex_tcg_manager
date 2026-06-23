
import type { CartaColecao } from '../models/colecao.model.js';

export class ColecaoService {
    private baseUrl = 'http://localhost:8080/SIdex/colecao/cartas';

    public async adicionarCarta(item: CartaColecao): Promise<CartaColecao> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao adicionar carta na coleção');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no ColecaoService.adicionarCarta:', error);
            throw error;
        }
    }

    public async buscarPorUsuario(usuarioId: number): Promise<CartaColecao[]> {
        try {
            const response = await fetch(`${this.baseUrl}?usuarioId=${usuarioId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao buscar coleção do usuário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no ColecaoService.buscarPorUsuario:', error);
            throw error;
        }
    }

    public async buscarPorBinder(binderId: number): Promise<CartaColecao[]> {
        try {
            const response = await fetch(`${this.baseUrl}?binderId=${binderId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao buscar cartas do binder');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no ColecaoService.buscarPorBinder:', error);
            throw error;
        }
    }

    public async atualizarCarta(item: CartaColecao): Promise<CartaColecao> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao atualizar carta da coleção');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no ColecaoService.atualizarCarta:', error);
            throw error;
        }
    }

    public async removerCarta(idItem: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: idItem })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao remover carta da coleção');
            }
        } catch (error) {
            console.error('Erro no ColecaoService.removerCarta:', error);
            throw error;
        }
    }
}
