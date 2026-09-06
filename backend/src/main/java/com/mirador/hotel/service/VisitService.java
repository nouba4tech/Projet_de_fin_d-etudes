package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.repository.VisitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VisitService {

    private final VisitRepository visitRepository;

    public VisitService(VisitRepository visitRepository) {
        this.visitRepository = visitRepository;
    }

    public List<OperationsDtos.VisitResponse> getVisits() {
        return visitRepository.findAll();
    }

    public OperationsDtos.VisitResponse getVisit(long id) {
        return visitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visite non trouvee avec l'id: " + id));
    }

    @Transactional
    public OperationsDtos.VisitResponse createVisit(OperationsDtos.VisitRequest request) {
        long id = visitRepository.create(request);
        return getVisit(id);
    }

    @Transactional
    public OperationsDtos.VisitResponse updateVisit(long id, OperationsDtos.VisitRequest request) {
        visitRepository.update(id, request);
        return getVisit(id);
    }

    @Transactional
    public void deleteVisit(long id) {
        visitRepository.delete(id);
    }
}
