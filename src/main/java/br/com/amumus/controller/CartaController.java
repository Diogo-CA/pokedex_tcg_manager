package br.com.amumus.controller;

import br.com.amumus.config.Conexao;
import br.com.amumus.model.Carta;
import br.com.amumus.service.CartaService;
import com.google.gson.Gson;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

@WebServlet("/cartas/*")
public class CartaController extends HttpServlet {

    private CartaService cartaService = new CartaService();
    private Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String path = request.getPathInfo();

        if (path == null || path.equals("/")) {
            response.setStatus(400);
            return;
        }

        if (path.equals("/vitrini")) {

            try {
                String atributo = request.getParameter("atributo");
                String valor = request.getParameter("valor");

                List<Carta> resultado = cartaService.vitriniFiltro(atributo, valor);

                String jsonResultado = gson.toJson(resultado);

                PrintWriter out = response.getWriter();
                out.print(jsonResultado);
                out.flush();
                return;

            } catch (Exception e) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().print("{\"erro\": \"Falha ao buscar as cartas\"}");
            }
        } else if (path.equals("/catalogo")) {

            PrintWriter out = response.getWriter();

            try {

                try (Connection conn = br.com.amumus.config.Conexao.getConexao()) {
                    String atributo = request.getParameter("atributo");
                    String valor = request.getParameter("valor");

                    String p = request.getParameter("p");
                    String tp = request.getParameter("tp");

                    int pagina = (p == null) ? 1 : Integer.parseInt(p);
                    int tamanhoPagina = (tp == null) ? 20 : Integer.parseInt(tp);
                    List<Carta> resultado = cartaService.pesquisarCartasNoCatalogo(atributo, valor, pagina, tamanhoPagina, conn);

                    String jsonResultado = gson.toJson(resultado);
                    out.print(jsonResultado);
                    out.flush();
                    return;

                }
            } catch (SQLException e) {
                e.printStackTrace();
                response.setStatus(500);
                out.print("{\"erro\": \"Erro ao conectar ao banco de dados\"}");
            }
        }
        return;
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        CartaID cartaEscolhida = gson.fromJson(request.getReader(), CartaID.class);

        try {

            System.out.println("LOG CONTROLLER: Objeto recebido: " + cartaEscolhida);
            if (cartaEscolhida != null) {
                System.out.println("LOG CONTROLLER: ID extraído: " + cartaEscolhida.id);
            }

            if (cartaEscolhida == null || cartaEscolhida.id == null || cartaEscolhida.id.trim().isEmpty()) {
                response.setStatus(400);
                out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON.\"}");
                return;
            }

            try (java.sql.Connection conn = br.com.amumus.config.Conexao.getConexao()) {

                Carta carta = cartaService.buscarOuBaixarPorId(cartaEscolhida.id, conn);

                if (carta != null) {
                    response.setStatus(201);
                    out.print(gson.toJson(carta));
                } else {
                    System.out.println("LOG CONTROLLER: O Service retornou NULL para o ID " + cartaEscolhida.id);
                    response.setStatus(404);
                    out.print("{\"erro\": \"Carta não encontrada.\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print("{\"erro\": \"Erro ao tentar baixar e salvar a carta.\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        CartaID cartaDeletada = gson.fromJson(request.getReader(), CartaID.class);

        if (cartaDeletada == null || cartaDeletada.id == null || cartaDeletada.id.trim().isEmpty()) {
            response.setStatus(400); // Bad Request
            out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON para deletar.\"}");
            return;
        }

        try {
            try (Connection conn = Conexao.getConexao()) {

                boolean deletada = cartaService.deletarPorID(cartaDeletada.id, conn);

                if (deletada) {
                    response.setStatus(200);
                    out.print("carta deletada com sucesso");
                } else {
                    response.setStatus(404);
                    out.print("{\"erro\": \"Carta com ID '" + cartaDeletada.id + "' não encontrada no banco.\"}");
                }

            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            out.print("{\"erro\": \"Erro interno ao tentar deletar a carta do banco de dados.\"}");
        }

    }


    private static class CartaID {
        String id;
    }
}


