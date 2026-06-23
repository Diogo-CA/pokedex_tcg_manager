package br.com.amumus.utils;

import br.com.amumus.model.Carta;
import net.tcgdex.sdk.models.Card;

import java.sql.ResultSet;
import java.sql.SQLException;

public class CartaMapper {

    public static Carta converterRs(ResultSet rs) throws SQLException {
        Carta carta = new Carta();
        carta.setId(rs.getString("id"));
        carta.setNome(rs.getString("nome"));
        carta.setNumero_na_colecao(rs.getString("numero_na_colecao"));
        carta.setColecao(rs.getString("colecao"));
        carta.setRaridade(rs.getString("raridade"));
        carta.setIlustrador(rs.getString("ilustrador"));
        carta.setImagem(rs.getString("imagem"));
        return carta;
    }

    public static Carta converterCard(Card cardDaApi) {
        Carta c = new Carta();
        c.setId(cardDaApi.getId());
        c.setNome(cardDaApi.getName());

        if(cardDaApi.getLocalId() != null) c.setNumero_na_colecao(cardDaApi.getLocalId());
        if(cardDaApi.getSet() != null) c.setColecao(cardDaApi.getSet().getName());
        if(cardDaApi.getRarity() != null) c.setRaridade(cardDaApi.getRarity());
        if(cardDaApi.getIllustrator() != null) c.setIlustrador(cardDaApi.getIllustrator());
        if(cardDaApi.getImage() != null) c.setImagem(cardDaApi.getImage() + "/high.webp");

        return c;
    }
}
