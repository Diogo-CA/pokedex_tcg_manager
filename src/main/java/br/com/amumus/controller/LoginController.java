package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.Usuario;
import br.com.amumus.service.UsuarioService;
import br.com.amumus.utils.ControllerUtils;
import com.google.gson.Gson;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;

@WebServlet("/usuarios/login")
public class LoginController extends HttpServlet {

    private UsuarioService usuarioService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.usuarioService = new UsuarioService();
        this.gson = ControllerUtils.criarGsonConfigurado();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            LoginDTO loginDTO = gson.fromJson(request.getReader(), LoginDTO.class);

            if (loginDTO == null || loginDTO.email == null || loginDTO.email.trim().isEmpty() ||
                    loginDTO.senha == null || loginDTO.senha.trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"E-mail e senha são obrigatórios para realizar o login.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                Usuario usuario = usuarioService.realizarLogin(loginDTO.email, loginDTO.senha, conn);

                if (usuario != null) {
                    usuario.setSenha(null);
                    response.setStatus(200);
                    out.print(gson.toJson(usuario));
                } else {
                    response.setStatus(401);
                    out.print("{\"erro\": \"E-mail ou senha incorretos.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    private static class LoginDTO {
        String email;
        String senha;
    }
}
