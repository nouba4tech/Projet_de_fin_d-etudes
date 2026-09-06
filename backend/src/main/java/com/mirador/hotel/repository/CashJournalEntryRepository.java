package com.mirador.hotel.repository;

import com.mirador.hotel.model.CashJournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CashJournalEntryRepository extends JpaRepository<CashJournalEntry, Long> {
    List<CashJournalEntry> findByScopeOrderByDateDesc(String scope);
    List<CashJournalEntry> findAllByOrderByDateDesc();
    boolean existsByScope(String scope);
}
