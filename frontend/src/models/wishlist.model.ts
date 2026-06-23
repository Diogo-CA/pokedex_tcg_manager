
import type { Usuario } from './usuario.model.js';
import type { Carta } from './carta.model.js';
import type { CondicaoEnum } from './colecao.model.js';

export interface WishList {
    id: number;
    usuario: Usuario;
    cartaDesejada: Carta;
    foilDesejada: boolean;
    condicaoDesejada: CondicaoEnum;
}
