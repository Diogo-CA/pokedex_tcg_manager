package br.com.amumus.model;

import java.util.List;

public class Binder {

    private Long id;
    private String nome;
    private Usuario usuario;
    private List<CartaColecao> cartasDoBinder;

    public Binder() {
    }

    public Binder(String nome, Long id, Usuario usuario, List<CartaColecao> cartasDoBinder) {
        this.nome = nome;
        this.id = id;
        this.usuario = usuario;
        this.cartasDoBinder = cartasDoBinder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public List<CartaColecao> getCartasDoBinder() {
        return cartasDoBinder;
    }

    public void setCartasDoBinder(List<CartaColecao> cartasDoBinder) {
        this.cartasDoBinder = cartasDoBinder;
    }
}
