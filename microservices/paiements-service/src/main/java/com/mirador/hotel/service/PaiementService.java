package com.mirador.hotel.service;

import com.mirador.hotel.dto.PaymentDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.PaiementRepository;
import com.mirador.hotel.saga.FailingStep;
import com.mirador.hotel.saga.PaymentContext;
import com.mirador.hotel.saga.PaymentSagaSteps;
import com.mirador.hotel.saga.SagaOrchestrator;
import com.mirador.hotel.saga.SagaResult;
import com.mirador.hotel.saga.SagaStep;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Pays an invoice through an orchestrated saga. Deliberately NOT @Transactional: every step commits on its own
 * (they span several services), which is exactly why compensations exist.
 */
@Service
public class PaiementService {

    private static final Set<String> METHODS = Set.of("ESPECES", "MOBILE_MONEY", "CARTE", "VIREMENT", "CHEQUE");

    private final PaiementRepository repository;
    private final PaymentSagaSteps sagaSteps;

    private final boolean faultInjection;

    public PaiementService(PaiementRepository repository, PaymentSagaSteps sagaSteps,
                           @Value("${paiements.saga.fault-injection:false}") boolean faultInjection) {
        this.repository = repository;
        this.sagaSteps = sagaSteps;
        this.faultInjection = faultInjection;
    }

    public PaymentDtos.PaymentResponse pay(PaymentDtos.PaymentRequest request) {
        String method = request.method().trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!METHODS.contains(method)) {
            throw new BadRequestException("Mode de paiement inconnu : " + request.method() + " (attendu : " + METHODS + ")");
        }

        String reference = "PAY" + System.currentTimeMillis();
        String invoiceCode = request.invoiceCode().trim();
        long paymentId = repository.insertPayment(reference, invoiceCode, request.amount(), method);
        long sagaId = repository.insertSaga(paymentId, PaymentSagaSteps.SAGA_TYPE);

        PaymentContext context = new PaymentContext(reference, invoiceCode, request.amount(), method);
        List<SagaStep<PaymentContext>> steps = sagaSteps.build();
        String failAt = request.simulateFailureAt();
        if (faultInjection && failAt != null && !failAt.isBlank()) {
            steps = steps.stream()
                    .<SagaStep<PaymentContext>>map(s -> s.name().equalsIgnoreCase(failAt.trim()) ? new FailingStep<>(s) : s)
                    .toList();
        }
        SagaResult result = new SagaOrchestrator<>(steps)
                .run(context, (step, status, detail) -> repository.addStep(sagaId, step, status.name(), detail));

        if (result.success()) {
            repository.finishPayment(paymentId, "COMPLETED", null, context.clientId);
            repository.endSaga(sagaId, "COMPLETED");
        } else {
            String reason = "[" + result.failedStep() + "] " + result.failureReason()
                    + (result.compensationFailed() ? " (compensation incomplete : verification manuelle requise)" : "");
            repository.finishPayment(paymentId, "FAILED", reason, context.clientId);
            repository.endSaga(sagaId, result.compensationFailed() ? "COMPENSATION_FAILED" : "COMPENSATED");
        }
        return get(paymentId);
    }

    public PaymentDtos.PaymentResponse get(long id) {
        PaiementRepository.PaymentRow row = repository.find(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paiement introuvable : " + id));
        return toResponse(row, true);
    }

    public List<PaymentDtos.PaymentResponse> list(String invoiceCode, String status) {
        return repository.findAll(invoiceCode, status).stream().map(row -> toResponse(row, false)).toList();
    }

    public PaymentDtos.SagaView saga(long paymentId) {
        return repository.findSagaByPayment(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune saga pour le paiement " + paymentId));
    }

    private PaymentDtos.PaymentResponse toResponse(PaiementRepository.PaymentRow row, boolean withSaga) {
        return new PaymentDtos.PaymentResponse(row.id(), row.reference(), row.invoiceCode(), row.clientId(), row.amount(),
                row.method(), row.status(), row.failureReason(), row.createdAt(),
                withSaga ? repository.findSagaByPayment(row.id()).orElse(null) : null);
    }
}
