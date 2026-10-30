package com.mirador.hotel.service;

import com.mirador.hotel.dto.PlanningDtos;
import com.mirador.hotel.exception.BadRequestException;
import com.mirador.hotel.exception.ConflictException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.PlanningRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/** Work schedules (shifts) of the employees. */
@Service
@Transactional
public class PlanningService {

    private final PlanningRepository repository;

    public PlanningService(PlanningRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PlanningDtos.ShiftResponse> list(Long employeeId, LocalDate from, LocalDate to) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start.plusDays(6) : to;
        if (end.isBefore(start)) {
            throw new BadRequestException("La date de fin precede la date de debut.");
        }
        return repository.find(employeeId, start, end);
    }

    @Transactional(readOnly = true)
    public PlanningDtos.ShiftResponse get(long shiftId) {
        return repository.findById(shiftId)
                .orElseThrow(() -> new ResourceNotFoundException("Creneau introuvable : " + shiftId));
    }

    public PlanningDtos.ShiftResponse create(long employeeId, PlanningDtos.ShiftRequest request) {
        if (!repository.employeeExists(employeeId)) {
            throw new ResourceNotFoundException("Employe introuvable : " + employeeId);
        }
        validate(employeeId, request, null);
        return get(repository.insert(employeeId, request));
    }

    public PlanningDtos.ShiftResponse update(long shiftId, PlanningDtos.ShiftRequest request) {
        PlanningDtos.ShiftResponse current = get(shiftId);
        validate(current.employeeId(), request, shiftId);
        repository.update(shiftId, request);
        return get(shiftId);
    }

    public void delete(long shiftId) {
        if (repository.delete(shiftId) == 0) {
            throw new ResourceNotFoundException("Creneau introuvable : " + shiftId);
        }
    }

    private void validate(long employeeId, PlanningDtos.ShiftRequest request, Long excludeId) {
        if (!request.endTime().isAfter(request.startTime())) {
            throw new BadRequestException("L'heure de fin doit etre posterieure a l'heure de debut (un service de nuit se saisit en deux creneaux).");
        }
        if (repository.countOverlaps(employeeId, request.date(), request.startTime(), request.endTime(), excludeId) > 0) {
            throw new ConflictException("Cet employe a deja un creneau qui chevauche ces horaires le " + request.date() + ".");
        }
    }
}
