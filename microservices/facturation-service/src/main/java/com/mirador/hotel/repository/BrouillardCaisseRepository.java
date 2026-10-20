package com.mirador.hotel.repository;

import com.mirador.hotel.model.BrouillardCaisse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BrouillardCaisseRepository extends JpaRepository<BrouillardCaisse, Long> {

    List<BrouillardCaisse> findByDate(LocalDate date);

    List<BrouillardCaisse> findByType(String type);

    List<BrouillardCaisse> findByCreatedBy(String createdBy);

    @Query("SELECT c FROM BrouillardCaisse c WHERE c.date BETWEEN :startDate AND :endDate")
    List<BrouillardCaisse> findByDateBetween(@Param("startDate") LocalDate startDate,
                                             @Param("endDate") LocalDate endDate);

    @Query("SELECT c FROM BrouillardCaisse c WHERE c.date BETWEEN :startDate AND :endDate AND c.type = :type")
    List<BrouillardCaisse> findByDateBetweenAndType(@Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate,
                                                    @Param("type") String type);

    @Query("SELECT c FROM BrouillardCaisse c WHERE c.description LIKE %:search%")
    List<BrouillardCaisse> findByDescriptionContaining(@Param("search") String search);

    @Query("SELECT SUM(c.amount) FROM BrouillardCaisse c WHERE c.type = :type AND c.date BETWEEN :startDate AND :endDate")
    Double sumAmountByTypeAndDateBetween(@Param("type") String type,
                                         @Param("startDate") LocalDate startDate,
                                         @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(c.amount) FROM BrouillardCaisse c WHERE c.type = :type")
    Double sumAmountByType(@Param("type") String type);

    @Query("SELECT COUNT(c) FROM BrouillardCaisse c WHERE c.type = :type")
    Long countByType(@Param("type") String type);

    @Query("SELECT c FROM BrouillardCaisse c ORDER BY c.date DESC, c.time DESC")
    List<BrouillardCaisse> findAllOrderByDateAndTimeDesc();

    @Query("SELECT MAX(c.balance) FROM BrouillardCaisse c")
    Double findLatestBalance();
}
