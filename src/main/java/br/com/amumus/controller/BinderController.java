package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.CartaColecao;
import br.com.amumus.service.BinderService;
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

@WebServlet("/binder")
public class BinderController extends HttpServlet {

    private BinderService binderService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.binderService = new BinderService();

        // Ensinando o Gson a traduzir o LocalDateTime para Texto e vice-versa
        this.gson = new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, (JsonSerializer<LocalDateTime>) (src, typeOfSrc, context) -> new JsonPrimitive(src.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)))
                .registerTypeAdapter(LocalDateTime.class, (JsonDeserializer<LocalDateTime>) (json, typeOfT, context) -> LocalDateTime.parse(json.getAsString(), DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .create();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            CartaColecao novoItem = gson.fromJson(request.getReader(), CartaColecao.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean adicionado = binderService.adicionarAoBinder(novoItem, conn);

                if (adicionado) {
                    response.setStatus(201);
                    out.print("{\"mensagem\": \"Carta adicionada ao binder\"}");
                } else {
                    response.setStatus(400);
                    out.print("{\"erro\": \"Falha ao adicionar. Verifique se a carta base existe no catálogo.\"}");
                }
            }
        } catch (Exception e) {
            tratarErro(response, out, e);
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
        configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            String binderIdParam = request.getParameter("binderId");
            String paginaParam = request.getParameter("pagina");

            if (binderIdParam == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O parâmetro 'binderId' é obrigatório.\"}");
                return;
            }

            Long binderId = Long.parseLong(binderIdParam);
            int pagina = (paginaParam != null) ? Integer.parseInt(paginaParam) : 1;

            try (Connection conn = Conexao.getConexao()) {
                var lista = binderService.listarCartasDoBinder(binderId, pagina, 20, conn);

                response.setStatus(200);
                out.print(gson.toJson(lista));
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print("{\"erro\": \"Parâmetros de ID ou página inválidos.\"}");
        } catch (Exception e) {
            tratarErro(response, out, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            CartaColecao cartaAtualizada = gson.fromJson(request.getReader(), CartaColecao.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean atualizado = binderService.atualizarCartaBinder(cartaAtualizada, conn);

                if (atualizado) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"carta atualizada com sucesso\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"carta não encontrada.\"}");
                }
            }
        } catch (Exception e) {
            tratarErro(response, out, e);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {
        configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            CartaColecaoID cartaDeletada = gson.fromJson(request.getReader(), CartaColecaoID.class);

            if (cartaDeletada == null || cartaDeletada.id == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean deletado = binderService.removerDoBinder(cartaDeletada.id, conn);

                if (deletado) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Carta removida com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Item não encontrado para deletar.\"}");
                }
            }
        } catch (Exception e) {
            tratarErro(response, out, e);
        }
    }

    private void configurarResposta(HttpServletResponse response) {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
    }

    private void tratarErro(HttpServletResponse response, PrintWriter out, Exception e) {
        e.printStackTrace();
        response.setStatus(500);
        out.print("{\"erro\": \"Erro interno no servidor.\"}");
    }

    private static class CartaColecaoID {
        Long id;
    }
}