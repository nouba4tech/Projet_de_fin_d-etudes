package com.mirador.hotel.service;

import com.mirador.hotel.model.PlanComptable;
import com.mirador.hotel.repository.PlanComptableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanComptableService {

    // account lists are bounded: the plan can hold up to millions of rows
    private static final Pageable FIRST_PAGE = PageRequest.of(0, 500, Sort.by("code"));

    @Autowired
    private PlanComptableRepository planComptableRepository;

    public List<PlanComptable> getAllAccounts() {
        return planComptableRepository.findAll(FIRST_PAGE).getContent();
    }

    public Optional<PlanComptable> getAccountById(@NonNull Long id) {
        return planComptableRepository.findById(id);
    }

    public Optional<PlanComptable> getAccountByCode(String code) {
        return planComptableRepository.findByCode(code);
    }

    public List<PlanComptable> getAccountsByType(String type) {
        return planComptableRepository.findByType(type, FIRST_PAGE);
    }

    public List<PlanComptable> getAccountsByClass(String className) {
        return planComptableRepository.findByClassName(className, FIRST_PAGE);
    }

    public List<PlanComptable> getAccountsByStatus(String status) {
        return planComptableRepository.findByStatus(status, FIRST_PAGE);
    }

    public List<PlanComptable> searchAccounts(String search) {
        return planComptableRepository.findByCodeOrNameContaining(search, FIRST_PAGE);
    }

    public PlanComptable createAccount(PlanComptable account) {
        if (planComptableRepository.findByCode(account.getCode()).isPresent()) {
            throw new RuntimeException("Ce code de compte existe deja");
        }

        account.setCreatedAt(java.time.LocalDateTime.now());
        account.setStatus("Actif");
        return planComptableRepository.save(account);
    }

    public PlanComptable updateAccount(@NonNull Long id, PlanComptable accountDetails) {
        Optional<PlanComptable> optionalAccount = planComptableRepository.findById(id);
        if (!optionalAccount.isPresent()) {
            throw new RuntimeException("Compte non trouve");
        }

        PlanComptable account = optionalAccount.get();

        Optional<PlanComptable> existingAccount = planComptableRepository.findByCode(accountDetails.getCode());
        if (existingAccount.isPresent() && !existingAccount.get().getId().equals(id)) {
            throw new RuntimeException("Ce code de compte existe deja");
        }

        account.setCode(accountDetails.getCode());
        account.setName(accountDetails.getName());
        account.setType(accountDetails.getType());
        account.setClassName(accountDetails.getClassName());
        account.setBalance(accountDetails.getBalance());
        account.setStatus(accountDetails.getStatus());

        return planComptableRepository.save(account);
    }

    public void deleteAccount(@NonNull Long id) {
        if (!planComptableRepository.existsById(id)) {
            throw new RuntimeException("Compte non trouve");
        }
        planComptableRepository.deleteById(id);
    }

    public PlanComptable activateAccount(@NonNull Long id) {
        Optional<PlanComptable> optionalAccount = planComptableRepository.findById(id);
        if (!optionalAccount.isPresent()) {
            throw new RuntimeException("Compte non trouve");
        }

        PlanComptable account = optionalAccount.get();
        account.setStatus("Actif");
        return planComptableRepository.save(account);
    }

    public PlanComptable deactivateAccount(@NonNull Long id) {
        Optional<PlanComptable> optionalAccount = planComptableRepository.findById(id);
        if (!optionalAccount.isPresent()) {
            throw new RuntimeException("Compte non trouve");
        }

        PlanComptable account = optionalAccount.get();
        account.setStatus("Inactif");
        return planComptableRepository.save(account);
    }

    public Map<String, Double> getBalanceSummary() {
        List<Object[]> results = planComptableRepository.getBalanceSummaryByType();
        return results.stream()
                .collect(Collectors.toMap(
                        result -> (String) result[0],
                        result -> (Double) result[1]
                ));
    }

    public Double getTotalBalanceByType(String type) {
        return planComptableRepository.sumBalanceByTypeAndStatus(type, "Actif");
    }

    public Long getAccountCountByStatus(String status) {
        return planComptableRepository.countByStatus(status);
    }

    public List<PlanComptable> getActiveAccounts() {
        return planComptableRepository.findByStatus("Actif", FIRST_PAGE);
    }

    public boolean accountExists(String code) {
        return planComptableRepository.findByCode(code).isPresent();
    }
}
