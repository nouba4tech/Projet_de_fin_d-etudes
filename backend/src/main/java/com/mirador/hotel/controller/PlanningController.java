package com.mirador.hotel.controller;

import com.mirador.hotel.dto.PlanningDtos;
import com.mirador.hotel.service.PlanningService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Employee schedules. */
@RestController
@RequestMapping("/api")
public class PlanningController {

    private final PlanningService planningService;

    public PlanningController(PlanningService planningService) {
        this.planningService = planningService;
    }

    /** Schedule of everybody (default: the next 7 days), optionally for one employee. */
    @GetMapping("/planning")
    public List<PlanningDtos.ShiftResponse> planning(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return planningService.list(employeeId, from, to);
    }

    @GetMapping("/employees/{employeeId}/planning")
    public List<PlanningDtos.ShiftResponse> employeePlanning(
            @PathVariable long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return planningService.list(employeeId, from, to);
    }

    @PostMapping("/employees/{employeeId}/planning")
    public ResponseEntity<PlanningDtos.ShiftResponse> addShift(@PathVariable long employeeId,
                                                               @Valid @RequestBody PlanningDtos.ShiftRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(planningService.create(employeeId, request));
    }

    @GetMapping("/planning/{shiftId}")
    public PlanningDtos.ShiftResponse getShift(@PathVariable long shiftId) {
        return planningService.get(shiftId);
    }

    @PutMapping("/planning/{shiftId}")
    public PlanningDtos.ShiftResponse updateShift(@PathVariable long shiftId,
                                                  @Valid @RequestBody PlanningDtos.ShiftRequest request) {
        return planningService.update(shiftId, request);
    }

    @DeleteMapping("/planning/{shiftId}")
    public ResponseEntity<Void> deleteShift(@PathVariable long shiftId) {
        planningService.delete(shiftId);
        return ResponseEntity.noContent().build();
    }
}
