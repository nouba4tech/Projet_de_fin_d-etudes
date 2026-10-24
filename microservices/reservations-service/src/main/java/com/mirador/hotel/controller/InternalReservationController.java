package com.mirador.hotel.controller;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.InternalReservationRepository;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Service-to-service API (not routed by the gateway, guarded by X-Internal-Token). */
@RestController
@RequestMapping("/internal/reservations")
public class InternalReservationController {

    public record StatusRequest(String status) {
    }

    private final InternalReservationRepository repository;

    public InternalReservationController(InternalReservationRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/occupied-rooms")
    public List<String> occupiedRooms() {
        return repository.occupiedRoomsOn(LocalDate.now());
    }

    @GetMapping("/count-by-room/{code}")
    public long countByRoom(@PathVariable String code) {
        return repository.countByRoom(code);
    }

    @GetMapping("/count-by-client/{id}")
    public long countByClient(@PathVariable long id) {
        return repository.countByClient(id);
    }

    @GetMapping("/client-stats")
    public Map<String, RemoteApi.ClientStat> clientStats() {
        return repository.clientStats();
    }

    @GetMapping("/stats/today")
    public RemoteApi.ReservationStats statsToday() {
        return repository.statsToday();
    }

    @GetMapping("/stats/occupancy")
    public Map<String, Long> occupancy(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                       @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return repository.occupancy(from, to);
    }

    @GetMapping("/occupied-rooms-between")
    public List<String> occupiedRoomsBetween(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return repository.occupiedRoomsBetween(from, to);
    }

    @GetMapping("/by-client/{clientId}")
    public List<RemoteApi.ReservationInfo> byClient(@PathVariable long clientId) {
        return repository.byClient(clientId);
    }

    @GetMapping("/arrivals")
    public List<RemoteApi.ReservationInfo> arrivals(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return repository.arrivals(date);
    }

    @GetMapping("/by-invoice/{code}")
    public RemoteApi.ReservationInfo byInvoice(@PathVariable String code) {
        return repository.findByInvoice(code)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune reservation pour la facture " + code));
    }

    @PostMapping("/by-invoice/{code}/status")
    public Map<String, String> updateStatus(@PathVariable String code, @RequestBody StatusRequest request) {
        String previous = repository.updateStatusByInvoice(code, request.status())
                .orElseThrow(() -> new ResourceNotFoundException("Aucune reservation pour la facture " + code));
        return Map.of("previousStatus", previous);
    }

    @GetMapping("/{id}")
    public RemoteApi.ReservationInfo reservation(@PathVariable long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable : " + id));
    }
}
