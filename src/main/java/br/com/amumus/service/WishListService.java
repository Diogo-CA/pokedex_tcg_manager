package br.com.amumus.service;

import br.com.amumus.model.Carta;
import br.com.amumus.model.WishList;
import br.com.amumus.repository.CartaRepository;
import br.com.amumus.repository.WishListRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public class WishListService {

    private final WishListRepository wishListRepository;
    private final CartaRepository cartaRepository;

    public WishListService() {
        this.wishListRepository = new WishListRepository();
        this.cartaRepository = new CartaRepository();
    }


    public boolean adicionarItem(WishList item, Connection connection) throws SQLException {

        if (item.getUsuario() == null || item.getUsuario().getId() == null) {
            System.err.println("LOG SERVICE: Falha. É necessário um Usuário para criar um desejo.");
            return false;
        }

        if (item.getCartaDesejada() == null || item.getCartaDesejada().getId() == null) {
            System.err.println("LOG SERVICE: Falha. É necessário o ID da carta desejada.");
            return false;
        }

        Carta cartaBase = cartaRepository.buscarPorId(item.getCartaDesejada().getId(), connection);
        if (cartaBase == null) {
            System.err.println("LOG SERVICE: A carta '" + item.getCartaDesejada().getId() + "' não existe no sistema.");
            return false;
        }

        boolean sucesso = wishListRepository.salvar(item, connection);
        if (sucesso) {
            System.out.println("LOG SERVICE: Carta '" + cartaBase.getNome() + "' adicionada à Wishlist do usuário " + item.getUsuario().getId());
        }
        return sucesso;
    }


    public List<WishList> listarDesejosDoUsuario(Long idUsuario, Connection connection) throws SQLException {

        if (idUsuario == null) throw new IllegalArgumentException("ID do Usuário não pode ser nulo.");

        List<WishList> listaDeDesejos = wishListRepository.listarPorUsuario(idUsuario, connection);

        for (WishList item : listaDeDesejos) {
            if (item.getCartaDesejada() != null && item.getCartaDesejada().getId() != null) {

                Carta cartaCompleta = cartaRepository.buscarPorId(item.getCartaDesejada().getId(), connection);
                item.setCartaDesejada(cartaCompleta);
            }
        }

        return listaDeDesejos;
    }

    public boolean atualizarCriterios(WishList itemAtualizado, Connection connection) throws SQLException {

        if (itemAtualizado.getId() == null) {
            System.err.println("LOG SERVICE: ID do item da wishlist não informado para atualização.");
            return false;
        }

        WishList itemAntigo = wishListRepository.buscarPorId(itemAtualizado.getId(), connection);

        if (itemAntigo != null) {
            return wishListRepository.atualizar(itemAtualizado, connection);
        }

        System.err.println("LOG SERVICE: Item de Wishlist não encontrado.");
        return false;
    }

    public boolean removerItem(Long idItem, Connection connection) throws SQLException {
        if (idItem == null) return false;
        return wishListRepository.deletar(idItem, connection);
    }
}