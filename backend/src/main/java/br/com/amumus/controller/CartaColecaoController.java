package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.CartaColecao;
import br.com.amumus.service.CartaColecaoService;
import br.com.amumus.utils.ControllerUtils;
import com.google.gson.*;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@WebServlet("/colecao/cartas")
public class CartaColecaoController extends HttpServlet {

    private CartaColecaoService colecaoService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.colecaoService = new CartaColecaoService();
        this.gson = ControllerUtils.criarGsonConfigurado();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            CartaColecao novoItem = gson.fromJson(request.getReader(), CartaColecao.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = colecaoService.adicionarAoInventario(novoItem, conn);

                if (sucesso) {
                    response.setStatus(201);
                    out.print("{\"mensagem\": \"Carta adicionada à coleção com sucesso!\"}");
                } else {
                    response.setStatus(400);
                    out.print("{\"erro\": \"Falha ao adicionar. Verifique se o ID do Usuário e da Carta Base estão corretos.\"}");
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
                    var listaBinder = colecaoService.listarCartasDaPasta(binderId, conn);
                    response.setStatus(200);
                    out.print(gson.toJson(listaBinder));
                    return;
                }

                if (usuarioIdParam != null && !usuarioIdParam.trim().isEmpty()) {
                    Long usuarioId = Long.parseLong(usuarioIdParam);
                    var listaGlobal = colecaoService.listarInventarioCompleto(usuarioId, conn);
                    response.setStatus(200);
                    out.print(gson.toJson(listaGlobal));
                    return;
                }

                response.setStatus(400);
                out.print("{\"erro\": \"É obrigatório informar o 'usuarioId' ou 'binderId' na URL.\"}");
            }

        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print("{\"erro\": \"Os IDs informados na URL devem ser números válidos.\"}");
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            CartaColecao itemAtualizado = gson.fromJson(request.getReader(), CartaColecao.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = colecaoService.atualizarItem(itemAtualizado, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Item da coleção atualizado com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Item não encontrado na coleção para atualização.\"}");
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
            ItemColecaoID itemDeletado = gson.fromJson(request.getReader(), ItemColecaoID.class);

            if (itemDeletado == null || itemDeletado.id == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON para exclusão.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = colecaoService.removerDoInventario(itemDeletado.id, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Carta removida do inventário com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Item não encontrado na coleção para deletar.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    private static class ItemColecaoID {
        Long id;
    }
}