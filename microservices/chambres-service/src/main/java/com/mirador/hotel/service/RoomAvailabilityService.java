package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** Rooms that can be booked over a period: not reserved on it (reservations-service) and not in maintenance. */
@Service
public class RoomAvailabilityService {

    private final RoomRepository roomRepository;
    private final RemoteApi remoteApi;

    public RoomAvailabilityService(RoomRepository roomRepository, RemoteApi remoteApi) {
        this.roomRepository = roomRepository;
        this.remoteApi = remoteApi;
    }

    public List<HotelDtos.RoomResponse> availableRooms(LocalDate from, LocalDate to, Integer minCapacity) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw new BadRequestException("La date de fin doit etre posterieure a la date de debut.");
        }
        Set<String> taken = remoteApi.occupiedRoomsBetween(from, to);
        return roomRepository.findAll().stream()
                .filter(room -> !taken.contains(room.number()))
                .filter(room -> !"Maintenance".equalsIgnoreCase(room.status()))
                .filter(room -> minCapacity == null || (room.capacity() != null && room.capacity() >= minCapacity))
                .toList();
    }
}
