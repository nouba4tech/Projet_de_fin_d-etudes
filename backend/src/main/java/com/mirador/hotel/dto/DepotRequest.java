package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;

public record DepotRequest(
        @NotBlank(message = "Le libelle du depot est obligatoire")
        String libelle) {
}
