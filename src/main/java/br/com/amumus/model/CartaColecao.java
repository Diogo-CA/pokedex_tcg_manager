package br.com.amumus.model;

import br.com.amumus.model.ENUMS.CondicaoEnum;

import java.util.Date;

public class CartaColecao {

    private Long id;

    private Usuario dono;
    private Carta cartaBase;

    private int quantidade;
    private boolean isFoil;
    private CondicaoEnum condicao;
    private Binder binder;
    private Date dataAdcionada;
    private boolean isFavorita;

    public CartaColecao() {
    }

    public CartaColecao(Usuario dono, Carta cartaBase, int quantidade, boolean isFoil, CondicaoEnum condicao, Date dataAdcionada) {
        this.dono = dono;
        this.cartaBase = cartaBase;
        this.quantidade = quantidade;
        this.isFoil = isFoil;
        this.condicao = condicao;
        this.dataAdcionada = dataAdcionada;
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

    public Binder getBinder() {
        return binder;
    }

    public void setBinder(Binder binder) {
        this.binder = binder;
    }

    public Date getDataAdcionada() {
        return dataAdcionada;
    }

    public void setDataAdcionada(Date dataAdcionada) {
        this.dataAdcionada = dataAdcionada;
    }

    public boolean isFavorita() {
        return isFavorita;
    }

    public void setFavorita(boolean favorita) {
        isFavorita = favorita;
    }
}