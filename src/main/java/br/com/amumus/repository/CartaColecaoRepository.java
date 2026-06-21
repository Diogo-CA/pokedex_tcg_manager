package br.com.amumus.repository;

import br.com.amumus.model.CartaColecao;
import br.com.amumus.model.Carta;
import br.com.amumus.model.Usuario;
import br.com.amumus.model.Binder;
import br.com.amumus.model.ENUMS.CondicaoEnum;
import br.com.amumus.utils.CartaColecaoMapper;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CartaColecaoRepository {

    public boolean salvar(CartaColecao item, Connection connection) throws SQLException {
        String sql = "INSERT INTO carta_colecao (carta_base_id, dono_id, binder_id, quantidade, is_foil, condicao, data_adicionada, is_favorita) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, item.getCartaBase() != null ? item.getCartaBase().getId() : null);
            stmt.setObject(2, item.getDono() != null ? item.getDono().getId() : null);

            if (item.getBinder() != null && item.getBinder().getId() > 0) {
                stmt.setLong(3, item.getBinder().getId());
            } else {
                stmt.setNull(3, Types.BIGINT);
            }

            stmt.setInt(4, item.getQuantidade());
            stmt.setBoolean(5, item.isFoil());
            stmt.setString(6, item.getCondicao() != null ? item.getCondicao().name() : null);
            stmt.setTimestamp(7, item.getDataAdcionada() != null ? java.sql.Timestamp.valueOf(item.getDataAdcionada()) : null);
            stmt.setBoolean(8, item.isFavorita());

            int linhasAfetadas = stmt.executeUpdate();

            if (linhasAfetadas > 0) {
                try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        item.setId(generatedKeys.getLong(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public CartaColecao buscarPorId(Long id, Connection connection) throws SQLException {
        String sql = "SELECT * FROM carta_colecao WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return CartaColecaoMapper.converterRS(rs);
            }
        }
        return null;
    }

    public List<CartaColecao> listarInventarioGlobal(Long idUsuario, Connection connection) throws SQLException {
        List<CartaColecao> inventario = new ArrayList<>();
        String sql = "SELECT * FROM carta_colecao WHERE dono_id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, idUsuario);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) inventario.add(CartaColecaoMapper.converterRS(rs));
            }
        }
        return inventario;
    }

    public List<CartaColecao> listarPorBinder(Long idBinder, Connection connection) throws SQLException {
        List<CartaColecao> cartasNaPasta = new ArrayList<>();
        String sql = "SELECT * FROM carta_colecao WHERE binder_id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, idBinder);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) cartasNaPasta.add(CartaColecaoMapper.converterRS(rs));
            }
        }
        return cartasNaPasta;
    }

    public boolean atualizar(CartaColecao item, Connection connection) throws SQLException {

        String sql = "UPDATE carta_colecao SET quantidade = ?, is_foil = ?, condicao = ?, is_favorita = ?, binder_id = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, item.getQuantidade());
            stmt.setBoolean(2, item.isFoil());
            stmt.setString(3, item.getCondicao() != null ? item.getCondicao().name() : null);
            stmt.setBoolean(4, item.isFavorita());

            if (item.getBinder() != null && item.getBinder().getId() > 0) {
                stmt.setLong(5, item.getBinder().getId());
            } else {
                stmt.setNull(5, Types.BIGINT);
            }

            stmt.setLong(6, item.getId());

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deletar(Long id, Connection connection) throws SQLException {
        String sql = "DELETE FROM carta_colecao WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
}