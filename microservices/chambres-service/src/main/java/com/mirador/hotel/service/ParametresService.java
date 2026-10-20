package com.mirador.hotel.service;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ParametresRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ParametresService {

    private final ParametresRepository parametresRepository;

    public ParametresService(ParametresRepository parametresRepository) {
        this.parametresRepository = parametresRepository;
    }

    // ===== ROOM TYPES =====
    public List<ParametresDtos.RoomTypeResponse> listRoomTypes() {
        return parametresRepository.findAllRoomTypes();
    }

    public ParametresDtos.RoomTypeResponse getRoomType(String id) {
        return parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
    }

    public ParametresDtos.RoomTypeResponse createRoomType(ParametresDtos.RoomTypeRequest request) {
        int id = parametresRepository.createRoomType(request);
        return parametresRepository.findRoomTypeById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre cree introuvable."));
    }

    public ParametresDtos.RoomTypeResponse updateRoomType(String id, ParametresDtos.RoomTypeRequest request) {
        parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
        parametresRepository.updateRoomType(id, request);
        return parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre mis a jour introuvable."));
    }

    public void deleteRoomType(String id) {
        parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
        parametresRepository.deleteRoomType(id);
    }

    // ===== ROOMS =====
    public List<ParametresDtos.RoomResponse> listRooms(String status) {
        return parametresRepository.findAllRooms(status);
    }

    public ParametresDtos.RoomResponse getRoom(String id) {
        return parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
    }

    public ParametresDtos.RoomResponse createRoom(ParametresDtos.RoomRequest request) {
        parametresRepository.createRoom(request);
        return parametresRepository.findRoomById(request.number())
                .orElseThrow(() -> new ResourceNotFoundException("Chambre creee introuvable."));
    }

    public ParametresDtos.RoomResponse updateRoom(String id, ParametresDtos.RoomRequest request) {
        parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
        parametresRepository.updateRoom(id, request);
        return parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre mise a jour introuvable."));
    }

    public void deleteRoom(String id) {
        parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
        parametresRepository.deleteRoom(id);
    }
}
