package com.mirador.hotel.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Objects;

public class Reservation {

    private Long id;
    private Chambre chambre;
    private Client client;
    private LocalDate dateArrivee;
    private LocalDate dateDepart;
    private String statut;
    private Double montant;
    private Integer nombrePersonnes;
    private LocalDateTime createdAt;

    public Reservation() {
    }

    public Reservation(Long id, Chambre chambre, Client client, LocalDate dateArrivee, LocalDate dateDepart,
            String statut, Double montant, Integer nombrePersonnes, LocalDateTime createdAt) {
        this.id = id;
        this.chambre = chambre;
        this.client = client;
        this.dateArrivee = dateArrivee;
        this.dateDepart = dateDepart;
        this.statut = statut;
        this.montant = montant;
        this.nombrePersonnes = nombrePersonnes;
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

    public Chambre getChambre() {
        return chambre;
    }

    public void setChambre(Chambre chambre) {
        this.chambre = chambre;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public LocalDate getDateArrivee() {
        return dateArrivee;
    }

    public void setDateArrivee(LocalDate dateArrivee) {
        this.dateArrivee = dateArrivee;
    }

    public LocalDate getDateDepart() {
        return dateDepart;
    }

    public void setDateDepart(LocalDate dateDepart) {
        this.dateDepart = dateDepart;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Double getMontant() {
        return montant;
    }

    public void setMontant(Double montant) {
        this.montant = montant;
    }

    public Integer getNombrePersonnes() {
        return nombrePersonnes;
    }

    public void setNombrePersonnes(Integer nombrePersonnes) {
        this.nombrePersonnes = nombrePersonnes;
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
        if (!(o instanceof Reservation other)) {
            return false;
        }
        if (!other.canEqual(this)) {
            return false;
        }
        return Objects.equals(id, other.id)
                && Objects.equals(chambre, other.chambre)
                && Objects.equals(client, other.client)
                && Objects.equals(dateArrivee, other.dateArrivee)
                && Objects.equals(dateDepart, other.dateDepart)
                && Objects.equals(statut, other.statut)
                && Objects.equals(montant, other.montant)
                && Objects.equals(nombrePersonnes, other.nombrePersonnes)
                && Objects.equals(createdAt, other.createdAt);
    }

    protected boolean canEqual(Object other) {
        return other instanceof Reservation;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, chambre, client, dateArrivee, dateDepart, statut, montant, nombrePersonnes, createdAt);
    }

    @Override
    public String toString() {
        return "Reservation{"
                + "id=" + id
                + ", chambre=" + chambre
                + ", client=" + client
                + ", dateArrivee=" + dateArrivee
                + ", dateDepart=" + dateDepart
                + ", statut='" + statut + '\''
                + ", montant=" + montant
                + ", nombrePersonnes=" + nombrePersonnes
                + ", createdAt=" + createdAt
                + '}';
    }
}
