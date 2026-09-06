package com.mirador.hotel.model;

public class Chambre {

    private Long id;
    private String numero;
    private String type;
    private Double prix;
    private String statut;
    private String nettoyage;
    private String description;
    private Integer capacite;

    public Chambre() {
    }

    public Chambre(Long id, String numero, String type, Double prix, String statut, String nettoyage, String description,
            Integer capacite) {
        this.id = id;
        this.numero = numero;
        this.type = type;
        this.prix = prix;
        this.statut = statut;
        this.nettoyage = nettoyage;
        this.description = description;
        this.capacite = capacite;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Double getPrix() {
        return prix;
    }

    public void setPrix(Double prix) {
        this.prix = prix;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getNettoyage() {
        return nettoyage;
    }

    public void setNettoyage(String nettoyage) {
        this.nettoyage = nettoyage;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCapacite() {
        return capacite;
    }

    public void setCapacite(Integer capacite) {
        this.capacite = capacite;
    }
}
