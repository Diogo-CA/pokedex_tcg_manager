package br.com.amumus.utils;

import br.com.amumus.model.Binder;
import br.com.amumus.model.Usuario;

import java.sql.ResultSet;
import java.sql.SQLException;

public class BinderMapper {

    public static Binder converterRs(ResultSet rs) throws SQLException {
        Binder binder = new Binder();
        binder.setId(rs.getLong("id"));
        binder.setNome(rs.getString("nome"));

        Usuario dono = new Usuario();
        dono.setId(rs.getLong("usuario_id"));
        binder.setUsuario(dono);

        return binder;
    }
}
