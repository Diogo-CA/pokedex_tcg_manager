package br.com.amumus.model;

public class Carta {

    private String id;
    private String nome;
    private String colecao;
    private String raridade;
    private String numeroNaColecao;
    private String ilustrador;
    private String imagem;

    public Carta() {
    }

    public Carta(String id, String nome, String colecao, String raridade, String numeroNaColecao, String ilustrador, String imagem) {
        this.id = id;
        this.nome = nome;
        this.colecao = colecao;
        this.raridade = raridade;
        this.numeroNaColecao = numeroNaColecao;
        this.ilustrador = ilustrador;
        this.imagem = imagem;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getColecao() {
        return colecao;
    }

    public void setColecao(String colecao) {
        this.colecao = colecao;
    }

    public String getIlustrador() {
        return ilustrador;
    }

    public void setIlustrador(String ilustrador) {
        this.ilustrador = ilustrador;
    }

    public String getRaridade() {
        return raridade;
    }

    public void setRaridade(String raridade) {
        this.raridade = raridade;
    }

    public String getImagem() {
        return imagem;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public String getNumeroNaColecao() {
        return numeroNaColecao;
    }

    public void setNumeroNaColecao(String numeroNaColecao) {
        this.numeroNaColecao = numeroNaColecao;
    }
}
