package com.mirador.hotel.service;

import com.mirador.hotel.dto.OperationsDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<OperationsDtos.EmployeeResponse> getEmployees() {
        return employeeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OperationsDtos.EmployeeResponse getEmployee(long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employe introuvable: " + employeeId));
    }

    public OperationsDtos.EmployeeResponse createEmployee(OperationsDtos.EmployeeRequest request) {
        long employeeId = employeeRepository.create(request);
        return getEmployee(employeeId);
    }

    public OperationsDtos.EmployeeResponse updateEmployee(long employeeId, OperationsDtos.EmployeeRequest request) {
        getEmployee(employeeId);
        employeeRepository.update(employeeId, request);
        return getEmployee(employeeId);
    }

    public void deleteEmployee(long employeeId) {
        getEmployee(employeeId);
        employeeRepository.delete(employeeId);
    }
}
