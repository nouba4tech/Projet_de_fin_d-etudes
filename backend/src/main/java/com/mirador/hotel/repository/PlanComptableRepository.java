package com.mirador.hotel.repository;

import com.mirador.hotel.model.PlanComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanComptableRepository extends JpaRepository<PlanComptable, Long> {

    Optional<PlanComptable> findByCode(String code);

    List<PlanComptable> findByType(String type);

    List<PlanComptable> findByClassName(String className);

    List<PlanComptable> findByStatus(String status);

    @Query("SELECT a FROM PlanComptable a WHERE a.code LIKE %:search% OR a.name LIKE %:search%")
    List<PlanComptable> findByCodeOrNameContaining(@Param("search") String search);

    @Query("SELECT a FROM PlanComptable a WHERE a.type = :type AND a.status = :status")
    List<PlanComptable> findByTypeAndStatus(@Param("type") String type, @Param("status") String status);

    @Query("SELECT SUM(a.balance) FROM PlanComptable a WHERE a.type = :type AND a.status = :status")
    Double sumBalanceByTypeAndStatus(@Param("type") String type, @Param("status") String status);

    @Query("SELECT COUNT(a) FROM PlanComptable a WHERE a.status = :status")
    Long countByStatus(@Param("status") String status);

    @Query("SELECT a.type, SUM(a.balance) FROM PlanComptable a WHERE a.status = 'Actif' GROUP BY a.type")
    List<Object[]> getBalanceSummaryByType();
}
