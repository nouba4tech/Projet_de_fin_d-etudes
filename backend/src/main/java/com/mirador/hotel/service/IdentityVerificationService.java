package com.mirador.hotel.service;

import com.mirador.hotel.dto.IdentityDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.IdentityVerificationRepository;
import com.mirador.hotel.repository.SecurityAuditRepository;
import com.mirador.hotel.util.DocumentCipher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Identity check required before a booking: ID document front and back, plus a live selfie. The images are encrypted
 * before being stored, can only be read by Admin and Reception (each view is audited) and are erased once the
 * retention period is over. The decision is automatic: "VERIFIEE" when the faces match and the liveness test passed
 * (with the client's consent); otherwise an administrator decides.
 */
@Service
public class IdentityVerificationService {

    private static final Logger log = LoggerFactory.getLogger(IdentityVerificationService.class);
    private static final Pattern DATA_URL = Pattern.compile("^data:(image/(?:jpeg|png));base64,(.+)$", Pattern.DOTALL);
    private static final int MAX_IMAGE_BYTES = 2 * 1024 * 1024;
    private static final Set<String> DOCUMENT_TYPES = Set.of("CNI", "PASSEPORT", "PERMIS", "CARTE_SEJOUR");
    /** An unused check (no booking made with it) keeps its images this many days. */
    private static final int UNUSED_RETENTION_DAYS = 7;

    private final IdentityVerificationRepository repository;
    private final SecurityAuditRepository audit;
    private final DocumentCipher cipher;
    private final int retentionDaysAfterStay;

    public IdentityVerificationService(IdentityVerificationRepository repository, SecurityAuditRepository audit,
                                       DocumentCipher cipher,
                                       @Value("${identity.retention-days-after-stay:30}") int retentionDaysAfterStay) {
        this.repository = repository;
        this.audit = audit;
        this.cipher = cipher;
        this.retentionDaysAfterStay = retentionDaysAfterStay;
    }

    public IdentityDtos.VerificationResponse create(IdentityDtos.VerificationRequest request) {
        String actor = currentUser();
        if (!request.consent()) {
            throw new BadRequestException("Le consentement du client est obligatoire pour enregistrer ses documents.");
        }
        String documentType = request.documentType().trim().toUpperCase();
        if (!DOCUMENT_TYPES.contains(documentType)) {
            throw new BadRequestException("Type de piece inconnu : " + request.documentType());
        }
        if (!repository.clientExists(request.clientId())) {
            throw new ResourceNotFoundException("Client introuvable : " + request.clientId());
        }
        byte[] recto = cipher.encrypt(decodeImage(request.recto(), "recto"));
        byte[] verso = cipher.encrypt(decodeImage(request.verso(), "verso"));
        byte[] selfie = cipher.encrypt(decodeImage(request.selfie(), "selfie"));

        boolean faceMatch = request.faceDistance() != null
                && request.faceDistance().compareTo(IdentityVerificationRepository.MATCH_THRESHOLD) <= 0;
        String status = faceMatch && request.livenessPassed()
                ? IdentityVerificationRepository.VERIFIED
                : IdentityVerificationRepository.TO_REVIEW;
        long id = repository.insert(new IdentityDtos.VerificationRequest(request.clientId(), documentType,
                        request.documentNumber(), request.recto(), request.verso(), request.selfie(),
                        request.faceDistance(), request.livenessPassed(), true, true),
                recto, verso, selfie, status, actor, LocalDate.now().plusDays(UNUSED_RETENTION_DAYS));
        audit.record(actor, "IDENTITE_VERIFICATION", "client:" + request.clientId(),
                "verification #" + id + " " + status + ", distance=" + request.faceDistance()
                        + ", vivacite=" + request.livenessPassed() + ", piece=" + documentType
                        + (request.visualCheck() ? ", controle visuel" : ""));
        return get(id);
    }

    public IdentityDtos.VerificationResponse get(long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Verification d'identite introuvable : " + id));
    }

    public List<IdentityDtos.VerificationResponse> list(Long clientId) {
        return clientId == null ? repository.findLatest(100) : repository.findByClient(clientId);
    }

    /** Decrypted image, for Admin and Reception only; every view is written to the audit trail. */
    public byte[] document(long id, String part) {
        if (!Set.of("recto", "verso", "selfie").contains(part)) {
            throw new BadRequestException("Document inconnu : " + part);
        }
        IdentityDtos.VerificationResponse verification = get(id);
        if (verification.purged()) {
            throw new ResourceNotFoundException("Les documents de cette verification ont ete supprimes (duree de conservation depassee).");
        }
        byte[] stored = repository.findDocument(id, part)
                .orElseThrow(() -> new ResourceNotFoundException("Document absent : " + part));
        audit.record(currentUser(), "IDENTITE_CONSULTATION", "verification:" + id, part);
        return cipher.decrypt(stored);
    }

    /** Administrator's decision on a check the automatic test could not settle. */
    public IdentityDtos.VerificationResponse decide(long id, IdentityDtos.DecisionRequest request) {
        String decision = request.decision().trim().toUpperCase();
        if (!decision.equals(IdentityVerificationRepository.VERIFIED) && !decision.equals(IdentityVerificationRepository.REJECTED)) {
            throw new BadRequestException("Decision attendue : VERIFIEE ou REJETEE.");
        }
        IdentityDtos.VerificationResponse verification = get(id);
        if (verification.reservationId() != null) {
            throw new ConflictException("Cette verification a deja servi a la reservation n°" + verification.reservationId() + ".");
        }
        repository.decide(id, decision, currentUser());
        audit.record(currentUser(), "IDENTITE_DECISION", "verification:" + id,
                decision + (request.comment() == null || request.comment().isBlank() ? "" : " : " + request.comment().trim()));
        return get(id);
    }

    /** Called before a booking is created: the check must exist, belong to this client, be verified and not used yet. */
    public void requireUsable(Long verificationId, long clientId) {
        if (verificationId == null) {
            audit.record(currentUser(), "RESERVATION_REFUSEE", "client:" + clientId, "sans verification d'identite");
            throw new BadRequestException("La verification d'identite du client est obligatoire avant la reservation.");
        }
        IdentityDtos.VerificationResponse verification = get(verificationId);
        String refusal = null;
        if (verification.clientId() != clientId) {
            refusal = "Cette verification d'identite concerne un autre client.";
        } else if (!IdentityVerificationRepository.VERIFIED.equals(verification.status())) {
            refusal = IdentityVerificationRepository.REJECTED.equals(verification.status())
                    ? "L'identite du client a ete rejetee : reservation impossible."
                    : "L'identite du client doit d'abord etre validee par un administrateur.";
        } else if (verification.purged()) {
            refusal = "Cette verification a expire : refaites la verification d'identite.";
        } else if (verification.reservationId() != null) {
            refusal = "Cette verification d'identite a deja servi a la reservation n°" + verification.reservationId() + ".";
        }
        if (refusal != null) {
            audit.record(currentUser(), "RESERVATION_REFUSEE", "verification:" + verificationId, refusal);
            throw new BadRequestException(refusal);
        }
    }

    /** Links the check to the booking it allowed; its images are kept until retention-days-after-stay after departure. */
    public void attachToReservation(long verificationId, long clientId, long reservationId, LocalDate checkOut) {
        if (!repository.attachReservation(verificationId, reservationId, checkOut.plusDays(retentionDaysAfterStay))) {
            throw new ConflictException("Cette verification d'identite a deja servi a une autre reservation.");
        }
        audit.record(currentUser(), "RESERVATION_CREEE", "reservation:" + reservationId,
                "client:" + clientId + ", verification #" + verificationId);
    }

    /** Every night: erase the images whose retention period is over. */
    @Scheduled(cron = "${identity.purge-cron:0 30 3 * * *}")
    public void purgeExpiredDocuments() {
        try {
            List<Long> purged = repository.purgeExpired(LocalDate.now());
            if (!purged.isEmpty()) {
                audit.record("system", "IDENTITE_PURGE", null, purged.size() + " verification(s) : " + purged);
                log.info("Documents d'identite purges : {}", purged);
            }
        } catch (RuntimeException e) {
            log.warn("Purge des documents d'identite impossible : {}", e.getMessage());
        }
    }

    private static byte[] decodeImage(String dataUrl, String label) {
        Matcher matcher = DATA_URL.matcher(dataUrl.trim());
        if (!matcher.matches()) {
            throw new BadRequestException("Image " + label + " invalide : JPEG ou PNG attendu.");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(matcher.group(2).replaceAll("\\s", ""));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Image " + label + " illisible.");
        }
        if (bytes.length > MAX_IMAGE_BYTES) {
            throw new BadRequestException("Image " + label + " trop lourde (2 Mo maximum).");
        }
        boolean jpeg = bytes.length > 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8;
        boolean png = bytes.length > 8 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G';
        if (!jpeg && !png) {
            throw new BadRequestException("Image " + label + " invalide : le contenu n'est pas une image JPEG ou PNG.");
        }
        return bytes;
    }

    private static String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? "system" : auth.getName();
    }
}
