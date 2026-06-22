package br.com.amumus.model;

import br.com.amumus.model.ENUMS.CondicaoEnum;

public class WishList {

    private Long id;
    private Usuario usuario;
    private Carta cartaDesejada;
    private boolean foiDesejada;
    private CondicaoEnum condicaoDesejada;

    public WishList() {
    }

    public WishList(Long id, CondicaoEnum condicaoDesejada, boolean foiDesejada, Carta cartaDesejada, Usuario usuario) {
        this.id = id;
        this.condicaoDesejada = condicaoDesejada;
        this.foiDesejada = foiDesejada;
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

    public boolean isFoilDesejada() { return this.foiDesejada; }

    public void setFoilDesejada(boolean isfoilDesejada) {
        this.foiDesejada = isfoilDesejada;
    }
}
