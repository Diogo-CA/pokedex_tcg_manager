package br.com.amumus.repository;

import br.com.amumus.model.Usuario;
import br.com.amumus.utils.UsuarioMapper;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class UsuarioRepository {

    public boolean salvar(Usuario usuario, Connection connection) throws SQLException {

        String sql = "INSERT INTO usuarios (nome, email, senha, data_cadastro) VALUES (?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, usuario.getNome());
            stmt.setString(2, usuario.getEmail());
            stmt.setString(3, usuario.getSenha());
            stmt.setTimestamp(4, usuario.getDataCadastro() != null ? Timestamp.valueOf(usuario.getDataCadastro()) : null);

            int linhasAfetadas = stmt.executeUpdate();

            if (linhasAfetadas > 0) {
                try (ResultSet rs = stmt.getGeneratedKeys()) {
                    if (rs.next()) {
                        usuario.setId(rs.getLong(1));
                    }
                }
                return true;
            }
            return false;
        }
    }

    public Usuario buscarPorId(Long id, Connection connection) throws SQLException {

        String sql = "SELECT * FROM usuarios WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setLong(1, id);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return UsuarioMapper.converterRs(rs);
                }
            }
        }
        return null;
    }

    public Usuario buscarPorEmail(String email, Connection connection) throws SQLException {

        String sql = "SELECT * FROM usuarios WHERE email = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, email);

            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return UsuarioMapper.converterRs(rs);
                }
            }
        }
        return null;
    }

    public List<Usuario> listarTodos(Connection connection) throws SQLException {

        List<Usuario> usuarios = new ArrayList<>();
        String sql = "SELECT * FROM usuarios";

        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                usuarios.add(UsuarioMapper.converterRs(rs));
            }
        }
        return usuarios;
    }

    public boolean atualizar(Usuario usuario, Connection connection) throws SQLException {

        String sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, usuario.getNome());
            stmt.setString(2, usuario.getEmail());
            stmt.setString(3, usuario.getSenha());
            stmt.setLong(4, usuario.getId());

            return stmt.executeUpdate() > 0;
        }
    }

    public boolean deletar(Long id, Connection connection) throws SQLException {

        String sql = "DELETE FROM usuarios WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setLong(1, id);
            return stmt.executeUpdate() > 0;
        }
    }
}
