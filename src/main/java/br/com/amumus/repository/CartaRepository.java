package br.com.amumus.repository;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.Carta;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class CartaRepository {

    public void salvar(Carta carta, Connection connection) throws SQLException {

        String sql = "INSERT INTO cartas (id_tcgdex, nome, numero, colecao, raridade, ilustrador, imagem) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, carta.getId());
            stmt.setString(2, carta.getNome());
            stmt.setString(3, carta.getNumeroNaColecao());
            stmt.setString(4, carta.getColecao());
            stmt.setString(5, carta.getRaridade());
            stmt.setString(6, carta.getIlustrador());
            stmt.setString(7, carta.getImagem());

            stmt.executeUpdate();
            System.out.println("Carta " + carta.getNome() + " salva com sucesso!");
        }
    }

    public Carta buscarPorId(String id, Connection connection) throws SQLException {

        String sql = "SELECT * FROM cartas WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, id);

            try (ResultSet rs = stmt.executeQuery()) {

                Carta carta = new Carta();

                if (rs.next()) {
                    carta.setId(rs.getString("id"));
                    carta.setNome(rs.getString("nome"));
                    carta.setNumeroNaColecao(rs.getString("numero"));
                    carta.setColecao(rs.getString("colecao"));
                    carta.setRaridade(rs.getString("raridade"));
                    carta.setIlustrador(rs.getString("ilustrador"));
                    carta.setImagem(rs.getString("imagem"));

                    return carta;
                }
            }
        }
        return null;
    }
}
