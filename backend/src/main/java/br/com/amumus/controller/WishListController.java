package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.WishList;
import br.com.amumus.service.WishListService;
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

@WebServlet("/colecao/wishlist")
public class WishListController extends HttpServlet {

    private WishListService wishListService;
    private Gson gson;

    @Override
    public void init() throws ServletException {
        this.wishListService = new WishListService();
        this.gson = ControllerUtils.criarGsonConfigurado();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {

        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            WishList novoDesejo = gson.fromJson(request.getReader(), WishList.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = wishListService.adicionarItem(novoDesejo, conn);

                if (sucesso) {
                    response.setStatus(201);
                    out.print("{\"mensagem\": \"Carta adicionada à sua Lista de Desejos com sucesso\"}");
                } else {
                    response.setStatus(400);
                    out.print("{\"erro\": \"Falha ao adicionar.\"}");
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

            if (usuarioIdParam == null || usuarioIdParam.trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O parâmetro 'usuarioId' é obrigatório.\"}");
                return;
            }

            Long usuarioId = Long.parseLong(usuarioIdParam);

            try (Connection conn = Conexao.getConexao()) {
                var listaDesejos = wishListService.listarDesejosDoUsuario(usuarioId, conn);

                response.setStatus(200);
                out.print(gson.toJson(listaDesejos));
            }
        } catch (NumberFormatException e) {
            response.setStatus(400);
            out.print("{\"erro\": \"O ID do usuário deve ser um número válido.\"}");
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
        ControllerUtils.configurarResposta(response);
        PrintWriter out = response.getWriter();

        try {
            WishList desejoAtualizado = gson.fromJson(request.getReader(), WishList.class);

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = wishListService.atualizarCriterios(desejoAtualizado, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Critérios do desejo atualizados com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Item não encontrado na Lista de Desejos.\"}");
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
            DesejoID itemDeletado = gson.fromJson(request.getReader(), DesejoID.class);

            if (itemDeletado == null || itemDeletado.id == null) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON para exclusão.\"}");
                return;
            }

            try (Connection conn = Conexao.getConexao()) {
                boolean sucesso = wishListService.removerItem(itemDeletado.id, conn);

                if (sucesso) {
                    response.setStatus(200);
                    out.print("{\"mensagem\": \"Item removido da Lista de Desejos com sucesso!\"}");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Item não encontrado para deletar.\"}");
                }
            }
        } catch (Exception e) {
            ControllerUtils.tratarErro(response, out, e);
        }
    }

    private static class DesejoID {
        Long id;
    }
}