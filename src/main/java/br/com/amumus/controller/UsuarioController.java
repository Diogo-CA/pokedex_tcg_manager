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
import java.util.List;

@WebServlet("/usuarios")
public class UsuarioController extends HttpServlet {

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
            Usuario novoUsuario = gson.fromJson(request.getReader(), Usuario.class);

            if (novoUsuario == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"Dados do usuário não informados no corpo da requisição.\"}");
                return;
            }

            if (novoUsuario.getNome() == null || novoUsuario.getNome().trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'nome' é obrigatório.\"}");
                return;
            }

            if (novoUsuario.getEmail() == null || novoUsuario.getEmail().trim().isEmpty() || !novoUsuario.getEmail().contains("@")) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'email' é obrigatório e deve ser válido.\"}");
                return;
            }

            if (novoUsuario.getSenha() == null || novoUsuario.getSenha().trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'senha' é obrigatório.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = usuarioService.cadastrarUsuario(novoUsuario, conn);

                if (sucesso) {
                    novoUsuario.setSenha(null);
                    response.setStatus(201);
                    out.print("{\"mensagem\": \"Usuário cadastrado com sucesso!\", \"usuario\": " + gson.toJson(novoUsuario) + "}");
                } else {
                    response.setStatus(400);
                    out.print("{\"erro\": \"Falha ao cadastrar o usuário. Verifique se o e-mail já está em uso.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            String idParam = request.getParameter("id");

            try (Connection conn = Conexao.getConexao()) {
                if (idParam != null && !idParam.trim().isEmpty()) {
                    Long id = Long.parseLong(idParam);

                    if (id <= 0) {
                        response.setStatus(400);
                        out.print("{\"erro\": \"O ID do usuário deve ser maior que zero.\"}");
                        return;
                    }

                    Usuario usuario = usuarioService.buscarUsuarioPorId(id, conn);

                    if (usuario != null) {
                        usuario.setSenha(null);
                        response.setStatus(200);
                        out.print(gson.toJson(usuario));
                    } else {
                        response.setStatus(404);
                        out.print("{\"erro\": \"Usuário não encontrado.\"}");
                    }
                } else {
                    List<Usuario> usuarios = usuarioService.listarTodosUsuarios(conn);
                    for (Usuario u : usuarios) {
                        u.setSenha(null);
                    }
                    response.setStatus(200);
                    out.print(gson.toJson(usuarios));
                }
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print("{\"erro\": \"O ID fornecido deve ser um número válido.\"}");
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            Usuario usuarioAtualizado = gson.fromJson(request.getReader(), Usuario.class);

            if (usuarioAtualizado == null || usuarioAtualizado.getId() == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O JSON deve conter o objeto Usuario completo, incluindo o 'id'.\"}");
                return;
            }

            if (usuarioAtualizado.getId() <= 0) {
                response.setStatus(400);
                out.print("{\"erro\": \"O ID do usuário deve ser maior que zero.\"}");
                return;
            }

            if (usuarioAtualizado.getNome() == null || usuarioAtualizado.getNome().trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'nome' não pode ser vazio.\"}");
                return;
            }

            if (usuarioAtualizado.getEmail() == null || usuarioAtualizado.getEmail().trim().isEmpty() || !usuarioAtualizado.getEmail().contains("@")) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'email' deve ser um e-mail válido.\"}");
                return;
            }

            if (usuarioAtualizado.getSenha() == null || usuarioAtualizado.getSenha().trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'senha' não pode ser vazio.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = usuarioService.atualizarUsuario(usuarioAtualizado, conn);

                if (sucesso) {
                    usuarioAtualizado.setSenha(null);
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Usuário atualizado com sucesso!\", \"usuario\": " + gson.toJson(usuarioAtualizado) + "}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Usuário não encontrado ou e-mail já em uso por outro cadastro.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            UsuarioID usuarioDeletado = gson.fromJson(request.getReader(), UsuarioID.class);

            if (usuarioDeletado == null || usuarioDeletado.id == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON para exclusão.\"}");
                return;
            }

            if (usuarioDeletado.id <= 0) {
                response.setStatus(400);
                out.print("{\"erro\": \"O ID do usuário deve ser maior que zero.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = usuarioService.deletarUsuario(usuarioDeletado.id, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Usuário excluído com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Usuário não encontrado para exclusão.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    private static class UsuarioID {
        Long id;
    }
}
