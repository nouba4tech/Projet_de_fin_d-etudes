package com.mirador.hotel.service;

import com.mirador.hotel.channel.DeliveryChannel;
import com.mirador.hotel.dto.NotificationDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.model.Templates;
import com.mirador.hotel.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/** Builds, stores and delivers e-mails and SMS. Idempotent per (template, recipient, reference). */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE = Pattern.compile("^\\+?[0-9 .-]{8,18}$");

    /** Result of a send: the stored notification and whether it was created now (false = already sent before). */
    public record Outcome(NotificationDtos.NotificationResponse notification, boolean created) {
    }

    private final NotificationRepository repository;
    private final Map<String, DeliveryChannel> channels = new HashMap<>();

    public NotificationService(NotificationRepository repository, List<DeliveryChannel> deliveryChannels) {
        this.repository = repository;
        deliveryChannels.forEach(c -> channels.put(c.channel(), c));
    }

    public Outcome send(NotificationDtos.SendRequest request) {
        String channel = request.channel().trim().toUpperCase(Locale.ROOT);
        DeliveryChannel delivery = channels.get(channel);
        if (delivery == null) {
            throw new BadRequestException("Canal inconnu : " + request.channel() + " (attendu : EMAIL ou SMS)");
        }
        String recipient = request.recipient().trim();
        if (!("EMAIL".equals(channel) ? EMAIL : PHONE).matcher(recipient).matches()) {
            throw new BadRequestException("Destinataire invalide pour le canal " + channel + " : " + recipient);
        }

        String template = request.templateCode() == null || request.templateCode().isBlank()
                ? null : request.templateCode().trim().toUpperCase(Locale.ROOT);
        String reference = request.referenceKey() == null || request.referenceKey().isBlank() ? null : request.referenceKey().trim();

        String subject = request.subject();
        String body = request.body();
        if (template != null) {
            Templates.Template tpl = Templates.CATALOG.get(template);
            if (tpl == null) {
                throw new BadRequestException("Modele inconnu : " + template + " (disponibles : " + Templates.CATALOG.keySet() + ")");
            }
            if (subject == null) {
                subject = Templates.render(tpl.subject(), request.variables());
            }
            if (body == null) {
                body = Templates.render("EMAIL".equals(channel) ? tpl.email() : tpl.sms(), request.variables());
            }
        }
        if (body == null || body.isBlank()) {
            throw new BadRequestException("Le message est vide : fournir 'body' ou un 'templateCode'.");
        }
        if ("EMAIL".equals(channel) && (subject == null || subject.isBlank())) {
            throw new BadRequestException("Un e-mail doit avoir un objet.");
        }

        if (template != null && reference != null) {
            var existing = repository.findByKey(template, recipient, reference);
            if (existing.isPresent()) {
                return new Outcome(existing.get(), false);
            }
        }

        long id;
        try {
            id = repository.insertPending(channel, recipient, template, reference, subject, body);
        } catch (DuplicateKeyException race) {
            return new Outcome(repository.findByKey(template, recipient, reference).orElseThrow(), false);
        }
        deliver(id, delivery, recipient, subject, body);
        return new Outcome(get(id), true);
    }

    public NotificationDtos.NotificationResponse retry(long id) {
        NotificationDtos.NotificationResponse n = get(id);
        if (!"FAILED".equals(n.status())) {
            throw new ConflictException("Seule une notification en echec peut etre renvoyee (statut : " + n.status() + ").");
        }
        deliver(id, channels.get(n.channel()), n.recipient(), n.subject(), n.body());
        return get(id);
    }

    public NotificationDtos.NotificationResponse get(long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Notification introuvable : " + id));
    }

    public List<NotificationDtos.NotificationResponse> list(String status, String channel, int limit) {
        return repository.findAll(status, channel, limit);
    }

    private void deliver(long id, DeliveryChannel delivery, String recipient, String subject, String body) {
        try {
            delivery.deliver(recipient, subject, body);
            repository.markSent(id);
        } catch (Exception ex) {
            log.warn("echec d'envoi de la notification {} : {}", id, ex.getMessage());
            repository.markFailed(id, ex.getMessage());
        }
    }
}
