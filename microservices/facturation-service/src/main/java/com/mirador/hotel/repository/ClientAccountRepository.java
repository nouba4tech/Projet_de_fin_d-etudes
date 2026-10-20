package com.mirador.hotel.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/** Customer (411...) ledger accounts opened on behalf of clients-service. */
@Repository
public class ClientAccountRepository {

    private final JdbcTemplate jdbcTemplate;

    public ClientAccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String create(String label) {
        Long next = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(CAST(numcompte AS UNSIGNED)), 411000000) + 1 "
                        + "FROM lescompte WHERE numcompte LIKE '411%'", Long.class);
        String accountNumber = String.valueOf(next == null ? 411000001L : next);
        jdbcTemplate.update(
                "INSERT INTO lescompte (numcompte, numero, libelle_compte, solde, cumul_depot, cumul_retrait, type_compte) "
                        + "VALUES (?, '411', ?, 0, 0, 0, 'C')",
                accountNumber, label);
        return accountNumber;
    }

    public int rename(String accountNumber, String label) {
        return jdbcTemplate.update("UPDATE lescompte SET libelle_compte = ? WHERE numcompte = ?", label, accountNumber);
    }
}
