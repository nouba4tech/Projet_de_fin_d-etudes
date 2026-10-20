package com.mirador.hotel.repository;

import com.mirador.hotel.model.Fournisseur;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class FournisseurRepository {

    private final JdbcTemplate jdbcTemplate;

    public FournisseurRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Fournisseur> rowMapper = (rs, rowNum) -> new Fournisseur(
            rs.getInt("code_fournisseur"),
            rs.getString("numero"),
            rs.getString("nom"),
            rs.getString("contact"),
            rs.getBigDecimal("solde")
    );

    public List<Fournisseur> findAll() {
        return jdbcTemplate.query("SELECT * FROM fournisseur ORDER BY nom ASC", rowMapper);
    }

    public Optional<Fournisseur> findById(int id) {
        return jdbcTemplate.query("SELECT * FROM fournisseur WHERE code_fournisseur = ?", rowMapper, id)
                .stream()
                .findFirst();
    }

    public Fournisseur save(Fournisseur fournisseur) {
        if (fournisseur.getCodeFournisseur() == null) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(connection -> {
                PreparedStatement ps = connection.prepareStatement(
                        "INSERT INTO fournisseur (numero, nom, contact, solde) VALUES (?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS
                );
                ps.setString(1, fournisseur.getNumero());
                ps.setString(2, fournisseur.getNom());
                ps.setString(3, fournisseur.getContact());
                ps.setBigDecimal(4, fournisseur.getSolde());
                return ps;
            }, keyHolder);
            fournisseur.setCodeFournisseur(keyHolder.getKey().intValue());
        } else {
            jdbcTemplate.update(
                    "UPDATE fournisseur SET numero = ?, nom = ?, contact = ?, solde = ? WHERE code_fournisseur = ?",
                    fournisseur.getNumero(),
                    fournisseur.getNom(),
                    fournisseur.getContact(),
                    fournisseur.getSolde(),
                    fournisseur.getCodeFournisseur()
            );
        }
        return fournisseur;
    }

    public void deleteById(int id) {
        jdbcTemplate.update("DELETE FROM fournisseur WHERE code_fournisseur = ?", id);
    }
}
