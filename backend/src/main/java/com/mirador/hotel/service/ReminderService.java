package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.NotificationDtos;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** "Arrival tomorrow" reminders; safe to run several times (the notifications are idempotent). */
@Service
public class ReminderService {

    private final RemoteApi remoteApi;
    private final NotificationService notificationService;

    public ReminderService(RemoteApi remoteApi, NotificationService notificationService) {
        this.remoteApi = remoteApi;
        this.notificationService = notificationService;
    }

    public NotificationDtos.ReminderResult sendArrivalReminders(LocalDate arrivalDate) {
        List<RemoteApi.ReservationInfo> arrivals = remoteApi.arrivals(arrivalDate);
        Set<Long> clientIds = arrivals.stream().map(RemoteApi.ReservationInfo::clientId).collect(Collectors.toSet());
        Map<Long, RemoteApi.ClientInfo> clients = new HashMap<>(remoteApi.clients(clientIds));

        int sent = 0;
        int already = 0;
        int failed = 0;
        for (RemoteApi.ReservationInfo reservation : arrivals) {
            RemoteApi.ClientInfo client = clients.get(reservation.clientId());
            if (client == null) {
                continue;
            }
            Map<String, String> variables = Map.of(
                    "name", client.name() == null ? "" : client.name(),
                    "reservationId", String.valueOf(reservation.id()),
                    "room", reservation.roomId(),
                    "checkIn", String.valueOf(reservation.checkIn()));
            String reference = "RES-" + reservation.id() + "-" + arrivalDate;
            for (String[] target : new String[][] {{"EMAIL", client.email()}, {"SMS", client.phone()}}) {
                if (target[1] == null) {
                    continue;
                }
                try {
                    NotificationService.Outcome outcome = notificationService.send(new NotificationDtos.SendRequest(
                            target[0], target[1], "ARRIVAL_REMINDER", reference, null, null, variables));
                    if (!outcome.created()) {
                        already++;
                    } else if ("SENT".equals(outcome.notification().status())) {
                        sent++;
                    } else {
                        failed++;
                    }
                } catch (RuntimeException invalidRecipient) {
                    failed++;
                }
            }
        }
        return new NotificationDtos.ReminderResult(arrivalDate, arrivals.size(), sent, already, failed);
    }
}
