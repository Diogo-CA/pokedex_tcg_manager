package br.com.amumus.service;

import br.com.amumus.model.Carta;
import br.com.amumus.repository.CartaRepository;
import br.com.amumus.utils.CartaMapper;
import net.tcgdex.sdk.TCGdex;
import net.tcgdex.sdk.models.Card;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CartaService {

    private final CartaRepository cartaRepository;
    private final TCGdex tcgdexApi;
    private final HttpClient httpClient;
    private final Gson gson;

    public CartaService() {
        this.cartaRepository = new CartaRepository();
        this.tcgdexApi = new TCGdex("pt");
        this.httpClient = HttpClient.newHttpClient();
        this.gson = new Gson();
    }

    public Carta buscarOuBaixarPorId(String idCarta, Connection connection) throws SQLException {

        Carta cartaLocal = cartaRepository.buscarPorId(idCarta, connection);

        if (cartaLocal != null) {
            System.out.println("Carta encontrada no banco: " + cartaLocal.getNome());
            return cartaLocal;
        }

        System.out.println("Carta não encontrada. Buscando na API externa...");

        try {
            Card cardDaApi = tcgdexApi.fetchCard(idCarta);

            if (cardDaApi != null) {
                Carta novaCarta = CartaMapper.converterCard(cardDaApi);
                cartaRepository.salvar(novaCarta, connection);
                System.out.println("Carta nova salva no Banco: " + novaCarta.getNome());
                return novaCarta;
            }
        } catch (Exception e) {
            System.err.println("Falha no TCGdex: " + e.getMessage());
        }
        return null;
    }

    public List<Carta> vitriniFiltro(String atributo, String valor) {

        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("O termo de busca não pode estar vazio.");
        }
        if (atributo == null || atributo.trim().isEmpty()) {
            throw new IllegalArgumentException("O atributo de filtro não pode estar vazio.");
        }

        List<Carta> vitrine = new ArrayList<>();

        try {

            String valorCodificado = valor.replace(" ", "%20");
            String url = "https://api.tcgdex.net/v2/pt/cards?" + atributo + "=" + valorCodificado;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {

                List<CartaResumoDTO> resultadosApi = gson.fromJson(response.body(), new TypeToken<List<CartaResumoDTO>>() {
                }.getType());

                for (CartaResumoDTO dto : resultadosApi) {
                    Carta cartaBasica = new Carta();
                    cartaBasica.setId(dto.id);
                    cartaBasica.setNome(dto.name);

                    if (dto.image != null) {
                        cartaBasica.setImagem(dto.image + "/low.webp");
                    }

                    vitrine.add(cartaBasica);
                }
            } else {
                System.err.println("Erro na API: HTTP " + response.statusCode());
            }

        } catch (Exception e) {
            System.err.println("Erro de conexão na Vitrine: " + e.getMessage());
        }
        return vitrine;
    }

    public List<Carta> pesquisarCartasNoCatalogo(String atributo, String valor, int pagina, int tamanhoPagina, Connection connection) throws SQLException {

        if (valor == null || valor.trim().isEmpty()) {
            throw new IllegalArgumentException("O termo de busca não pode estar vazio.");
        }
        if (atributo == null || atributo.trim().isEmpty()) {
            throw new IllegalArgumentException("O atributo de filtro não pode estar vazio.");
        }

        return cartaRepository.buscar(valor, atributo, pagina, tamanhoPagina, connection);
    }

    public List<Carta> listarCatalogo(int pagina, int tamanhoPagina, Connection connection) throws SQLException {
        return cartaRepository.buscarTodas(pagina, tamanhoPagina, connection);
    }

    public boolean deletarPorID(String idCarta, Connection connection) throws SQLException {
        return cartaRepository.deletarId(idCarta, connection);
    }


    private static class CartaResumoDTO {
        String id;
        String name;
        String image;
        String localId;
    }
}