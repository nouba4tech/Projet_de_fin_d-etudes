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

    // ===== PERSONNEL =====
    @GetMapping("/personnel")
    public ResponseEntity<List<ParametresDtos.PersonnelResponse>> listPersonnel(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listPersonnel(status));
    }

    @GetMapping("/personnel/{id}")
    public ResponseEntity<ParametresDtos.PersonnelResponse> getPersonnel(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getPersonnel(id));
    }

    @PostMapping("/personnel")
    public ResponseEntity<ParametresDtos.PersonnelResponse> createPersonnel(
            @Valid @RequestBody ParametresDtos.PersonnelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createPersonnel(request));
    }

    @PutMapping("/personnel/{id}")
    public ResponseEntity<ParametresDtos.PersonnelResponse> updatePersonnel(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.PersonnelRequest request) {
        return ResponseEntity.ok(parametresService.updatePersonnel(id, request));
    }

    @DeleteMapping("/personnel/{id}")
    public ResponseEntity<Void> deletePersonnel(@PathVariable String id) {
        parametresService.deletePersonnel(id);
        return ResponseEntity.noContent().build();
    }

    // ===== CASH REGISTERS =====
    @GetMapping("/cash-registers")
    public ResponseEntity<List<ParametresDtos.CashRegisterResponse>> listCashRegisters(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listCashRegisters(status));
    }

    @GetMapping("/cash-registers/{id}")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> getCashRegister(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getCashRegister(id));
    }

    @PostMapping("/cash-registers")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> createCashRegister(
            @Valid @RequestBody ParametresDtos.CashRegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createCashRegister(request));
    }

    @PutMapping("/cash-registers/{id}")
    public ResponseEntity<ParametresDtos.CashRegisterResponse> updateCashRegister(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.CashRegisterRequest request) {
        return ResponseEntity.ok(parametresService.updateCashRegister(id, request));
    }

    @DeleteMapping("/cash-registers/{id}")
    public ResponseEntity<Void> deleteCashRegister(@PathVariable String id) {
        parametresService.deleteCashRegister(id);
        return ResponseEntity.noContent().build();
    }

    // ===== SUPPLIERS =====
    @GetMapping("/suppliers")
    public ResponseEntity<List<ParametresDtos.SupplierResponse>> listSuppliers(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listSuppliers(status));
    }

    @GetMapping("/suppliers/{id}")
    public ResponseEntity<ParametresDtos.SupplierResponse> getSupplier(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getSupplier(id));
    }

    @PostMapping("/suppliers")
    public ResponseEntity<ParametresDtos.SupplierResponse> createSupplier(
            @Valid @RequestBody ParametresDtos.SupplierRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createSupplier(request));
    }

    @PutMapping("/suppliers/{id}")
    public ResponseEntity<ParametresDtos.SupplierResponse> updateSupplier(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.SupplierRequest request) {
        return ResponseEntity.ok(parametresService.updateSupplier(id, request));
    }

    @DeleteMapping("/suppliers/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable String id) {
        parametresService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }

    // ===== CLIENTS =====
    @GetMapping("/clients")
    public ResponseEntity<List<ParametresDtos.ClientParametreResponse>> listClients(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(parametresService.listClients(status));
    }

    @GetMapping("/clients/{id}")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> getClient(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getClient(id));
    }

    @PostMapping("/clients")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> createClient(
            @Valid @RequestBody ParametresDtos.ClientParametreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createClient(request));
    }

    @PutMapping("/clients/{id}")
    public ResponseEntity<ParametresDtos.ClientParametreResponse> updateClient(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.ClientParametreRequest request) {
        return ResponseEntity.ok(parametresService.updateClient(id, request));
    }

    @DeleteMapping("/clients/{id}")
    public ResponseEntity<Void> deleteClient(@PathVariable String id) {
        parametresService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }

    // ===== SERVICES =====
    @GetMapping("/services")
    public ResponseEntity<List<ParametresDtos.ServiceResponse>> listServices(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(parametresService.listServices(category));
    }

    @GetMapping("/services/{id}")
    public ResponseEntity<ParametresDtos.ServiceResponse> getService(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getService(id));
    }

    @PostMapping("/services")
    public ResponseEntity<ParametresDtos.ServiceResponse> createService(
            @Valid @RequestBody ParametresDtos.ServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createService(request));
    }

    @PutMapping("/services/{id}")
    public ResponseEntity<ParametresDtos.ServiceResponse> updateService(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.ServiceRequest request) {
        return ResponseEntity.ok(parametresService.updateService(id, request));
    }

    @DeleteMapping("/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable String id) {
        parametresService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    // ===== GENERAL PARAMETERS =====
    @GetMapping("/parameters")
    public ResponseEntity<List<ParametresDtos.ParameterResponse>> listParameters(
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(parametresService.listParameters(category));
    }

    @GetMapping("/parameters/{id}")
    public ResponseEntity<ParametresDtos.ParameterResponse> getParameter(@PathVariable String id) {
        return ResponseEntity.ok(parametresService.getParameter(id));
    }

    @PostMapping("/parameters")
    public ResponseEntity<ParametresDtos.ParameterResponse> createParameter(
            @Valid @RequestBody ParametresDtos.ParameterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(parametresService.createParameter(request));
    }

    @PutMapping("/parameters/{id}")
    public ResponseEntity<ParametresDtos.ParameterResponse> updateParameter(
            @PathVariable String id,
            @Valid @RequestBody ParametresDtos.ParameterRequest request) {
        return ResponseEntity.ok(parametresService.updateParameter(id, request));
    }

    @DeleteMapping("/parameters/{id}")
    public ResponseEntity<Void> deleteParameter(@PathVariable String id) {
        parametresService.deleteParameter(id);
        return ResponseEntity.noContent().build();
    }
}
