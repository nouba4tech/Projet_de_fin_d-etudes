package com.mirador.hotel.service;

import com.mirador.hotel.model.BrouillardCaisse;
import com.mirador.hotel.repository.BrouillardCaisseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BrouillardCaisseService {

    @Autowired
    private BrouillardCaisseRepository brouillardCaisseRepository;

    public List<BrouillardCaisse> getAllCashEntries() {
        return brouillardCaisseRepository.findAll();
    }

    public Optional<BrouillardCaisse> getCashEntryById(@NonNull Long id) {
        return brouillardCaisseRepository.findById(id);
    }

    public List<BrouillardCaisse> getCashEntriesByDate(LocalDate date) {
        return brouillardCaisseRepository.findByDate(date);
    }

    public List<BrouillardCaisse> getCashEntriesByType(String type) {
        return brouillardCaisseRepository.findByType(type);
    }

    public List<BrouillardCaisse> getCashEntriesByDateRange(LocalDate startDate, LocalDate endDate) {
        return brouillardCaisseRepository.findByDateBetween(startDate, endDate);
    }

    public List<BrouillardCaisse> getCashEntriesByDateRangeAndType(LocalDate startDate, LocalDate endDate, String type) {
        return brouillardCaisseRepository.findByDateBetweenAndType(startDate, endDate, type);
    }

    public List<BrouillardCaisse> searchCashEntries(String search) {
        return brouillardCaisseRepository.findByDescriptionContaining(search);
    }

    public BrouillardCaisse createCashEntry(BrouillardCaisse brouillardCaisse) {
        Double latestBalance = brouillardCaisseRepository.findLatestBalance();
        if (latestBalance == null) {
            latestBalance = 0.0;
        }

        Double newBalance;
        if ("Entrée".equals(brouillardCaisse.getType())) {
            newBalance = latestBalance + brouillardCaisse.getAmount();
        } else if ("Sortie".equals(brouillardCaisse.getType())) {
            newBalance = latestBalance - brouillardCaisse.getAmount();
        } else {
            throw new RuntimeException("Type d'operation invalide. Doit etre 'Entree' ou 'Sortie'");
        }

        brouillardCaisse.setBalance(newBalance);
        brouillardCaisse.setCreatedAt(LocalDateTime.now());

        return brouillardCaisseRepository.save(brouillardCaisse);
    }

    public BrouillardCaisse updateCashEntry(@NonNull Long id, BrouillardCaisse brouillardCaisseDetails) {
        Optional<BrouillardCaisse> optionalCashEntry = brouillardCaisseRepository.findById(id);
        if (!optionalCashEntry.isPresent()) {
            throw new RuntimeException("Entree de caisse non trouvee");
        }

        BrouillardCaisse brouillardCaisse = optionalCashEntry.get();

        if (!brouillardCaisse.getAmount().equals(brouillardCaisseDetails.getAmount())
                || !brouillardCaisse.getType().equals(brouillardCaisseDetails.getType())) {

            List<BrouillardCaisse> previousEntries = brouillardCaisseRepository.findAllOrderByDateAndTimeDesc();
            int currentIndex = previousEntries.indexOf(brouillardCaisse);
            Double previousBalance = 0.0;

            if (currentIndex > 0) {
                previousBalance = previousEntries.get(currentIndex - 1).getBalance();
            }

            Double newBalance;
            if ("Entrée".equals(brouillardCaisseDetails.getType())) {
                newBalance = previousBalance + brouillardCaisseDetails.getAmount();
            } else if ("Sortie".equals(brouillardCaisseDetails.getType())) {
                newBalance = previousBalance - brouillardCaisseDetails.getAmount();
            } else {
                throw new RuntimeException("Type d'operation invalide. Doit etre 'Entree' ou 'Sortie'");
            }

            brouillardCaisse.setBalance(newBalance);
            updateSubsequentBalances(brouillardCaisse.getDate(), brouillardCaisse.getTime(), newBalance);
        }

        brouillardCaisse.setDescription(brouillardCaisseDetails.getDescription());
        brouillardCaisse.setAmount(brouillardCaisseDetails.getAmount());
        brouillardCaisse.setType(brouillardCaisseDetails.getType());

        return brouillardCaisseRepository.save(brouillardCaisse);
    }

    public void deleteCashEntry(@NonNull Long id) {
        Optional<BrouillardCaisse> optionalCashEntry = brouillardCaisseRepository.findById(id);
        if (!optionalCashEntry.isPresent()) {
            throw new RuntimeException("Entree de caisse non trouvee");
        }

        BrouillardCaisse brouillardCaisse = optionalCashEntry.get();
        List<BrouillardCaisse> subsequentEntries = brouillardCaisseRepository.findAllOrderByDateAndTimeDesc();
        int currentIndex = subsequentEntries.indexOf(brouillardCaisse);

        if (currentIndex > 0) {
            Double previousBalance = 0.0;
            if (currentIndex < subsequentEntries.size() - 1) {
                previousBalance = subsequentEntries.get(currentIndex + 1).getBalance();
            }

            for (int i = currentIndex - 1; i >= 0; i--) {
                BrouillardCaisse subsequentEntry = subsequentEntries.get(i);
                if ("Entrée".equals(subsequentEntry.getType())) {
                    previousBalance = previousBalance - subsequentEntry.getAmount();
                } else {
                    previousBalance = previousBalance + subsequentEntry.getAmount();
                }
                subsequentEntry.setBalance(previousBalance);
                brouillardCaisseRepository.save(subsequentEntry);
            }
        }

        brouillardCaisseRepository.deleteById(id);
    }

    private void updateSubsequentBalances(LocalDate date, LocalTime time, Double newBalance) {
        List<BrouillardCaisse> subsequentEntries = brouillardCaisseRepository.findAllOrderByDateAndTimeDesc();

        for (BrouillardCaisse entry : subsequentEntries) {
            if ((entry.getDate().isAfter(date))
                    || (entry.getDate().equals(date) && entry.getTime().isAfter(time))) {

                if ("Entrée".equals(entry.getType())) {
                    newBalance = newBalance + entry.getAmount();
                } else {
                    newBalance = newBalance - entry.getAmount();
                }
                entry.setBalance(newBalance);
                brouillardCaisseRepository.save(entry);
            }
        }
    }

    public Double getTotalAmountByType(String type) {
        return brouillardCaisseRepository.sumAmountByType(type);
    }

    public Double getTotalAmountByTypeAndDateRange(String type, LocalDate startDate, LocalDate endDate) {
        return brouillardCaisseRepository.sumAmountByTypeAndDateBetween(type, startDate, endDate);
    }

    public Long getCashEntryCountByType(String type) {
        return brouillardCaisseRepository.countByType(type);
    }

    public List<BrouillardCaisse> getCashEntriesOrderByDateDesc() {
        return brouillardCaisseRepository.findAllOrderByDateAndTimeDesc();
    }

    public Double getCurrentBalance() {
        return brouillardCaisseRepository.findLatestBalance();
    }

    public List<BrouillardCaisse> getIncomes() {
        return brouillardCaisseRepository.findByType("Entrée");
    }

    public List<BrouillardCaisse> getExpenses() {
        return brouillardCaisseRepository.findByType("Sortie");
    }

    public List<BrouillardCaisse> getTodayEntries() {
        return brouillardCaisseRepository.findByDate(LocalDate.now());
    }

    public Double getTodayBalance() {
        List<BrouillardCaisse> todayEntries = getTodayEntries();
        if (todayEntries.isEmpty()) {
            return 0.0;
        }
        return todayEntries.get(todayEntries.size() - 1).getBalance();
    }
}
