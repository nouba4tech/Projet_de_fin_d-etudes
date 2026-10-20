package com.mirador.hotel.service;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.SecurityRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional
public class SecurityService {

    private final SecurityRepository securityRepository;

    public SecurityService(SecurityRepository securityRepository) {
        this.securityRepository = securityRepository;
    }

    // ===== GROUPS =====
    public List<ParametresDtos.GroupResponse> listGroups() {
        return securityRepository.findAllGroups();
    }

    public ParametresDtos.GroupResponse getGroup(Integer groupId) {
        return securityRepository.findGroupById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe introuvable."));
    }

    public ParametresDtos.GroupResponse createGroup(ParametresDtos.GroupRequest request) {
        int id = securityRepository.createGroup(request);
        return securityRepository.findGroupById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe cree introuvable."));
    }

    public ParametresDtos.GroupResponse updateGroup(Integer groupId, ParametresDtos.GroupRequest request) {
        securityRepository.findGroupById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe introuvable."));
        securityRepository.updateGroup(groupId, request);
        return securityRepository.findGroupById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe mis a jour introuvable."));
    }

    public void deleteGroup(Integer groupId) {
        securityRepository.findGroupById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Groupe introuvable."));
        securityRepository.deleteGroup(groupId);
    }

    // ===== PRIVILEGES =====
    public List<ParametresDtos.PrivilegeResponse> listPrivileges() {
        return securityRepository.findAllPrivileges();
    }

    public List<ParametresDtos.PrivilegeResponse> listPrivilegesByGroup(Integer groupId) {
        return securityRepository.findPrivilegesByGroup(groupId);
    }

    public ParametresDtos.PrivilegeResponse getPrivilege(String privilegeId) {
        return securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege introuvable."));
    }

    public ParametresDtos.PrivilegeResponse createPrivilege(ParametresDtos.PrivilegeRequest request) {
        String id = securityRepository.createPrivilege(request);
        return securityRepository.findPrivilegeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege cree introuvable."));
    }

    public ParametresDtos.PrivilegeResponse updatePrivilege(String privilegeId, ParametresDtos.PrivilegeRequest request) {
        securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege introuvable."));
        securityRepository.updatePrivilege(privilegeId, request);
        return securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege mis a jour introuvable."));
    }

    public void deletePrivilege(String privilegeId) {
        securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege introuvable."));
        securityRepository.deletePrivilege(privilegeId);
    }

    public ParametresDtos.PrivilegeResponse togglePrivilegeVisibility(String privilegeId, boolean visible) {
        securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege introuvable."));
        securityRepository.updatePrivilegeVisibility(privilegeId, visible);
        return securityRepository.findPrivilegeById(privilegeId)
                .orElseThrow(() -> new ResourceNotFoundException("Privilege introuvable."));
    }

    // ===== DATABASE BACKUP =====
    public List<ParametresDtos.BackupResponse> listBackups() {
        return securityRepository.findAllBackups();
    }

    public ParametresDtos.BackupResponse createBackup(ParametresDtos.BackupRequest request) {
        String label = request.label() != null ? request.label() : "Sauvegarde " + OffsetDateTime.now();
        long id = securityRepository.createBackup(label);
        return securityRepository.findBackupById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Sauvegarde creee introuvable."));
    }

    public void restoreBackup(String backupId) {
        securityRepository.findBackupById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("Sauvegarde introuvable."));
        securityRepository.updateBackupStatus(backupId, "Restauree");
    }

    public void deleteBackup(String backupId) {
        securityRepository.findBackupById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("Sauvegarde introuvable."));
        securityRepository.deleteBackup(backupId);
    }

    public void clearBackupHistory() {
        securityRepository.deleteAllBackups();
    }

    public ResponseEntity<byte[]> downloadBackup(String backupId) {
        ParametresDtos.BackupResponse backup = securityRepository.findBackupById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("Sauvegarde introuvable."));

        byte[] backupData = securityRepository.generateSqlDump();
        String safeName = backup.label().replaceAll("[^a-zA-Z0-9_-]+", "_");

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + safeName + ".sql\"")
                .header("Content-Type", "application/octet-stream")
                .body(backupData);
    }
}
