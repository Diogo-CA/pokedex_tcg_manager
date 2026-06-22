package br.com.amumus.utils;

import br.com.amumus.model.Carta;
import br.com.amumus.model.ENUMS.CondicaoEnum;
import br.com.amumus.model.Usuario;
import br.com.amumus.model.WishList;

import java.sql.ResultSet;
import java.sql.SQLException;

public class WishListMapper {

    public static WishList converterRs(ResultSet rs) throws SQLException {

        WishList item = new WishList();
        item.setId(rs.getLong("id"));
        item.setFoilDesejada(rs.getBoolean("is_foil_desejada"));

        String condicaoStr = rs.getString("condicao_desejada");
        if (condicaoStr != null) {
            item.setCondicaoDesejada(CondicaoEnum.valueOf(condicaoStr));
        }

        Usuario usuario = new Usuario();
        usuario.setId(rs.getLong("usuario_id"));
        item.setUsuario(usuario);

        Carta carta = new Carta();
        carta.setId(rs.getString("carta_desejada_id"));
        item.setCartaDesejada(carta);

        return item;
    }
}
