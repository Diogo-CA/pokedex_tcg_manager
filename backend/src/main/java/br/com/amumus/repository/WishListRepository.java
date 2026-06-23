package br.com.amumus.repository;

import br.com.amumus.model.WishList;
import br.com.amumus.utils.WishListMapper;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class WishListRepository {

    public boolean salvar(WishList itemDesejo, Connection connection) throws SQLException {

        String sql = "INSERT INTO wishlists (usuario_id, carta_id, is_foil_desejada, condicao_desejada) VALUES (?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setObject(1, itemDesejo.getUsuario() != null ? itemDesejo.getUsuario().getId() : null);
            stmt.setString(2, itemDesejo.getCartaDesejada() != null ? itemDesejo.getCartaDesejada().getId() : null);
            stmt.setBoolean(3, itemDesejo.isFoilDesejada());
            stmt.setString(4, itemDesejo.getCondicaoDesejada() != null ? itemDesejo.getCondicaoDesejada().name() : null);

            int linhasAfetadas = stmt.executeUpdate();

            if (linhasAfetadas > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        itemDesejo.setId(generatedKeys.getLong(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public List<WishList> listarPorUsuario(Long idUsuario, Connection connection) throws SQLException {
        List<WishList> listaDesejos = new ArrayList<>();
        String sql = "SELECT * FROM wishlists WHERE usuario_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, idUsuario);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    listaDesejos.add(WishListMapper.converterRs(rs));
                }
            }
        }
        return listaDesejos;
    }

    public WishList buscarPorId(Long id, Connection connection) throws SQLException {
        String sql = "SELECT * FROM wishlists WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return WishListMapper.converterRs(rs);
                }
            }
        }
        return null;
    }

    public boolean atualizar(WishList itemDesejo, Connection connection) throws SQLException {
        String sql = "UPDATE wishlists SET is_foil_desejada = ?, condicao_desejada = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setBoolean(1, itemDesejo.isFoilDesejada());
            stmt.setString(2, itemDesejo.getCondicaoDesejada() != null ? itemDesejo.getCondicaoDesejada().name() : null);
            stmt.setLong(3, itemDesejo.getId());

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deletar(Long id, Connection connection) throws SQLException {
        String sql = "DELETE FROM wishlists WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }

}