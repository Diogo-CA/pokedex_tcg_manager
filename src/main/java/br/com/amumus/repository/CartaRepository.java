package br.com.amumus.repository;

import br.com.amumus.model.Carta;
import br.com.amumus.utils.CartaMapper;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class CartaRepository {

    public void salvar(Carta carta, Connection connection) throws SQLException {

        String sql = "INSERT INTO cartas (id, nome, numero_na_colecao, colecao, raridade, ilustrador, imagem) VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, carta.getId());
            stmt.setString(2, carta.getNome());
            stmt.setString(3, carta.getNumero_na_colecao());
            stmt.setString(4, carta.getColecao());
            stmt.setString(5, carta.getRaridade());
            stmt.setString(6, carta.getIlustrador());
            stmt.setString(7, carta.getImagem());

            stmt.executeUpdate();
            System.out.println("Carta " + carta.getNome() + " salva com sucesso!");
        }
    }

    public boolean atualizar(Carta carta, Connection connection) throws SQLException {

        String sql = "UPDATE cartas SET nome = ?, numero_na_colecao = ?, colecao = ?, raridade = ?, ilustrador = ?, imagem = ? WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, carta.getNome());
            stmt.setString(2, carta.getNumero_na_colecao());
            stmt.setString(3, carta.getColecao());
            stmt.setString(4, carta.getRaridade());
            stmt.setString(5, carta.getIlustrador());
            stmt.setString(6, carta.getImagem());
            stmt.setString(7, carta.getId());

            int linhas = stmt.executeUpdate();

            return linhas > 0;
        }
    }

    public Carta buscarPorId(String idCarta, Connection connection) throws SQLException {
        String sql = "SELECT * FROM cartas WHERE id = ?";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, idCarta);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Carta cartaEncontrada = CartaMapper.converterRs(rs);
                    return cartaEncontrada;
                }
            }
        }
        return null;
    }

    public List<Carta> buscar(String valor, String atributo, int pagina, int tamanhoPagina, Connection connection) throws SQLException {

        List<String> colunasPermitidas = List.of("id", "nome", "numero_na_colecao", "colecao", "raridade", "ilustrador");

        if (!colunasPermitidas.contains(atributo.toLowerCase())) {
            throw new IllegalArgumentException("Erro de segurança: O atributo '" + atributo + "' não é válido para busca.");
        }

        int offset = (pagina - 1) * tamanhoPagina;

        String sql = "SELECT * FROM cartas WHERE " + atributo + " LIKE ? LIMIT ? OFFSET ?";

        List<Carta> cartasEncontradas = new ArrayList<>();

        String valorParaBusca = "%" + valor + "%";

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, valorParaBusca);
            stmt.setInt(2, tamanhoPagina);
            stmt.setInt(3, offset);

            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    Carta carta = CartaMapper.converterRs(rs);
                    cartasEncontradas.add(carta);
                }
            }
        }
        return cartasEncontradas;
    }

    public List<Carta> buscarTodas(int pagina, int tamanhoPagina, Connection connection) throws SQLException {


        int offset = (pagina - 1) * tamanhoPagina;

        String sql = "SELECT id, nome, numero_na_colecao, colecao, raridade, ilustrador, imagem FROM cartas LIMIT ? OFFSET ?";

        List<Carta> todasAsCartas = new ArrayList<>();

        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setInt(1, tamanhoPagina);
            stmt.setInt(2, offset);

            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    Carta carta = CartaMapper.converterRs(rs);
                    todasAsCartas.add(carta);
                }
            }
        }
        return todasAsCartas;
    }

    public boolean deletarId(String idCarta, Connection connection) throws SQLException {

        String sql = "DELETE FROM cartas WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {

            stmt.setString(1, idCarta);
            int linhas = stmt.executeUpdate();

            return linhas > 0;
        }
    }
}
