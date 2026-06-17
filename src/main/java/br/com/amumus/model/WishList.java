package br.com.amumus.model;

import br.com.amumus.model.ENUMS.CondicaoEnum;

public class WishList {

    private Long id;
    private Usuario usuario;
    private Carta cartaDesejada;
    private boolean isfoilDesejada;
    private CondicaoEnum condicaoDesejada;

    public WishList() {
    }

    public WishList(Long id, CondicaoEnum condicaoDesejada, boolean isfoilDesejada, Carta cartaDesejada, Usuario usuario) {
        this.id = id;
        this.condicaoDesejada = condicaoDesejada;
        this.isfoilDesejada = isfoilDesejada;
        this.cartaDesejada = cartaDesejada;
        this.usuario = usuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Carta getCartaDesejada() {
        return cartaDesejada;
    }

    public void setCartaDesejada(Carta cartaDesejada) {
        this.cartaDesejada = cartaDesejada;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public CondicaoEnum getCondicaoDesejada() {
        return condicaoDesejada;
    }

    public void setCondicaoDesejada(CondicaoEnum condicaoDesejada) {
        this.condicaoDesejada = condicaoDesejada;
    }

    public boolean isIsfoilDesejada() {
        return isfoilDesejada;
    }

    public void setIsfoilDesejada(boolean isfoilDesejada) {
        this.isfoilDesejada = isfoilDesejada;
    }
}
