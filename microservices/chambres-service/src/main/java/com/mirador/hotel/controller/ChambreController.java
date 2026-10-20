package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.service.RoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/chambres")
public class ChambreController {

    private final RoomService roomService;

    public ChambreController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<HotelDtos.RoomResponse> getAllChambres() {
        return roomService.getRooms();
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
