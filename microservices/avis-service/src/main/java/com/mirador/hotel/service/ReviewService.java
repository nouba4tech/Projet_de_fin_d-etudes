package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.ReviewDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.RemoteServiceException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.model.ReviewRules;
import com.mirador.hotel.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Collection and moderation of guest reviews. */
@Service
public class ReviewService {

    private final ReviewRepository repository;
    private final RemoteApi remoteApi;
    private final List<String> bannedWords;

    public ReviewService(ReviewRepository repository, RemoteApi remoteApi,
                         @Value("${avis.banned-words:arnaque,escroc,escroquerie,merde,connard,salaud}") String banned) {
        this.repository = repository;
        this.remoteApi = remoteApi;
        this.bannedWords = Arrays.stream(banned.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    /** Collect a review. It starts "EN_ATTENTE" (and flagged when the text contains banned words). */
    public ReviewDtos.ReviewResponse submit(ReviewDtos.ReviewRequest request) {
        RemoteApi.ClientInfo client = remoteApi.client(request.clientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable : " + request.clientId()));

        if (request.reservationId() != null) {
            RemoteApi.ReservationInfo reservation = remoteApi.reservation(request.reservationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reservation introuvable : " + request.reservationId()));
            if (reservation.clientId() != request.clientId()) {
                throw new BadRequestException("Cette reservation n'appartient pas a ce client.");
            }
            boolean stayOver = "Terminé".equals(reservation.status())
                    || (reservation.checkOut() != null && !reservation.checkOut().isAfter(LocalDate.now())
                    && !"Annulée".equals(reservation.status()));
            if (!stayOver) {
                throw new BadRequestException("Seul un sejour termine peut etre evalue.");
            }
            if (repository.existsForReservation(request.reservationId())) {
                throw new ConflictException("Un avis existe deja pour cette reservation.");
            }
        }

        boolean flagged = ReviewRules.isFlagged(request.title(), bannedWords)
                || ReviewRules.isFlagged(request.comment(), bannedWords);
        long id = repository.insert(request, flagged);
        ReviewDtos.ReviewResponse saved = repository.findById(id).orElseThrow();
        return withName(saved, client.name());
    }

    public List<ReviewDtos.ReviewResponse> list(String status) {
        List<ReviewDtos.ReviewResponse> reviews = repository.findAll(status);
        Map<Long, RemoteApi.ClientInfo> clients = lookup(reviews);
        return reviews.stream().map(r -> withName(r, nameOf(clients, r.clientId()))).toList();
    }

    public ReviewDtos.ReviewResponse get(long id) {
        ReviewDtos.ReviewResponse review = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable : " + id));
        return withName(review, nameOf(lookup(List.of(review)), review.clientId()));
    }

    public ReviewDtos.ReviewResponse moderate(long id, ReviewDtos.ModerationRequest request) {
        get(id);
        if (!repository.moderate(id, request.decision(), request.comment(), currentUser())) {
            throw new ConflictException("Cet avis a deja ete modere.");
        }
        return get(id);
    }

    public void delete(long id) {
        if (repository.delete(id) == 0) {
            throw new ResourceNotFoundException("Avis introuvable : " + id);
        }
    }

    public List<ReviewDtos.PublicReview> publicReviews(int limit) {
        List<ReviewDtos.ReviewResponse> approved = repository.approved(Math.max(1, Math.min(limit, 100)));
        Map<Long, RemoteApi.ClientInfo> clients = lookup(approved);
        return approved.stream().map(r -> new ReviewDtos.PublicReview(r.rating(), r.title(), r.comment(),
                firstName(nameOf(clients, r.clientId())), r.createdAt())).toList();
    }

    public ReviewRules.Summary summary() {
        return ReviewRules.summarize(repository.approvedRatings());
    }

    // ------------------------------------------------------------------ helpers
    private Map<Long, RemoteApi.ClientInfo> lookup(List<ReviewDtos.ReviewResponse> reviews) {
        Set<Long> ids = new HashSet<>();
        reviews.forEach(r -> ids.add(r.clientId()));
        try {
            return remoteApi.clients(ids);
        } catch (RemoteServiceException ex) {
            return new HashMap<>();
        }
    }

    private static String nameOf(Map<Long, RemoteApi.ClientInfo> clients, Long id) {
        RemoteApi.ClientInfo info = clients.get(id);
        return info == null ? null : info.name();
    }

    private static String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "Client";
        }
        return fullName.trim().split("\\s+")[0];
    }

    private static ReviewDtos.ReviewResponse withName(ReviewDtos.ReviewResponse r, String name) {
        return new ReviewDtos.ReviewResponse(r.id(), r.clientId(), name, r.reservationId(), r.rating(), r.title(),
                r.comment(), r.status(), r.flagged(), r.moderationComment(), r.moderatedBy(), r.moderatedAt(), r.createdAt());
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "system" : auth.getName();
    }
}
