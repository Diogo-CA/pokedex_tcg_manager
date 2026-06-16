package br.com.amumus.model;

import br.com.amumus.model.ENUMS.CondicaoEnum;

public class CartaColecao {

    private Long id;

    private Usuario dono;
    private Carta cartaBase;

    private int quantidade;
    private boolean isFoil;
    private CondicaoEnum condicao;

    public CartaColecao() {
    }

    public CartaColecao(Usuario dono, Carta cartaBase, int quantidade, boolean isFoil, CondicaoEnum condicao) {
        this.dono = dono;
        this.cartaBase = cartaBase;
        this.quantidade = quantidade;
        this.isFoil = isFoil;
        this.condicao = condicao;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public CondicaoEnum getCondicao() {
        return condicao;
    }

    public void setCondicao(CondicaoEnum condicao) {
        this.condicao = condicao;
    }

    public boolean isFoil() {
        return isFoil;
    }

    public void setFoil(boolean foil) {
        isFoil = foil;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public void setQuantidade(int quantidade) {
        this.quantidade = quantidade;
    }

    public Carta getCartaBase() {
        return cartaBase;
    }

    public void setCartaBase(Carta cartaBase) {
        this.cartaBase = cartaBase;
    }

    public Usuario getDono() {
        return dono;
    }

    public void setDono(Usuario dono) {
        this.dono = dono;
    }
}