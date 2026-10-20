package com.mirador.hotel.repository;

import com.mirador.hotel.model.CashTransferRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashTransferRecordRepository extends JpaRepository<CashTransferRecord, Long> {
    List<CashTransferRecord> findByScopeOrderByTransferDateDesc(String scope);
    List<CashTransferRecord> findAllByOrderByTransferDateDesc();
    boolean existsByScope(String scope);
}
