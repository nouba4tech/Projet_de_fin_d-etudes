package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.service.ReservationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<List<HotelDtos.ReservationResponse>> getReservations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long clientId) {
        if (clientId != null) {
            return ResponseEntity.ok(reservationService.getReservationsByClient(clientId));
        }

        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(reservationService.getReservationsByStatus(status));
        }

        return ResponseEntity.ok(reservationService.getReservations());
    }

    @GetMapping("/{id}")
    public HotelDtos.ReservationResponse getReservationById(@PathVariable long id) {
        return reservationService.getReservation(id);
    }

    @GetMapping("/availability")
    public HotelDtos.AvailabilityResponse checkAvailability(
            @RequestParam String roomId,
            @RequestParam LocalDate checkIn,
            @RequestParam LocalDate checkOut,
            @RequestParam(required = false) Long excludeId) {
        return reservationService.checkAvailability(roomId, checkIn, checkOut, excludeId);
    }

    @PostMapping
    public ResponseEntity<HotelDtos.ReservationResponse> createReservation(
            @Valid @RequestBody HotelDtos.ReservationRequest request) {
        HotelDtos.ReservationResponse reservation = reservationService.createReservation(request);
        return ResponseEntity.created(URI.create("/api/reservations/" + reservation.id())).body(reservation);
    }

    @PutMapping("/{id}")
    public HotelDtos.ReservationResponse updateReservation(
            @PathVariable long id,
            @Valid @RequestBody HotelDtos.ReservationRequest request) {
        return reservationService.updateReservation(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
}
