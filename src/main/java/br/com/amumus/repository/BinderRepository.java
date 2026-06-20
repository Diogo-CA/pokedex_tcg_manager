package br.com.amumus.repository;

import br.com.amumus.model.CartaColecao;
import br.com.amumus.model.Carta;
import br.com.amumus.model.ENUMS.CondicaoEnum;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BinderRepository {


    public boolean salvarNoBinder(CartaColecao item, Connection connection) throws SQLException {
        String sql = "INSERT INTO carta_colecao (carta_base_id, dono_id, binder_id, quantidade, is_foil, condicao, data_adicionada, is_favorita) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, item.getCartaBase() != null ? item.getCartaBase().getId() : null);
            stmt.setObject(2, item.getDono() != null ? item.getDono().getId() : null);
            stmt.setObject(3, item.getBinder() != null ? item.getBinder().getId() : null);

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
                if (rs.next()) {
                    return mapearResultSet(rs);
                }
            }
        }
        return null;
    }

    public List<CartaColecao> listarBinder(Long binderId, int pagina, int tamanhoPagina, Connection connection) throws SQLException {
        List<CartaColecao> cartasDobinder = new ArrayList<>();
        String sql = "SELECT * FROM carta_colecao WHERE binder_id = ? LIMIT ? OFFSET ?";

        int offset = (pagina - 1) * tamanhoPagina;

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, binderId);
            stmt.setInt(2, tamanhoPagina);
            stmt.setInt(3, offset);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    cartasDobinder.add(mapearResultSet(rs));
                }
            }
        }
        return cartasDobinder;
    }

    public boolean atualizar(CartaColecao item, Connection connection) throws SQLException {
        String sql = "UPDATE carta_colecao SET quantidade = ?, is_foil = ?, condicao = ?, is_favorita = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setInt(1, item.getQuantidade());
            stmt.setBoolean(2, item.isFoil());
            stmt.setString(3, item.getCondicao() != null ? item.getCondicao().name() : null);
            stmt.setBoolean(4, item.isFavorita());
            stmt.setLong(5, item.getId());

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

    private CartaColecao mapearResultSet(ResultSet rs) throws SQLException {
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

        // Instancia uma entidade Carta apenas com o ID para manter a referência
        Carta carta = new Carta();
        carta.setId(rs.getString("carta_base_id"));
        item.setCartaBase(carta);

        return item;
    }
}