package com.mirador.hotel.controller;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.service.ParametresService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parametres")
public class ParametresController {

    private final ParametresService parametresService;

    public ParametresController(ParametresService parametresService) {
        this.parametresService = parametresService;
    }

    // ===== ROOM TYPES =====
    @GetMapping("/room-types")
    public ResponseEntity<List<ParametresDtos.RoomTypeResponse>> listRoomTypes() {
        return ResponseEntity.ok(parametresService.listRoomTypes());
    }

    @GetMapping("/room-types/{id}")
    public ResponseEntity<ParametresDtos.RoomTypeResponse> getRoomType(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getRoomType(id));
    }

    @PostMapping("/room-types")
    public ResponseEntity<ParametresDtos.RoomTypeResponse> createRoomType(
            @Valid @RequestBody ParametresDtos.RoomTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createRoomType(request));
    }

    @PutMapping("/room-types/{id}")
    public ResponseEntity<ParametresDtos.RoomTypeResponse> updateRoomType(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.RoomTypeRequest request) {
        return ResponseEntity.ok(parametresService.updateRoomType(id, request));
    }

    @DeleteMapping("/room-types/{id}")
    public ResponseEntity<Void> deleteRoomType(@PathVariable String id) {
        parametresService.deleteRoomType(id);
        return ResponseEntity.noContent().build();
    }

    // ===== ROOMS =====
    @GetMapping("/rooms")
    public ResponseEntity<List<ParametresDtos.RoomResponse>> listRooms(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listRooms(status));
    }

    @GetMapping("/rooms/{id}")
    public ResponseEntity<ParametresDtos.RoomResponse> getRoom(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getRoom(id));
    }

    @PostMapping("/rooms")
    public ResponseEntity<ParametresDtos.RoomResponse> createRoom(
            @Valid @RequestBody ParametresDtos.RoomRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createRoom(request));
    }

    @PutMapping("/rooms/{id}")
    public ResponseEntity<ParametresDtos.RoomResponse> updateRoom(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.RoomRequest request) {
        return ResponseEntity.ok(parametresService.updateRoom(id, request));
    }

    @DeleteMapping("/rooms/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String id) {
        parametresService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
