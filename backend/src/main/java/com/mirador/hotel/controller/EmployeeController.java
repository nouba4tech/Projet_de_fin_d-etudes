package com.mirador.hotel.controller;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    public List<OperationsDtos.EmployeeResponse> getAllEmployees() {
        return employeeService.getEmployees();
    }

    @GetMapping("/{employeeId}")
    public OperationsDtos.EmployeeResponse getEmployeeById(@PathVariable long employeeId) {
        return employeeService.getEmployee(employeeId);
    }

    @PostMapping
    public ResponseEntity<OperationsDtos.EmployeeResponse> createEmployee(
            @Valid @RequestBody OperationsDtos.EmployeeRequest request) {
        OperationsDtos.EmployeeResponse employee = employeeService.createEmployee(request);
        return ResponseEntity.created(URI.create("/api/employees/" + employee.id())).body(employee);
    }

    @PutMapping("/{employeeId}")
    public OperationsDtos.EmployeeResponse updateEmployee(
            @PathVariable long employeeId,
            @Valid @RequestBody OperationsDtos.EmployeeRequest request) {
        return employeeService.updateEmployee(employeeId, request);
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable long employeeId) {
        employeeService.deleteEmployee(employeeId);
        return ResponseEntity.noContent().build();
    }
}
