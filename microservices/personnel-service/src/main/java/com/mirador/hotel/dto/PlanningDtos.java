package com.mirador.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public final class PlanningDtos {

    private PlanningDtos() {
    }

    public record ShiftRequest(
            @NotNull(message = "La date est obligatoire")
            LocalDate date,

            @NotNull(message = "L'heure de debut est obligatoire")
            LocalTime startTime,

            @NotNull(message = "L'heure de fin est obligatoire")
            LocalTime endTime,

            @NotBlank(message = "Le poste est obligatoire")
            String post,

            String notes) {
    }

    public record ShiftResponse(
            Long id,
            Long employeeId,
            String employeeName,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            double hours,
            String post,
            String notes) {
    }
}
