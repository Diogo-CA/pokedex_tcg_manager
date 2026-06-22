package br.com.amumus.model;

public class Carta {

    private String id;
    private String nome;
    private String colecao;
    private String raridade;
    private String numero_na_colecao;
    private String ilustrador;
    private String imagem;
    private Boolean isWish;

    public Carta() {
    }

    public Carta(String id, String nome, String colecao, String raridade, String numeroNaColecao, String ilustrador, String imagem) {
        this.id = id;
        this.nome = nome;
        this.colecao = colecao;
        this.raridade = raridade;
        this.numero_na_colecao = numeroNaColecao;
        this.ilustrador = ilustrador;
        this.imagem = imagem;
        this.isWish = false;
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

    public String getNumero_na_colecao() { return numero_na_colecao; }

    public void setNumero_na_colecao(String numero_na_colecao) {
        this.numero_na_colecao = numero_na_colecao;
    }

    public Boolean getIsWish() { return isWish; }

}
