package com.mirador.hotel.model;

import java.math.BigDecimal;
import java.util.Objects;

public class Fournisseur {
    private Integer codeFournisseur;
    private String numero;
    private String nom;
    private String contact;
    private BigDecimal solde;

    public Fournisseur() {
    }

    public Fournisseur(Integer codeFournisseur, String numero, String nom, String contact, BigDecimal solde) {
        this.codeFournisseur = codeFournisseur;
        this.numero = numero;
        this.nom = nom;
        this.contact = contact;
        this.solde = solde;
    }

    public Integer getCodeFournisseur() {
        return codeFournisseur;
    }

    public void setCodeFournisseur(Integer codeFournisseur) {
        this.codeFournisseur = codeFournisseur;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public BigDecimal getSolde() {
        return solde;
    }

    public void setSolde(BigDecimal solde) {
        this.solde = solde;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Fournisseur that = (Fournisseur) o;
        return Objects.equals(codeFournisseur, that.codeFournisseur) &&
                Objects.equals(numero, that.numero) &&
                Objects.equals(nom, that.nom) &&
                Objects.equals(contact, that.contact) &&
                Objects.equals(solde, that.solde);
    }

    @Override
    public int hashCode() {
        return Objects.hash(codeFournisseur, numero, nom, contact, solde);
    }

    @Override
    public String toString() {
        return "Fournisseur{" +
                "codeFournisseur=" + codeFournisseur +
                ", numero='" + numero + '\'' +
                ", nom='" + nom + '\'' +
                ", contact='" + contact + '\'' +
                ", solde=" + solde +
                '}';
    }
}
