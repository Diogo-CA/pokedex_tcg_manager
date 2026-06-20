package br.com.amumus.service;

import br.com.amumus.model.CartaColecao;
import br.com.amumus.repository.BinderRepository;
import br.com.amumus.repository.CartaRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class BinderService {

    private final BinderRepository binderRepository;
    private final CartaRepository cartaRepository;

    public BinderService() {
        this.binderRepository = new BinderRepository();
        this.cartaRepository = new CartaRepository();
    }

    public boolean adicionarAoBinder(CartaColecao item, Connection connection) throws SQLException {

        // Regra 1: Segurança do ID da carta base
        if (item.getCartaBase() == null || item.getCartaBase().getId() == null) {
            System.err.println("LOG SERVICE: Falha. Tentativa de adicionar ao álbum sem o ID da carta base.");
            return false;
        }

        var cartaBaseExiste = cartaRepository.buscarPorId(item.getCartaBase().getId(), connection);
        if (cartaBaseExiste == null) {
            System.err.println("LOG SERVICE: A carta '" + item.getCartaBase().getId() + "' não existe no catálogo central.");
            return false;
        }

        if (item.getDataAdcionada() == null) {
            item.setDataAdcionada(LocalDateTime.now());
        }

        boolean salvo = binderRepository.salvarNoBinder(item, connection);
        if (salvo) {
            System.out.println("LOG SERVICE: Carta '" + cartaBaseExiste.getNome() + "' adicionada");
        }
        return salvo;
    }

    public List<CartaColecao> listarCartasDoBinder(Long binderId, int pagina, int tamanhoPagina, Connection connection) throws SQLException {

        int pagSegura = (pagina > 0) ? pagina : 1;
        int tamSeguro = (tamanhoPagina > 0) ? tamanhoPagina : 20;

        return binderRepository.listarBinder(binderId, pagSegura, tamSeguro, connection);
    }

    public boolean atualizarCartaBinder(CartaColecao itemAtualizado, Connection connection) throws SQLException {

        if (itemAtualizado.getId() == null) {
            System.err.println("LOG SERVICE: Falha. ID não informado para o UPDATE.");
            return false;
        }

        CartaColecao itemAntigo = binderRepository.buscarPorId(itemAtualizado.getId(), connection);

        if (itemAntigo != null) {
            if (itemAtualizado.getQuantidade() <= 0) {
                System.out.println("LOG SERVICE: Quantidade atualizada para 0. Removendo carta do álbum...");
                return binderRepository.deletar(itemAtualizado.getId(), connection);
            }

            return binderRepository.atualizar(itemAtualizado, connection);
        }

        System.err.println("LOG SERVICE: Carta de ID " + itemAtualizado.getId() + " não encontrado no Binder.");
        return false;
    }

    public boolean removerDoBinder(Long idItemColecao, Connection connection) throws SQLException {
        return binderRepository.deletar(idItemColecao, connection);
    }
}