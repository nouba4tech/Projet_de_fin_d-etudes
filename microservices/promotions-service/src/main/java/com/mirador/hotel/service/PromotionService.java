package com.mirador.hotel.service;

import com.mirador.hotel.client.RemoteApi;
import com.mirador.hotel.dto.PromotionDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.model.PromotionCalculator;
import com.mirador.hotel.repository.PromotionRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class PromotionService {

    private final PromotionRepository repository;

    public PromotionService(PromotionRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PromotionDtos.PromotionResponse> list(Boolean currentlyValid) {
        return repository.findAll(currentlyValid);
    }

    @Transactional(readOnly = true)
    public PromotionDtos.PromotionResponse get(long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Promotion introuvable : " + id));
    }

    public PromotionDtos.PromotionResponse create(PromotionDtos.PromotionRequest request) {
        validateRules(request);
        try {
            return get(repository.insert(request));
        } catch (DuplicateKeyException ex) {
            throw new ConflictException("Le code " + request.code().trim().toUpperCase() + " existe deja.");
        }
    }

    public PromotionDtos.PromotionResponse update(long id, PromotionDtos.PromotionRequest request) {
        get(id);
        validateRules(request);
        try {
            repository.update(id, request);
        } catch (DuplicateKeyException ex) {
            throw new ConflictException("Le code " + request.code().trim().toUpperCase() + " existe deja.");
        }
        return get(id);
    }

    public void delete(long id) {
        if (repository.delete(id) == 0) {
            throw new ResourceNotFoundException("Promotion introuvable : " + id);
        }
    }

    /** Dry run: tells whether the code applies and what the discount would be (usage counter untouched). */
    @Transactional(readOnly = true)
    public RemoteApi.PromotionResult validate(String code, BigDecimal amount) {
        return PromotionCalculator.evaluate(repository.findPromo(code).orElse(null), amount, LocalDate.now());
    }

    /** Applies the code for real: re-checks the rules then atomically consumes one use. */
    public RemoteApi.PromotionResult apply(String code, BigDecimal amount) {
        RemoteApi.PromotionResult result = validate(code, amount);
        if (!result.valid()) {
            return result;
        }
        if (!repository.consumeOne(code)) {
            return new RemoteApi.PromotionResult(false, result.code(), BigDecimal.ZERO, amount, "Limite d'utilisation atteinte");
        }
        return result;
    }

    private void validateRules(PromotionDtos.PromotionRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("La date de fin precede la date de debut.");
        }
        if (PromotionCalculator.PERCENT.equals(request.discountType())
                && request.discountValue().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Un pourcentage de remise ne peut pas depasser 100.");
        }
    }
}
