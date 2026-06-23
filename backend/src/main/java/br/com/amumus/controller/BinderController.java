package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.Binder;
import br.com.amumus.service.BinderService;
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

@WebServlet("/colecao/binder")
public class BinderController extends HttpServlet {

    private BinderService binderService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.binderService = new BinderService();
        gson = ControllerUtils.criarGsonConfigurado();

    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            Binder novaPasta = gson.fromJson(request.getReader(), Binder.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = binderService.criarNovaPasta(novaPasta, conn);

                if (sucesso) {
                    response.setStatus(201);
                    out.print("{\"mensagem\": \"Pasta criada com sucesso!\", \"Id\": " + novaPasta.getId() + "}");
                } else {
                    response.setStatus(400);
                    out.print("{\"erro\": \"Falha ao criar pasta. Verifique se o ID do Usuário foi informado.\"}");
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
            String usuarioIdParam = request.getParameter("usuarioId");
            String binderIdParam = request.getParameter("binderId");

            try (Connection conn = Conexao.getConexao()) {

                if (binderIdParam != null && !binderIdParam.trim().isEmpty()) {
                    Long binderId = Long.parseLong(binderIdParam);
                    Binder pastaCompleta = binderService.abrirPastaCompleta(binderId, conn);

                    if (pastaCompleta != null) {
                        response.setStatus(200);
                        out.print(gson.toJson(pastaCompleta));
                    } else {
                        response.setStatus(404);
                        out.print("{\"erro\": \"Binder não encontrado.\"}");
                    }
                    return;
                }

                if (usuarioIdParam != null && !usuarioIdParam.trim().isEmpty()) {
                    Long usuarioId = Long.parseLong(usuarioIdParam);
                    var listaPastas = binderService.listarPastasDoUsuario(usuarioId, conn);

                    response.setStatus(200);
                    out.print(gson.toJson(listaPastas));
                    return;
                }

                response.setStatus(400);
                out.print("{\"erro\": \"É obrigatório informar o 'usuarioId' ou 'binderId' na URL.\"}");
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print("{\"erro\": \"Os IDs informados devem ser números válidos.\"}");
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            Binder binderAtualizado = gson.fromJson(request.getReader(), Binder.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = binderService.renomearPasta(binderAtualizado, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Binder renomeado com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Binder não encontrado ou dados inválidos para renomear.\"}");
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
            BinderID pastaDeletada = gson.fromJson(request.getReader(), BinderID.class);

            if (pastaDeletada == null || pastaDeletada.id == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório para exclusão.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = binderService.excluirPasta(pastaDeletada.id, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Binder excluído\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Pasta não encontrada para exclusão.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    private static class BinderID {
        Long id;
    }
}