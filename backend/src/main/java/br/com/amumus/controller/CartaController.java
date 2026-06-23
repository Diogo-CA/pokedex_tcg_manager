    package br.com.amumus.controller;

    import br.com.amumus.config.Conexao;
    import br.com.amumus.model.Carta;
    import br.com.amumus.service.CartaService;
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

    @WebServlet("/cartas")
    public class CartaController extends HttpServlet {

        private CartaService cartaService;
        private Gson gson;

        @Override
        public void init() throws ServletException {
            this.cartaService = new CartaService();
            this.gson = ControllerUtils.criarGsonConfigurado();
        }

        @Override
        protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

            ControllerUtils.configurarResposta(response);
            PrintWriter out = response.getWriter();

            try {
                String idParam = request.getParameter("id");
                String vitrineAtributo = request.getParameter("vitrineAtributo");
                String vitrineValor = request.getParameter("vitrineValor");
                String buscaAtributo = request.getParameter("buscaAtributo");
                String buscaValor = request.getParameter("buscaValor");
                String vitrineCompleta = request.getParameter("vitrineCompleta");

                int pagina = request.getParameter("pagina") != null ? Integer.parseInt(request.getParameter("pagina")) : 1;
                int tamanhoPagina = request.getParameter("tamanho") != null ? Integer.parseInt(request.getParameter("tamanho")) : 20;

                if (vitrineAtributo != null && vitrineValor != null) {
                    List<Carta> vitrine = cartaService.vitriniFiltro(vitrineAtributo, vitrineValor);
                    response.setStatus(200);
                    out.print(gson.toJson(vitrine));
                    return;
                }

                if ("true".equals(vitrineCompleta)) {
                    List<Carta> vitrineGeral = cartaService.listarVitrineCompleta(pagina, tamanhoPagina);
                    response.setStatus(200);
                    out.print(gson.toJson(vitrineGeral));
                    return;
                }

                try (Connection conn = Conexao.getConexao()) {
                    if (idParam != null && !idParam.trim().isEmpty()) {
                        Carta carta = cartaService.buscarOuBaixarPorId(idParam, conn);
                        if (carta != null) {
                            response.setStatus(200);
                            out.print(gson.toJson(carta));
                        } else {
                            response.setStatus(404);
                            out.print("{\"erro\": \"Carta não encontrada no banco local e nem na API do TCGdex.\"}");
                        }
                        return;
                    }

                    if (buscaAtributo != null && buscaValor != null) {
                        List<Carta> resultados = cartaService.pesquisarCartasNoCatalogo(buscaAtributo, buscaValor, pagina, tamanhoPagina, conn);
                        response.setStatus(200);
                        out.print(gson.toJson(resultados));
                        return;
                    }

                    List<Carta> catalogo = cartaService.listarCatalogo(pagina, tamanhoPagina, conn);
                    response.setStatus(200);
                    out.print(gson.toJson(catalogo));
                }

            } catch (NumberFormatException e) {
                response.setStatus(400);
                out.print("{\"erro\": \"Os parâmetros de página e tamanho devem ser números inteiros.\"}");
            } catch (IllegalArgumentException e) {
                response.setStatus(400);
                out.print("{\"erro\": \"" + e.getMessage() + "\"}");
            } catch (Exception e) {
                ControllerUtils.tratarErro(response, out, e);
            }
        }

        @Override
        protected void doPut(HttpServletRequest request, HttpServletResponse response) throws IOException {
            ControllerUtils.configurarResposta(response);
            PrintWriter out = response.getWriter();

            try {
                Carta cartaAtualizada = gson.fromJson(request.getReader(), Carta.class);

                if (cartaAtualizada == null || cartaAtualizada.getId() == null) {
                    response.setStatus(400);
                    out.print("{\"erro\": \"O JSON deve conter o objeto Carta completo, incluindo o 'id'.\"}");
                    return;
                }

                try (Connection conn = Conexao.getConexao()) {
                    boolean sucesso = cartaService.atualizarCarta(cartaAtualizada, conn);

                    if (sucesso) {
                        response.setStatus(200);
                        out.print("{\"mensagem\": \"Carta atualizada com sucesso no catálogo local!\"}");
                    } else {
                        response.setStatus(404);
                        out.print("{\"erro\": \"Carta não encontrada no catálogo local para atualização.\"}");
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
                CartaID cartaDeletada = gson.fromJson(request.getReader(), CartaID.class);

                if (cartaDeletada == null || cartaDeletada.id == null || cartaDeletada.id.trim().isEmpty()) {
                    response.setStatus(400);
                    out.print("{\"erro\": \"O campo 'id' é obrigatório no JSON para exclusão.\"}");
                    return;
                }

                try (Connection conn = Conexao.getConexao()) {
                    boolean sucesso = cartaService.deletarPorID(cartaDeletada.id, conn);

                    if (sucesso) {
                        response.setStatus(200);
                        out.print("{\"mensagem\": \"Carta deletada do catálogo local com sucesso!\"}");
                    } else {
                        response.setStatus(404);
                        out.print("{\"erro\": \"Carta não encontrada para exclusão.\"}");
                    }
                }
            } catch (Exception e) {
                ControllerUtils.tratarErro(response, out, e);
            }
        }

        private static class CartaID {
            String id;
        }
    }