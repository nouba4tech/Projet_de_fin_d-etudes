package com.mirador.hotel.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class ReviewDtos {

    private ReviewDtos() {
    }

    public record ReviewRequest(
            @NotNull(message = "Le client est obligatoire")
            Long clientId,

            Long reservationId,

            @NotNull(message = "La note est obligatoire")
            @Min(value = 1, message = "La note minimale est 1")
            @Max(value = 5, message = "La note maximale est 5")
            Integer rating,

            @Size(max = 150, message = "Le titre est limite a 150 caracteres")
            String title,

            @Size(max = 2000, message = "Le commentaire est limite a 2000 caracteres")
            String comment) {
    }

    public record ModerationRequest(
            @NotBlank(message = "La decision est obligatoire")
            @Pattern(regexp = "APPROUVE|REJETE", message = "La decision doit etre APPROUVE ou REJETE")
            String decision,

            @Size(max = 500, message = "Le commentaire de moderation est limite a 500 caracteres")
            String comment) {
    }

    public record ReviewResponse(
            Long id,
            Long clientId,
            String clientName,
            Long reservationId,
            int rating,
            String title,
            String comment,
            String status,
            boolean flagged,
            String moderationComment,
            String moderatedBy,
            LocalDateTime moderatedAt,
            LocalDateTime createdAt) {
    }

    /** What the public may see: no client identifier, first name only. */
    public record PublicReview(int rating, String title, String comment, String author, LocalDateTime date) {
    }
}
