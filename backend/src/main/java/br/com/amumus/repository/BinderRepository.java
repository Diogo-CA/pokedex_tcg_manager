package br.com.amumus.repository;

import br.com.amumus.model.Binder;
import br.com.amumus.model.Usuario;
import br.com.amumus.utils.BinderMapper;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BinderRepository {

    public boolean salvar(Binder binder, Connection connection) throws SQLException {
        String sql = "INSERT INTO binder (nome, usuario_id) VALUES (?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setString(1, binder.getNome());

            stmt.setLong(2, binder.getUsuario().getId());

            int linhasAfetadas = stmt.executeUpdate();

            if (linhasAfetadas > 0) {
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        binder.setId(rs.getLong(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public Binder buscarPorId(Long id, Connection connection) throws SQLException {
        String sql = "SELECT * FROM binder WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return BinderMapper.converterRs(rs);
                }
            }
        }
        return null;
    }

    public List<Binder> listarPorUsuario(Long idUsuario, Connection connection) throws SQLException {

        List<Binder> pastas = new ArrayList<>();
        String sql = "SELECT * FROM binder WHERE usuario_id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, idUsuario);

            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    pastas.add(BinderMapper.converterRs(rs));
                }
            }
        }
        return pastas;
    }

    public boolean atualizar(Binder binder, Connection connection) throws SQLException {

        String sql = "UPDATE binder SET nome = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, binder.getNome());
            stmt.setLong(2, binder.getId());

            return stmt.executeUpdate() > 0;
        }
    }


    public boolean deletar(Long id, Connection connection) throws SQLException {
        String sql = "DELETE FROM binder WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
}