package br.com.amumus.utils;

import br.com.amumus.model.Binder;
import br.com.amumus.model.Carta;
import br.com.amumus.model.CartaColecao;
import br.com.amumus.model.ENUMS.CondicaoEnum;
import br.com.amumus.model.Usuario;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

public class CartaColecaoMapper {

    public static CartaColecao converterRS(ResultSet rs) throws SQLException {
        CartaColecao item = new CartaColecao();
        item.setId(rs.getLong("id"));
        item.setQuantidade(rs.getInt("quantidade"));
        item.setFoil(rs.getBoolean("is_foil"));
        item.setFavorita(rs.getBoolean("is_favorita"));

        String condicaoStr = rs.getString("condicao");
        if (condicaoStr != null) {
            item.setCondicao(CondicaoEnum.valueOf(condicaoStr));
        }

        Timestamp timestamp = rs.getTimestamp("data_adicionada");
        if (timestamp != null) {
            item.setDataAdcionada(timestamp.toLocalDateTime());
        }

        Carta carta = new Carta();
        carta.setId(rs.getString("carta_base_id"));
        item.setCartaBase(carta);

        Usuario dono = new Usuario();
        dono.setId(rs.getLong("dono_id"));
        item.setDono(dono);

        long binderId = rs.getLong("binder_id");
        if (!rs.wasNull()) {
            Binder binder = new Binder();
            binder.setId(binderId);
            item.setBinder(binder);
        }

        return item;
    }
}
