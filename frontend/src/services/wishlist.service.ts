
import type { WishList } from '../models/wishlist.model.js';

export class WishListService {
    private baseUrl = `http://${window.location.hostname}:8080/SIdex/colecao/wishlist`;

    public async adicionarItem(item: WishList): Promise<WishList> {
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
                throw new Error(errorText || 'Erro ao adicionar item na wishlist');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no WishListService.adicionarItem:', error);
            throw error;
        }
    }

    public async listarPorUsuario(usuarioId: number): Promise<WishList[]> {
        try {
            const response = await fetch(`${this.baseUrl}?usuarioId=${usuarioId}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao buscar wishlist do usuário');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no WishListService.listarPorUsuario:', error);
            throw error;
        }
    }

    public async atualizarCriterios(item: WishList): Promise<WishList> {
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
                throw new Error(errorText || 'Erro ao atualizar item da wishlist');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no WishListService.atualizarCriterios:', error);
            throw error;
        }
    }

    public async removerItem(idDesejo: number): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: idDesejo })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao remover item da wishlist');
            }
        } catch (error) {
            console.error('Erro no WishListService.removerItem:', error);
            throw error;
        }
    }
}
