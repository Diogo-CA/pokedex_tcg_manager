package br.com.amumus.utils;

import br.com.amumus.model.Usuario;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

public class UsuarioMapper {

    public static Usuario converterRs(ResultSet rs) throws SQLException {

        Usuario usuario = new Usuario();
        usuario.setId(rs.getLong("id"));
        usuario.setNome(rs.getString("nome"));
        usuario.setEmail(rs.getString("email"));
        usuario.setSenha(rs.getString("senha"));

        Timestamp timestamp = rs.getTimestamp("data_cadastro");
        if (timestamp != null) {
            usuario.setDataCadastro(timestamp.toLocalDateTime());
        }

        return usuario;
    }
}
