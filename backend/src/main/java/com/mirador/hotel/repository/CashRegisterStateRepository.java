package com.mirador.hotel.repository;

import com.mirador.hotel.model.CashRegisterState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CashRegisterStateRepository extends JpaRepository<CashRegisterState, Long> {
    List<CashRegisterState> findByScopeOrderByRegisterNumberAsc(String scope);
    List<CashRegisterState> findAllByOrderByRegisterNumberAsc();
    Optional<CashRegisterState> findByScopeAndRegisterNumber(String scope, String registerNumber);
    Optional<CashRegisterState> findFirstByRegisterNumber(String registerNumber);
    boolean existsByScope(String scope);
}
