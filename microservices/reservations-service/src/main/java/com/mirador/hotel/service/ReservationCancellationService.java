package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.InternalReservationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Cancels a reservation: the invoice is cancelled at facturation-service first (refused there when money was
 * already received), then the reservation is marked "Annulée" - which frees the room - and the client is told.
 */
@Service
public class ReservationCancellationService {

    public static final String CANCELLED = "Annulée";

    private final InternalReservationRepository repository;
    private final ReservationService reservationService;
    private final RemoteApi remoteApi;

    public ReservationCancellationService(InternalReservationRepository repository, ReservationService reservationService,
                                          RemoteApi remoteApi) {
        this.repository = repository;
        this.reservationService = reservationService;
        this.remoteApi = remoteApi;
    }

    public HotelDtos.ReservationResponse cancel(long reservationId, String reason) {
        RemoteApi.ReservationInfo reservation = repository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable : " + reservationId));
        String status = reservation.status();
        if (CANCELLED.equals(status) || "Annulee".equals(status) || "Cancelled".equals(status)) {
            throw new ConflictException("La reservation " + reservationId + " est deja annulee.");
        }
        if ("Terminé".equals(status) || (reservation.checkOut() != null && reservation.checkOut().isBefore(LocalDate.now()))) {
            throw new ConflictException("Un sejour termine ne peut pas etre annule.");
        }

        String motif = reason == null || reason.isBlank() ? "sans motif" : reason.trim();
        if (reservation.invoiceCode() != null) {
            remoteApi.cancelInvoice(reservation.invoiceCode(), "Annulation reservation " + reservationId + " : " + motif);
        }
        repository.cancel(reservationId, CANCELLED, "[Annulee le " + LocalDate.now() + " : " + motif + "]");

        HotelDtos.ReservationResponse cancelled = reservationService.getReservation(reservationId);
        notifyClient(cancelled, motif);
        return cancelled;
    }

    private void notifyClient(HotelDtos.ReservationResponse reservation, String motif) {
        remoteApi.client(reservation.clientId()).ifPresent(client -> {
            Map<String, String> variables = new HashMap<>();
            variables.put("name", reservation.clientName());
            variables.put("reservationId", String.valueOf(reservation.id()));
            variables.put("room", reservation.roomId());
            variables.put("checkIn", String.valueOf(reservation.checkIn()));
            variables.put("checkOut", String.valueOf(reservation.checkOut()));
            variables.put("reason", motif);
            String reference = "RES-" + reservation.id() + "-ANNULATION";
            if (client.email() != null) {
                remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                        "EMAIL", client.email(), "RESERVATION_CANCELLATION", reference, null, null, variables));
            }
            if (client.phone() != null) {
                remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                        "SMS", client.phone(), "RESERVATION_CANCELLATION", reference, null, null, variables));
            }
        });
    }
}
