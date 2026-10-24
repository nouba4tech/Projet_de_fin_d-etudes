package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.ClientInsightDtos;
import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.model.LoyaltyRules;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Stay history and loyalty status of a client, computed from reservations-service. */
@Service
public class ClientInsightService {

    private final ClientService clientService;
    private final RemoteApi remoteApi;

    public ClientInsightService(ClientService clientService, RemoteApi remoteApi) {
        this.clientService = clientService;
        this.remoteApi = remoteApi;
    }

    public ClientInsightDtos.History history(long clientId) {
        HotelDtos.ClientResponse client = clientService.getClient(clientId);
        List<RemoteApi.ReservationInfo> reservations = remoteApi.reservationsOfClient(clientId);
        LocalDate today = LocalDate.now();
        List<ClientInsightDtos.Stay> stays = reservations.stream()
                .map(r -> new ClientInsightDtos.Stay(r.id(), r.roomId(), r.checkIn(), r.checkOut(), r.status(),
                        r.totalAmount(), r.invoiceCode(), LoyaltyRules.isCompleted(r, today)))
                .toList();
        LoyaltyRules.Status status = LoyaltyRules.evaluate(reservations, today);
        int cancelled = (int) reservations.stream().filter(r -> LoyaltyRules.isCancelled(r.status())).count();
        return new ClientInsightDtos.History(clientId, client.fullName(), reservations.size(), status.completedStays(),
                cancelled, status.totalSpent(), stays);
    }

    public ClientInsightDtos.Loyalty loyalty(long clientId) {
        HotelDtos.ClientResponse client = clientService.getClient(clientId);
        LoyaltyRules.Status s = LoyaltyRules.evaluate(remoteApi.reservationsOfClient(clientId), LocalDate.now());
        return new ClientInsightDtos.Loyalty(clientId, client.fullName(), s.points(), s.tier().name(), s.tier().benefits,
                s.nextTier() == null ? null : s.nextTier().name(), s.pointsToNextTier(),
                s.totalSpent() == null ? BigDecimal.ZERO : s.totalSpent(), s.completedStays());
    }
}
