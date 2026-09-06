package com.mirador.hotel.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class RestaurantOrder {

    private Long id;
    private String tableNumber;
    private Client client;
    private String items;
    private Double total;
    private String statut;
    private String type;
    private LocalDateTime createdAt;

    public RestaurantOrder() {
    }

    public RestaurantOrder(Long id, String tableNumber, Client client, String items, Double total, String statut,
            String type, LocalDateTime createdAt) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.client = client;
        this.items = items;
        this.total = total;
        this.statut = statut;
        this.type = type;
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

    public String getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(String tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public String getItems() {
        return items;
    }

    public void setItems(String items) {
        this.items = items;
    }

    public Double getTotal() {
        return total;
    }

    public void setTotal(Double total) {
        this.total = total;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
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
        if (!(o instanceof RestaurantOrder other)) {
            return false;
        }
        if (!other.canEqual(this)) {
            return false;
        }
        return Objects.equals(id, other.id)
                && Objects.equals(tableNumber, other.tableNumber)
                && Objects.equals(client, other.client)
                && Objects.equals(items, other.items)
                && Objects.equals(total, other.total)
                && Objects.equals(statut, other.statut)
                && Objects.equals(type, other.type)
                && Objects.equals(createdAt, other.createdAt);
    }

    protected boolean canEqual(Object other) {
        return other instanceof RestaurantOrder;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, tableNumber, client, items, total, statut, type, createdAt);
    }

    @Override
    public String toString() {
        return "RestaurantOrder{"
                + "id=" + id
                + ", tableNumber='" + tableNumber + '\''
                + ", client=" + client
                + ", items='" + items + '\''
                + ", total=" + total
                + ", statut='" + statut + '\''
                + ", type='" + type + '\''
                + ", createdAt=" + createdAt
                + '}';
    }
}
