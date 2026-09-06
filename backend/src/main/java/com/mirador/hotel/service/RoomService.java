package com.mirador.hotel.service;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.logging.Logger;

@Service
@Transactional
public class RoomService {

    private static final Logger LOGGER = Logger.getLogger(RoomService.class.getName());
    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<HotelDtos.RoomResponse> getRooms() {
        return roomRepository.findAll();
    }

    @Transactional(readOnly = true)
    public HotelDtos.RoomResponse getRoom(String codeChambre) {
        return roomRepository.findByCode(codeChambre)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable: " + codeChambre));
    }

    public HotelDtos.RoomResponse createRoom(HotelDtos.RoomRequest request) {
        if (request.code() == null || request.code().trim().isEmpty()) {
            throw new IllegalArgumentException("Le code chambre ne peut pas être vide");
        }

        if (roomRepository.exists(request.code())) {
            throw new IllegalStateException("La chambre " + request.code() + " existe déjà.");
        }

        try {
            LOGGER.info("Création de chambre: " + request.code());
            roomRepository.create(request);
            LOGGER.info("Chambre créée avec succès: " + request.code());
            return getRoom(request.code());
        } catch (Exception e) {
            LOGGER.severe("Erreur lors de la création de la chambre " + request.code() + ": " + e.getMessage());
            throw new RuntimeException("Impossible de créer la chambre: " + e.getMessage(), e);
        }
    }

    public HotelDtos.RoomResponse updateRoom(String codeChambre, HotelDtos.RoomRequest request) {
        getRoom(codeChambre);
        try {
            roomRepository.update(codeChambre, request);
            return getRoom(codeChambre);
        } catch (Exception e) {
            LOGGER.severe("Erreur lors de la mise à jour de la chambre " + codeChambre + ": " + e.getMessage());
            throw new RuntimeException("Impossible de mettre à jour la chambre: " + e.getMessage(), e);
        }
    }

    public void deleteRoom(String codeChambre) {
        getRoom(codeChambre);
        try {
            roomRepository.delete(codeChambre);
        } catch (Exception e) {
            LOGGER.severe("Erreur lors de la suppression de la chambre " + codeChambre + ": " + e.getMessage());
            throw new RuntimeException("Impossible de supprimer la chambre: " + e.getMessage(), e);
        }
    }
}
