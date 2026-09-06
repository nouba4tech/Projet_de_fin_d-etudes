package com.mirador.hotel.service;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ReservationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;

    public ReservationService(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
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
        return getReservation(reservationId);
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
