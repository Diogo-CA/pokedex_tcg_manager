
import type { Usuario } from './usuario.model.js';
import type { CartaColecao } from './colecao.model.js';

export interface Binder {
    id: number;
    nome: string;
    usuario: Usuario;
    cartasDoBinder: CartaColecao[];
}
