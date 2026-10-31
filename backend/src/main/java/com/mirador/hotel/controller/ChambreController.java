package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.repository.ReservationRepository;
import com.mirador.hotel.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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
import java.util.Set;

@RestController
@RequestMapping("/api/chambres")
public class ChambreController {

    private final RoomService roomService;
    private final ReservationRepository reservationRepository;

    public ChambreController(RoomService roomService, ReservationRepository reservationRepository) {
        this.roomService = roomService;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping
    public List<HotelDtos.RoomResponse> getAllChambres() {
        return roomService.getRooms();
    }

    /** {@code /api/chambres/disponibles?from=2026-11-02&to=2026-11-05&capacite=2}: not booked on the period, not in maintenance. */
    @GetMapping("/disponibles")
    public List<HotelDtos.RoomResponse> getChambresDisponibles(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(name = "capacite", required = false) Integer capacity) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new BadRequestException("La date de fin doit etre posterieure a la date de debut.");
        }
        Set<String> taken = reservationRepository.occupiedRoomsBetween(from, to);
        return roomService.getRooms().stream()
                .filter(room -> !taken.contains(room.id()))
                .filter(room -> !"Maintenance".equalsIgnoreCase(room.status()))
                .filter(room -> capacity == null || (room.capacity() != null && room.capacity() >= capacity))
                .toList();
    }

    @GetMapping("/{codeChambre}")
    public HotelDtos.RoomResponse getChambreById(@PathVariable String codeChambre) {
        return roomService.getRoom(codeChambre);
    }

    @PostMapping
    public ResponseEntity<HotelDtos.RoomResponse> createChambre(@Valid @RequestBody HotelDtos.RoomRequest request) {
        HotelDtos.RoomResponse room = roomService.createRoom(request);
        return ResponseEntity.created(URI.create("/api/chambres/" + room.id())).body(room);
    }

    @PutMapping("/{codeChambre}")
    public HotelDtos.RoomResponse updateChambre(
            @PathVariable String codeChambre,
            @Valid @RequestBody HotelDtos.RoomRequest request) {
        return roomService.updateRoom(codeChambre, request);
    }

    @DeleteMapping("/{codeChambre}")
    public ResponseEntity<Void> deleteChambre(@PathVariable String codeChambre) {
        roomService.deleteRoom(codeChambre);
        return ResponseEntity.noContent().build();
    }
}
