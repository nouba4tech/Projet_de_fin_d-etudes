package com.mirador.hotel.dto;

import java.math.BigDecimal;

public class FournisseurDtos {
    public record FournisseurRequest(
            String numero,
            String nom,
            String contact,
            BigDecimal solde
    ) {}

    public record FournisseurResponse(
            Integer codeFournisseur,
            String numero,
            String nom,
            String contact,
            BigDecimal solde
    ) {}
}
