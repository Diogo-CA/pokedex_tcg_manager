package br.com.amumus.model;

import java.time.LocalDateTime;
import java.util.List;

public class Usuario {

    private Long id;
    private String nome;
    private String email;
    private String senha;
    private LocalDateTime dataCadastro;

    private List<CartaColecao> colecao;
    private List<Binder> binders;

    public Usuario() {
    }

    public Usuario(Long id, LocalDateTime dataCadastro, String senha, String email, String nome) {
        this.id = id;
        this.dataCadastro = dataCadastro;
        this.senha = senha;
        this.email = email;
        this.nome = nome;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }

    public List<CartaColecao> getColecao() {
        return colecao;
    }

    public void setColecao(List<CartaColecao> colecao) {
        this.colecao = colecao;
    }

    public List<Binder> getBinders() {
        return binders;
    }

    public void setBinders(List<Binder> binders) {
        this.binders = binders;
    }
}
