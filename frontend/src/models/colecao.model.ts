
import type { Usuario } from './usuario.model.js';
import type { Carta } from './carta.model.js';
import type { Binder } from './binder.model.js';

export type CondicaoEnum = 'M' | 'NM' | 'SP' | 'MP' | 'HP' | 'D';

export interface CartaColecao {
    id: number;
    dono: Usuario;
    cartaBase: Carta;
    quantidade: number;
    isFoil: boolean;
    condicao: CondicaoEnum;
    binder?: Binder;
    dataAdcionada: string | Date;
    isFavorita: boolean;
}
