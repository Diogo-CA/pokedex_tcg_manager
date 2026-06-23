package br.com.amumus.service;

import br.com.amumus.model.CartaColecao;
import br.com.amumus.repository.CartaColecaoRepository;
import br.com.amumus.repository.CartaRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class CartaColecaoService {

    private final CartaColecaoRepository colecaoRepository;
    private final CartaRepository cartaRepository;

    public CartaColecaoService() {
        this.colecaoRepository = new CartaColecaoRepository();
        this.cartaRepository = new CartaRepository();
    }

    public boolean adicionarAoInventario(CartaColecao item, Connection connection) throws SQLException {

        if (item.getCartaBase() == null || item.getCartaBase().getId() == null) {
            System.err.println("LOG SERVICE: Tentativa de adicionar carta sem ID da base.");
            return false;
        }
        if (item.getDono() == null || item.getDono().getId() == null) {
            System.err.println("LOG SERVICE: Tentativa de adicionar carta sem um Usuário dono.");
            return false;
        }

        var cartaBaseExiste = cartaRepository.buscarPorId(item.getCartaBase().getId(), connection);
        if (cartaBaseExiste == null) {
            System.err.println("LOG SERVICE: A carta base '" + item.getCartaBase().getId() + "' não existe no catálogo.");
            return false;
        }

        if (item.getQuantidade() <= 0) {
            item.setQuantidade(1);
        }
        if (item.getDataAdcionada() == null) {
            item.setDataAdcionada(LocalDateTime.now());
        }

        boolean sucesso = colecaoRepository.salvar(item, connection);
        if (sucesso) {
            System.out.println("LOG SERVICE: Carta '" + cartaBaseExiste.getNome() + "' adicionada à coleção do usuário " + item.getDono().getId());
        }
        return sucesso;
    }

    public List<CartaColecao> listarInventarioCompleto(Long idUsuario, Connection connection) throws SQLException {
        if (idUsuario == null) throw new IllegalArgumentException("ID do Usuário não pode ser nulo.");
        return colecaoRepository.listarInventarioGlobal(idUsuario, connection);
    }

    public List<CartaColecao> listarCartasDaPasta(Long idBinder, Connection connection) throws SQLException {
        if (idBinder == null) throw new IllegalArgumentException("ID da Pasta (Binder) não pode ser nulo.");
        return colecaoRepository.listarPorBinder(idBinder, connection);
    }

    public boolean atualizarItem(CartaColecao itemAtualizado, Connection connection) throws SQLException {

        if (itemAtualizado.getId() == null) {
            System.err.println("LOG SERVICE: ID não informado para o UPDATE.");
            return false;
        }

        CartaColecao itemAntigo = colecaoRepository.buscarPorId(itemAtualizado.getId(), connection);

        if (itemAntigo != null) {

            if (itemAtualizado.getQuantidade() <= 0) {
                System.out.println("LOG SERVICE: Quantidade zerada. Removendo carta do inventário automaticamente...");
                return colecaoRepository.deletar(itemAtualizado.getId(), connection);
            }
            return colecaoRepository.atualizar(itemAtualizado, connection);
        }

        System.err.println("LOG SERVICE: Item " + itemAtualizado.getId() + " não encontrado na coleção.");
        return false;
    }

    public boolean removerDoInventario(Long idItemColecao, Connection connection) throws SQLException {
        if (idItemColecao == null) return false;
        return colecaoRepository.deletar(idItemColecao, connection);
    }
}