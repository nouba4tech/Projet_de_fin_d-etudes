package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RemoteApi remoteApi;

    public ReservationService(ReservationRepository reservationRepository, RemoteApi remoteApi) {
        this.reservationRepository = reservationRepository;
        this.remoteApi = remoteApi;
    }

    @Transactional(readOnly = true)
    public List<HotelDtos.ReservationResponse> getReservations() {
        return reservationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public HotelDtos.ReservationResponse getReservation(long reservationId) {
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable: " + reservationId));
    }

    @Transactional(readOnly = true)
    public List<HotelDtos.ReservationResponse> getReservationsByStatus(String status) {
        return reservationRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public List<HotelDtos.ReservationResponse> getReservationsByClient(long clientId) {
        return reservationRepository.findByClient(clientId);
    }

    @Transactional(readOnly = true)
    public HotelDtos.AvailabilityResponse checkAvailability(String roomId, LocalDate checkIn, LocalDate checkOut, Long excludeId) {
        return new HotelDtos.AvailabilityResponse(
                roomId,
                checkIn,
                checkOut,
                reservationRepository.isRoomAvailable(roomId, checkIn, checkOut, excludeId));
    }

    public HotelDtos.ReservationResponse createReservation(HotelDtos.ReservationRequest request) {
        validateDates(request.checkIn(), request.checkOut());

        if (!reservationRepository.isRoomAvailable(request.roomId(), request.checkIn(), request.checkOut(), null)) {
            throw new IllegalStateException("La chambre " + request.roomId() + " n'est pas disponible sur cette periode.");
        }

        long reservationId = reservationRepository.create(request);
        HotelDtos.ReservationResponse created = getReservation(reservationId);
        notifyConfirmation(created);
        return created;
    }

    /** Best effort: tells notifications-service to send the booking confirmation (e-mail and/or SMS). */
    private void notifyConfirmation(HotelDtos.ReservationResponse reservation) {
        remoteApi.client(reservation.clientId()).ifPresent(client -> {
            Map<String, String> variables = Map.of(
                    "name", reservation.clientName(),
                    "reservationId", String.valueOf(reservation.id()),
                    "room", reservation.roomId(),
                    "checkIn", String.valueOf(reservation.checkIn()),
                    "checkOut", String.valueOf(reservation.checkOut()),
                    "amount", String.valueOf(reservation.totalAmount()));
            String reference = "RES-" + reservation.id();
            if (client.email() != null) {
                remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                        "EMAIL", client.email(), "RESERVATION_CONFIRMATION", reference, null, null, variables));
            }
            if (client.phone() != null) {
                remoteApi.notifyQuietly(new RemoteApi.NotificationCommand(
                        "SMS", client.phone(), "RESERVATION_CONFIRMATION", reference, null, null, variables));
            }
        });
    }

    public HotelDtos.ReservationResponse updateReservation(long reservationId, HotelDtos.ReservationRequest request) {
        getReservation(reservationId);
        validateDates(request.checkIn(), request.checkOut());

        if (!reservationRepository.isRoomAvailable(request.roomId(), request.checkIn(), request.checkOut(), reservationId)) {
            throw new IllegalStateException("La chambre " + request.roomId() + " n'est pas disponible sur cette periode.");
        }

        reservationRepository.update(reservationId, request);
        return getReservation(reservationId);
    }

    public void deleteReservation(long reservationId) {
        getReservation(reservationId);
        reservationRepository.delete(reservationId);
    }

    private void validateDates(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new IllegalArgumentException("Les dates de reservation sont obligatoires.");
        }

        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("La date de depart doit etre posterieure a la date d'arrivee.");
        }
    }
}
