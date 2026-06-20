package br.com.amumus.repository;

import br.com.amumus.model.CartaColecao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class BinderRepository {

    public boolean salvar(String idCarta, int quantidade, Connection connection) throws SQLException {
        String sql = "INSERT INTO binder (carta_id, quantidade) VALUES (?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, idCarta);
            stmt.setInt(2, quantidade);

            return stmt.executeUpdate() > 0;
        }
    }

    public int buscarQuantidade(String idCarta, Connection connection) throws SQLException {
        String sql = "SELECT quantidade FROM binder WHERE carta_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, idCarta);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("quantidade");
                }
            }
        }
        return 0;
    }

    public List<CartaColecao> listarAlbum(int pagina, int tamanhoPagina, Connection connection) throws SQLException {
        List<CartaColecao> album = new ArrayList<>();
        String sql = "SELECT carta_id, quantidade FROM binder LIMIT ? OFFSET ?";

        int offset = (pagina - 1) * tamanhoPagina;

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, tamanhoPagina);
            stmt.setInt(2, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    CartaColecao item = new CartaColecao();
                    item.setId(rs.getLong("carta_id"));
                    item.setQuantidade(rs.getInt("quantidade"));
                    album.add(item);
                }
            }
        }
        return album;
    }

    public boolean atualizarQuantidade(String idCarta, int novaQuantidade, Connection connection) throws SQLException {
        String sql = "UPDATE binder SET quantidade = ? WHERE carta_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, novaQuantidade);
            stmt.setString(2, idCarta);

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deletar(String idCarta, Connection connection) throws SQLException {
        String sql = "DELETE FROM binder WHERE carta_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, idCarta);

            return stmt.executeUpdate() > 0;
        }
    }
}