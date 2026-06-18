package br.com.amumus.controller;

import br.com.amumus.model.Carta;
import br.com.amumus.service.CartaService;
import com.google.gson.Gson;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
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
        }
        return;
    }


}


