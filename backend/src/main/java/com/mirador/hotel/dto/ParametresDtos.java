package com.mirador.hotel.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public final class ParametresDtos {

    private ParametresDtos() {
    }

    // === ROOM TYPES ===
    public record RoomTypeRequest(
            @NotBlank(message = "Le code est obligatoire")
            String code,

            @NotBlank(message = "Le nom est obligatoire")
            String name,

            String description,

            @Positive(message = "La capacité doit être positive")
            Integer capacity,

            @PositiveOrZero(message = "Le prix doit être positif ou zéro")
            BigDecimal basePrice,

            String amenities,

            String status) {
    }

    public record RoomTypeResponse(
            String id,
            String code,
            String name,
            String description,
            Integer capacity,
            BigDecimal basePrice,
            java.util.List<String> amenities,
            String status,
            Integer floor,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === ROOMS ===
    public record RoomRequest(
            @NotBlank(message = "Le numéro de chambre est obligatoire")
            String number,

            @NotBlank(message = "Le type de chambre est obligatoire")
            String roomTypeId,

            @Positive(message = "L'étage doit être positif")
            Integer floor,

            String status,

            String cleaningStatus,

            String notes) {
    }

    public record RoomResponse(
            String id,
            String number,
            String roomTypeId,
            String roomTypeName,
            Integer floor,
            String status,
            String cleaningStatus,
            String notes,
            LocalDate lastCleaned,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === PERSONNEL / EMPLOYEES ===
    public record PersonnelRequest(
            @NotBlank(message = "Le numéro d'employé est obligatoire")
            String employeeNumber,

            @NotBlank(message = "Le prénom est obligatoire")
            String firstName,

            @NotBlank(message = "Le nom est obligatoire")
            String lastName,

            @Email(message = "L'email doit être valide")
            String email,

            String phone,

            @NotBlank(message = "Le poste est obligatoire")
            String position,

            String department,

            LocalDate hireDate,

            @PositiveOrZero(message = "Le salaire doit être positif ou zéro")
            BigDecimal salary,

            String status) {
    }

    public record PersonnelResponse(
            String id,
            String employeeNumber,
            String firstName,
            String lastName,
            String email,
            String phone,
            String position,
            String department,
            LocalDate hireDate,
            BigDecimal salary,
            String status,
            java.util.List<String> permissions,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === CASH REGISTERS ===
    public record CashRegisterRequest(
            @NotBlank(message = "Le code est obligatoire")
            String code,

            @NotBlank(message = "Le nom est obligatoire")
            String name,

            String location,

            @PositiveOrZero(message = "Le solde d'ouverture doit être positif ou zéro")
            BigDecimal openingBalance,

            String currency,

            String status,

            String responsiblePerson) {
    }

    public record CashRegisterResponse(
            String id,
            String code,
            String name,
            String location,
            BigDecimal openingBalance,
            BigDecimal currentBalance,
            String currency,
            String status,
            String responsiblePerson,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === SUPPLIERS ===
    public record SupplierRequest(
            @NotBlank(message = "Le code est obligatoire")
            String code,

            @NotBlank(message = "Le nom est obligatoire")
            String name,

            String contactPerson,

            @Email(message = "L'email doit être valide")
            String email,

            String phone,

            String address,

            String category,

            String paymentTerms,

            String taxId,

            String status) {
    }

    public record SupplierResponse(
            String id,
            String code,
            String name,
            String contactPerson,
            String email,
            String phone,
            String address,
            String category,
            String paymentTerms,
            String taxId,
            Double rating,
            String status,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === CLIENTS ===
    public record ClientParametreRequest(
            @NotBlank(message = "Le code est obligatoire")
            String code,

            @NotBlank(message = "Le prénom est obligatoire")
            String firstName,

            @NotBlank(message = "Le nom est obligatoire")
            String lastName,

            @Email(message = "L'email doit être valide")
            String email,

            String phone,

            String address,

            String idNumber,

            String idType,

            String nationality,

            LocalDate dateOfBirth,

            Boolean vipStatus,

            String status) {
    }

    public record ClientParametreResponse(
            String id,
            String code,
            String firstName,
            String lastName,
            String email,
            String phone,
            String address,
            String idNumber,
            String idType,
            String nationality,
            LocalDate dateOfBirth,
            Boolean vipStatus,
            String status,
            java.util.List<String> preferences,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === SERVICES ===
    public record ServiceRequest(
            @NotBlank(message = "Le code est obligatoire")
            String code,

            @NotBlank(message = "Le nom est obligatoire")
            String name,

            String description,

            String category,

            @PositiveOrZero(message = "Le prix doit être positif ou zéro")
            BigDecimal price,

            String unit,

            String status) {
    }

    public record ServiceResponse(
            String id,
            String code,
            String name,
            String description,
            String category,
            BigDecimal price,
            String unit,
            String status,
            OffsetDateTime createdAt,
            String createdBy) {
    }

    // === GENERAL PARAMETERS ===
    public record ParameterRequest(
            @NotBlank(message = "La raison sociale est obligatoire")
            String raisonSociale,

            String activite,

            String contact,

            String ville,

            String niu,

            String status) {
    }

    public record ParameterResponse(
            String id,
            String raisonSociale,
            String activite,
            String contact,
            String ville,
            String niu,
            String status,
            OffsetDateTime updatedAt,
            String updatedBy) {
    }

    // === GROUPS ===
    public record GroupRequest(
            @NotBlank(message = "Le nom du groupe est obligatoire")
            String name,

            String description,

            java.util.List<String> rights) {
    }

    public record GroupResponse(
            Integer id,
            String name,
            String description,
            java.util.List<String> rights,
            Integer memberCount) {
    }

    // === PRIVILEGES ===
    public record PrivilegeRequest(
            String module,

            @NotBlank(message = "Le code de privilège est obligatoire")
            String code,

            String level,

            Boolean visible) {
    }

    public record PrivilegeResponse(
            String id,
            String module,
            String code,
            String level,
            Boolean visible) {
    }

    // === BACKUP ===
    public record BackupResponse(
            String id,
            String label,
            OffsetDateTime createdAt,
            String status,
            Long sizeInBytes,
            String fileName) {
    }

    public record BackupRequest(
            String label) {
    }
}
