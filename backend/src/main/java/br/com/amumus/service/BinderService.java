package br.com.amumus.service;

import br.com.amumus.model.Binder;
import br.com.amumus.model.CartaColecao;
import br.com.amumus.repository.BinderRepository;
import br.com.amumus.repository.CartaColecaoRepository;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.List;

public class BinderService {

    private final BinderRepository binderRepository;
    private final CartaColecaoRepository colecaoRepository;

    public BinderService() {
        this.binderRepository = new BinderRepository();
        this.colecaoRepository = new CartaColecaoRepository();
    }

    public boolean criarNovaPasta(Binder binder, Connection connection) throws SQLException {

        if (binder.getUsuario() == null || binder.getUsuario().getId() == null) {
            System.err.println("LOG SERVICE: Falha. Não é possível criar uma pasta sem um dono (Usuario ID).");
            return false;
        }

        if (binder.getNome() == null || binder.getNome().trim().isEmpty()) {
            binder.setNome("Nova Pasta");
        }

        boolean sucesso = binderRepository.salvar(binder, connection);
        if (sucesso) {
            System.out.println("LOG SERVICE: Pasta '" + binder.getNome() + "' criada com sucesso para o usuário " + binder.getUsuario().getId());
        }
        return sucesso;
    }

    public List<Binder> listarPastasDoUsuario(Long idUsuario, Connection connection) throws SQLException {

        if (idUsuario == null) throw new IllegalArgumentException("ID do Usuário não pode ser nulo.");
        return binderRepository.listarPorUsuario(idUsuario, connection);
    }

    public Binder abrirPastaCompleta(Long idBinder, Connection connection) throws SQLException {
        if (idBinder == null) return null;

        Binder binder = binderRepository.buscarPorId(idBinder, connection);

        if (binder != null) {
            List<CartaColecao> cartasDentroDaPasta = colecaoRepository.listarPorBinder(idBinder, connection);
            binder.setCartasDoBinder(cartasDentroDaPasta);
        }

        return binder;
    }

    public boolean renomearPasta(Binder binderAtualizado, Connection connection) throws SQLException {

        if (binderAtualizado.getId() == null || binderAtualizado.getNome() == null || binderAtualizado.getNome().trim().isEmpty()) {
            System.err.println("LOG SERVICE: ID e Nome são obrigatórios para renomear a pasta.");
            return false;
        }

        return binderRepository.atualizar(binderAtualizado, connection);
    }

    public boolean excluirPasta(Long idBinder, Connection connection) throws SQLException {

        if (idBinder == null) return false;

        List<CartaColecao> cartasNaPasta = colecaoRepository.listarPorBinder(idBinder, connection);

        for (CartaColecao carta : cartasNaPasta) {
            carta.setBinder(null);
            colecaoRepository.atualizar(carta, connection);
        }

        return binderRepository.deletar(idBinder, connection);
    }
}