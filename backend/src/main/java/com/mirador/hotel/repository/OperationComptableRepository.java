package com.mirador.hotel.repository;

import com.mirador.hotel.model.OperationComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OperationComptableRepository extends JpaRepository<OperationComptable, Long> {

    Optional<OperationComptable> findByReference(String reference);

    List<OperationComptable> findByAccountCode(String accountCode);

    List<OperationComptable> findByJournalCode(String journalCode);

    List<OperationComptable> findByStatus(String status);

    List<OperationComptable> findByCreatedBy(String createdBy);

    @Query("SELECT o FROM OperationComptable o WHERE o.date BETWEEN :startDate AND :endDate")
    List<OperationComptable> findByDateBetween(@Param("startDate") LocalDateTime startDate,
                                               @Param("endDate") LocalDateTime endDate);

    @Query("SELECT o FROM OperationComptable o WHERE o.date BETWEEN :startDate AND :endDate AND o.status = :status")
    List<OperationComptable> findByDateBetweenAndStatus(@Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate,
                                                        @Param("status") String status);

    @Query("SELECT o FROM OperationComptable o WHERE o.label LIKE %:search% OR o.reference LIKE %:search%")
    List<OperationComptable> findByLabelOrReferenceContaining(@Param("search") String search);

    @Query("SELECT SUM(o.debitAmount) FROM OperationComptable o WHERE o.status = :status")
    Double sumDebitByStatus(@Param("status") String status);

    @Query("SELECT SUM(o.creditAmount) FROM OperationComptable o WHERE o.status = :status")
    Double sumCreditByStatus(@Param("status") String status);

    @Query("SELECT COUNT(o) FROM OperationComptable o WHERE o.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT o.journalCode, COUNT(o), SUM(o.debitAmount), SUM(o.creditAmount) FROM OperationComptable o GROUP BY o.journalCode")
    List<Object[]> getOperationSummaryByJournal();
}
