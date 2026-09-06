package com.mirador.hotel.model;

import java.time.LocalDateTime;
import java.util.Objects;

public class Stock {

    private Long id;
    private String code;
    private String name;
    private String category;
    private Integer quantity;
    private Integer minQuantity;
    private Double unitPrice;
    private String supplier;
    private StockScope scope;
    private String scopeReference;
    private String description;
    private LocalDateTime lastUpdated;

    public Stock() {
    }

    public Stock(Long id, String code, String name, String category, Integer quantity, Integer minQuantity,
            Double unitPrice, String supplier, StockScope scope, String scopeReference, String description,
            LocalDateTime lastUpdated) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minQuantity = minQuantity;
        this.unitPrice = unitPrice;
        this.supplier = supplier;
        this.scope = scope;
        this.scopeReference = scopeReference;
        this.description = description;
        this.lastUpdated = lastUpdated;
    }

    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getMinQuantity() {
        return minQuantity;
    }

    public void setMinQuantity(Integer minQuantity) {
        this.minQuantity = minQuantity;
    }

    public Double getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public StockScope getScope() {
        return scope;
    }

    public void setScope(StockScope scope) {
        this.scope = scope;
    }

    public String getScopeReference() {
        return scopeReference;
    }

    public void setScopeReference(String scopeReference) {
        this.scopeReference = scopeReference;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Stock other)) {
            return false;
        }
        if (!other.canEqual(this)) {
            return false;
        }
        return Objects.equals(id, other.id)
                && Objects.equals(code, other.code)
                && Objects.equals(name, other.name)
                && Objects.equals(category, other.category)
                && Objects.equals(quantity, other.quantity)
                && Objects.equals(minQuantity, other.minQuantity)
                && Objects.equals(unitPrice, other.unitPrice)
                && Objects.equals(supplier, other.supplier)
                && Objects.equals(scope, other.scope)
                && Objects.equals(scopeReference, other.scopeReference)
                && Objects.equals(description, other.description)
                && Objects.equals(lastUpdated, other.lastUpdated);
    }

    protected boolean canEqual(Object other) {
        return other instanceof Stock;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, code, name, category, quantity, minQuantity, unitPrice, supplier, scope,
                scopeReference, description, lastUpdated);
    }

    @Override
    public String toString() {
        return "Stock{"
                + "id=" + id
                + ", code='" + code + '\''
                + ", name='" + name + '\''
                + ", category='" + category + '\''
                + ", quantity=" + quantity
                + ", minQuantity=" + minQuantity
                + ", unitPrice=" + unitPrice
                + ", supplier='" + supplier + '\''
                + ", scope='" + scope + '\''
                + ", scopeReference='" + scopeReference + '\''
                + ", description='" + description + '\''
                + ", lastUpdated=" + lastUpdated
                + '}';
    }
}
