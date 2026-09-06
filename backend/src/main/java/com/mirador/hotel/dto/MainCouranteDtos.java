package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;

public final class MainCouranteDtos {

    private MainCouranteDtos() {
    }

    public record MainCouranteRequest(
            @NotBlank(message = "La date de l'entree est obligatoire")
            String entryDate,

            String entryTime,

            @NotBlank(message = "La categorie est obligatoire")
            String category,

            @NotBlank(message = "La priorite est obligatoire")
            String priority,

            @NotBlank(message = "Le titre est obligatoire")
            String title,

            String description,
            String location,
            String reportedBy,
            String assignedTo,

            @NotBlank(message = "Le statut est obligatoire")
            String status) {
    }

    public record MainCouranteResponse(
            Long id,
            String entryDate,
            String entryTime,
            String category,
            String priority,
            String title,
            String description,
            String location,
            String reportedBy,
            String assignedTo,
            String status,
            String resolution,
            String resolvedBy,
            String resolvedAt,
            String createdAt) {
    }

    public record MainCouranteResolveRequest(
            String resolution,
            String resolvedBy) {
    }

    public record MainCouranteStatusRequest(
            @NotBlank(message = "Le statut est obligatoire")
            String status) {
    }
}
