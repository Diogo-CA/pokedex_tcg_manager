package br.com.amumus.service;

import br.com.amumus.model.Usuario;
import br.com.amumus.repository.UsuarioRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.util.List;

public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService() {
        this.usuarioRepository = new UsuarioRepository();
    }

    public boolean cadastrarUsuario(Usuario usuario, Connection connection) throws SQLException {

        if (usuario == null) {
            System.err.println("LOG SERVICE: Falha. Dados do usuário não fornecidos.");
            return false;
        }

        if (usuario.getNome() == null || usuario.getNome().trim().isEmpty()) {
            System.err.println("LOG SERVICE: Falha. Nome do usuário é obrigatório.");
            return false;
        }

        if (usuario.getEmail() == null || usuario.getEmail().trim().isEmpty() || !usuario.getEmail().contains("@")) {
            System.err.println("LOG SERVICE: Falha. E-mail inválido ou vazio.");
            return false;
        }

        if (usuario.getSenha() == null || usuario.getSenha().trim().isEmpty()) {
            System.err.println("LOG SERVICE: Falha. Senha é obrigatória.");
            return false;
        }

        Usuario usuarioExistente = usuarioRepository.buscarPorEmail(usuario.getEmail(), connection);
        if (usuarioExistente != null) {
            System.err.println("LOG SERVICE: Falha. E-mail '" + usuario.getEmail() + "' já está em uso.");
            return false;
        }

        usuario.setSenha(criptografarSenha(usuario.getSenha()));
        usuario.setDataCadastro(LocalDateTime.now());

        boolean sucesso = usuarioRepository.salvar(usuario, connection);
        if (sucesso) {
            System.out.println("LOG SERVICE: Usuário '" + usuario.getNome() + "' cadastrado com sucesso!");
        }
        return sucesso;
    }

    public Usuario buscarUsuarioPorId(Long id, Connection connection) throws SQLException {

        if (id == null) {
            return null;
        }

        return usuarioRepository.buscarPorId(id, connection);
    }

    public List<Usuario> listarTodosUsuarios(Connection connection) throws SQLException {

        return usuarioRepository.listarTodos(connection);
    }

    public boolean atualizarUsuario(Usuario usuario, Connection connection) throws SQLException {

        if (usuario == null || usuario.getId() == null) {
            System.err.println("LOG SERVICE: Falha. ID do usuário é obrigatório para atualização.");
            return false;
        }

        if (usuario.getNome() == null || usuario.getNome().trim().isEmpty()) {
            System.err.println("LOG SERVICE: Falha. Nome do usuário não pode ser vazio.");
            return false;
        }

        if (usuario.getEmail() == null || usuario.getEmail().trim().isEmpty() || !usuario.getEmail().contains("@")) {
            System.err.println("LOG SERVICE: Falha. E-mail inválido.");
            return false;
        }

        if (usuario.getSenha() == null || usuario.getSenha().trim().isEmpty()) {
            System.err.println("LOG SERVICE: Falha. Senha não pode ser vazia.");
            return false;
        }

        Usuario usuarioComMesmoEmail = usuarioRepository.buscarPorEmail(usuario.getEmail(), connection);
        if (usuarioComMesmoEmail != null && !usuarioComMesmoEmail.getId().equals(usuario.getId())) {
            System.err.println("LOG SERVICE: Falha. O e-mail '" + usuario.getEmail() + "' já está em uso por outro usuário.");
            return false;
        }

        usuario.setSenha(criptografarSenha(usuario.getSenha()));
        return usuarioRepository.atualizar(usuario, connection);
    }

    public boolean deletarUsuario(Long id, Connection connection) throws SQLException {

        if (id == null) {
            return false;
        }

        return usuarioRepository.deletar(id, connection);
    }

    public Usuario realizarLogin(String email, String senha, Connection connection) throws SQLException {

        if (email == null || email.trim().isEmpty() || senha == null || senha.trim().isEmpty()) {
            System.err.println("LOG SERVICE: Falha. E-mail e senha são obrigatórios para login.");
            return null;
        }

        Usuario usuario = usuarioRepository.buscarPorEmail(email, connection);
        if (usuario == null) {
            System.err.println("LOG SERVICE: Falha. Email ou Senha incorreta.");
            return null;
        }

        String senhaCriptografada = criptografarSenha(senha);
        if (!usuario.getSenha().equals(senhaCriptografada)) {
            System.err.println("LOG SERVICE: Falha. Email ou Senha incorreta.");
            return null;
        }

        System.out.println("LOG SERVICE: Usuário '" + usuario.getNome() + "' realizou login com sucesso!");
        return usuario;
    }

    private String criptografarSenha(String senha) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(senha.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();

            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Erro ao criptografar senha", e);
        }
    }
}

