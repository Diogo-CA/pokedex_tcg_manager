
import type { Carta } from '../models/carta.model.js';

export class CartaService {
    private baseUrl = `http://${window.location.hostname}:8080/SIdex/cartas`;

    public async buscarCatalogo(atributo?: string, valor?: string, pagina: number = 1, tamanhoPagina: number = 20): Promise<Carta[]> {
        try {
            const params = new URLSearchParams();
            if (atributo && valor) {
                params.append('buscaAtributo', atributo);
                params.append('buscaValor', valor);
            }
            params.append('pagina', pagina.toString());
            params.append('tamanho', tamanhoPagina.toString());
            const queryString = params.toString();
            const response = await fetch(`${this.baseUrl}${queryString ? '?' + queryString : ''}`, { method: 'GET' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao buscar catálogo de cartas');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro no CartaService.buscarCatalogo:', error);
            throw error;
        }
    }

    public async buscarVitrini(atributo?: string, valor?: string, pagina: number = 1, tamanhoPagina: number = 20): Promise<Carta[]> {
        try {
            const params = new URLSearchParams();
            if (atributo && valor) {
                params.append('vitrineAtributo', atributo);
                params.append('vitrineValor', valor);
            } else {
                params.append('vitrineCompleta', 'true');
            }
            params.append('pagina', pagina.toString());
            params.append('tamanho', tamanhoPagina.toString());
            const response = await fetch(`${this.baseUrl}?${params.toString()}`, { method: 'GET' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao buscar vitrine de cartas');
            }
            return await response.json();
        } catch (error) {
            console.error('Erro no CartaService.buscarVitrini:', error);
            throw error;
        }
    }

    public async salvarCarta(idCarta: string): Promise<Carta> {
        try {
            const response = await fetch(`${this.baseUrl}?id=${idCarta}`, {
                method: 'GET'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao salvar a carta base');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no CartaService.salvarCarta:', error);
            throw error;
        }
    }

    public async deletarCarta(idCarta: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: idCarta })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao deletar a carta base');
            }
        } catch (error) {
            console.error('Erro no CartaService.deletarCarta:', error);
            throw error;
        }
    }

    public async atualizarCarta(carta: Carta): Promise<Carta> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carta)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Erro ao atualizar a carta base');
            }

            return await response.json();
        } catch (error) {
            console.error('Erro no CartaService.atualizarCarta:', error);
            throw error;
        }
    }
}
