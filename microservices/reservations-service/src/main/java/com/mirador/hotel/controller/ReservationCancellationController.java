package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.service.ReservationCancellationService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Cancelling is not deleting: the reservation stays in the history, its invoice is cancelled and the room is freed. */
@RestController
@RequestMapping("/api/reservations")
public class ReservationCancellationController {

    public record CancellationRequest(String reason) {
    }

    private final ReservationCancellationService cancellationService;

    public ReservationCancellationController(ReservationCancellationService cancellationService) {
        this.cancellationService = cancellationService;
    }

    @PostMapping("/{id}/annulation")
    public HotelDtos.ReservationResponse cancel(@PathVariable long id,
                                                @RequestBody(required = false) CancellationRequest request) {
        return cancellationService.cancel(id, request == null ? null : request.reason());
    }
}
