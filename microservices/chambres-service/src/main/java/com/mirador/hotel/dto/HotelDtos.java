package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public final class HotelDtos {

    private HotelDtos() {
    }

    public record DashboardSummaryResponse(
            double occupancyRate,
            BigDecimal revenueToday,
            long pendingCheckins,
            long roomsCleaning,
            long totalRooms,
            long occupiedRooms,
            long activeClients,
            long activeReservations) {
    }

    public record RoomRequest(
            @NotBlank(message = "Le code chambre est obligatoire")
            String code,

            String typeLabel,

            @PositiveOrZero(message = "Le prix doit etre positif ou nul")
            BigDecimal nightlyRate,

            String status,

            String cleaningStatus,

            String description,

            @Positive(message = "La capacite doit etre strictement positive")
            Integer capacity) {
    }

    public record RoomResponse(
            String id,
            String number,
            String type,
            BigDecimal price,
            String status,
            String cleaningStatus,
            String description,
            Integer capacity) {
    }

    public record ClientRequest(
            String firstName,
            String lastName,
            String email,
            String phone,
            String idDocument,
            String address,
            String clientType,
            String companyName,
            String status) {
    }

    public record ClientResponse(
            Long id,
            String firstName,
            String lastName,
            String fullName,
            String email,
            String phone,
            String idDocument,
            String address,
            String clientType,
            String companyName,
            BigDecimal balance,
            long totalStays,
            LocalDate lastStay,
            OffsetDateTime createdAt,
            String status) {
    }

    public record ReservationRequest(
            @NotNull(message = "Le client est obligatoire")
            Long clientId,

            @NotBlank(message = "La chambre est obligatoire")
            String roomId,

            @NotNull(message = "La date d'arrivee est obligatoire")
            LocalDate checkIn,

            @NotNull(message = "La date de depart est obligatoire")
            LocalDate checkOut,

            String status,

            @PositiveOrZero(message = "Le montant doit etre positif ou nul")
            BigDecimal totalAmount,

            @NotBlank(message = "Le prenom de l'occupant est obligatoire")
            String occupantFirstName,

            @NotBlank(message = "Le nom de l'occupant est obligatoire")
            String occupantLastName,

            String occupantIdDocument,

            String occupantPhone,

            String occupantAddress,

            String observation) {
    }

    public record ReservationResponse(
            Long id,
            Long clientId,
            String roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            String status,
            BigDecimal totalAmount,
            OffsetDateTime createdAt,
            String clientType,
            String companyName,
            String occupantFirstName,
            String occupantLastName,
            String occupantIdDocument,
            String occupantPhone,
            String roomType,
            String clientName) {
    }

    public record AvailabilityResponse(
            String roomId,
            LocalDate checkIn,
            LocalDate checkOut,
            boolean available) {
    }

    public record RevenueChartPoint(
            String dayLabel,
            String dateIso,
            java.math.BigDecimal revenue,
            double occupancyRate) {
    }

    public record RevenueChartResponse(
            java.util.List<RevenueChartPoint> points) {
    }
}
