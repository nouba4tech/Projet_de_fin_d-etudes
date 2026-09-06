package com.mirador.hotel.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Client {

    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String adresse;
    private String ville;
    private String pays;
    private String pieceIdentite;
    private LocalDateTime createdAt;

    public Client() {
    }

    public Client(Long id, String nom, String prenom, String email, String telephone, String adresse, String ville,
            String pays, String pieceIdentite, LocalDateTime createdAt) {
        this.id = id;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.telephone = telephone;
        this.adresse = adresse;
        this.ville = ville;
        this.pays = pays;
        this.pieceIdentite = pieceIdentite;
        this.createdAt = createdAt;
    }

    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getAdresse() {
        return adresse;
    }

    public void setAdresse(String adresse) {
        this.adresse = adresse;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getPays() {
        return pays;
    }

    public void setPays(String pays) {
        this.pays = pays;
    }

    public String getPieceIdentite() {
        return pieceIdentite;
    }

    public void setPieceIdentite(String pieceIdentite) {
        this.pieceIdentite = pieceIdentite;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Client other)) {
            return false;
        }
        if (!other.canEqual(this)) {
            return false;
        }
        return Objects.equals(id, other.id)
                && Objects.equals(nom, other.nom)
                && Objects.equals(prenom, other.prenom)
                && Objects.equals(email, other.email)
                && Objects.equals(telephone, other.telephone)
                && Objects.equals(adresse, other.adresse)
                && Objects.equals(ville, other.ville)
                && Objects.equals(pays, other.pays)
                && Objects.equals(pieceIdentite, other.pieceIdentite)
                && Objects.equals(createdAt, other.createdAt);
    }

    protected boolean canEqual(Object other) {
        return other instanceof Client;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, nom, prenom, email, telephone, adresse, ville, pays, pieceIdentite, createdAt);
    }

    @Override
    public String toString() {
        return "Client{"
                + "id=" + id
                + ", nom='" + nom + '\''
                + ", prenom='" + prenom + '\''
                + ", email='" + email + '\''
                + ", telephone='" + telephone + '\''
                + ", adresse='" + adresse + '\''
                + ", ville='" + ville + '\''
                + ", pays='" + pays + '\''
                + ", pieceIdentite='" + pieceIdentite + '\''
                + ", createdAt=" + createdAt
                + '}';
    }
}
