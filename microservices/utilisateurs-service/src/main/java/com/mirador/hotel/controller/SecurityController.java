package com.mirador.hotel.controller;

import com.mirador.hotel.dto.AuthDtos;
import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.service.AuthService;
import com.mirador.hotel.service.SecurityService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final AuthService authService;
    private final SecurityService securityService;

    public SecurityController(AuthService authService, SecurityService securityService) {
        this.authService = authService;
        this.securityService = securityService;
    }

    // ===== USERS =====
    @GetMapping("/users")
    public ResponseEntity<List<AuthDtos.UserSummaryResponse>> listUsers() {
        return ResponseEntity.ok(authService.listUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<AuthDtos.UserSummaryResponse> createUser(@Valid @RequestBody AuthDtos.CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.createUser(request));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<AuthDtos.UserSummaryResponse> updateUser(
            @PathVariable long userId,
            @Valid @RequestBody AuthDtos.UpdateUserRequest request) {
        return ResponseEntity.ok(authService.updateUser(userId, request));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable long userId) {
        authService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

    // ===== GROUPS =====
    @GetMapping("/groups")
    public ResponseEntity<List<ParametresDtos.GroupResponse>> listGroups() {
        return ResponseEntity.ok(securityService.listGroups());
    }

    @GetMapping("/groups/{groupId}")
    public ResponseEntity<ParametresDtos.GroupResponse> getGroup(@PathVariable Integer groupId) {
        return ResponseEntity.ok(securityService.getGroup(groupId));
    }

    @PostMapping("/groups")
    public ResponseEntity<ParametresDtos.GroupResponse> createGroup(
            @Valid @RequestBody ParametresDtos.GroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(securityService.createGroup(request));
    }

    @PutMapping("/groups/{groupId}")
    public ResponseEntity<ParametresDtos.GroupResponse> updateGroup(
            @PathVariable Integer groupId,
            @Valid @RequestBody ParametresDtos.GroupRequest request) {
        return ResponseEntity.ok(securityService.updateGroup(groupId, request));
    }

    @DeleteMapping("/groups/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Integer groupId) {
        securityService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    // ===== PRIVILEGES =====
    @GetMapping("/privileges")
    public ResponseEntity<List<ParametresDtos.PrivilegeResponse>> listPrivileges(
            @RequestParam(required = false) Integer groupId) {
        if (groupId != null) {
            return ResponseEntity.ok(securityService.listPrivilegesByGroup(groupId));
        }
        return ResponseEntity.ok(securityService.listPrivileges());
    }

    @PatchMapping("/privileges/{privilegeId}/visibility")
    public ResponseEntity<ParametresDtos.PrivilegeResponse> togglePrivilegeVisibility(
            @PathVariable String privilegeId,
            @RequestBody java.util.Map<String, Boolean> body) {
        Boolean visible = body.get("visible");
        if (visible == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(securityService.togglePrivilegeVisibility(privilegeId, visible));
    }

    @GetMapping("/privileges/{privilegeId}")
    public ResponseEntity<ParametresDtos.PrivilegeResponse> getPrivilege(@PathVariable String privilegeId) {
        return ResponseEntity.ok(securityService.getPrivilege(privilegeId));
    }

    @PostMapping("/privileges")
    public ResponseEntity<ParametresDtos.PrivilegeResponse> createPrivilege(
            @Valid @RequestBody ParametresDtos.PrivilegeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(securityService.createPrivilege(request));
    }

    @PutMapping("/privileges/{privilegeId}")
    public ResponseEntity<ParametresDtos.PrivilegeResponse> updatePrivilege(
            @PathVariable String privilegeId,
            @Valid @RequestBody ParametresDtos.PrivilegeRequest request) {
        return ResponseEntity.ok(securityService.updatePrivilege(privilegeId, request));
    }

    @DeleteMapping("/privileges/{privilegeId}")
    public ResponseEntity<Void> deletePrivilege(@PathVariable String privilegeId) {
        securityService.deletePrivilege(privilegeId);
        return ResponseEntity.noContent().build();
    }

    // ===== DATABASE BACKUP =====
    @GetMapping("/backups")
    public ResponseEntity<List<ParametresDtos.BackupResponse>> listBackups() {
        return ResponseEntity.ok(securityService.listBackups());
    }

    @PostMapping("/backups")
    public ResponseEntity<ParametresDtos.BackupResponse> createBackup(
            @Valid @RequestBody ParametresDtos.BackupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(securityService.createBackup(request));
    }

    @PostMapping("/backups/{backupId}/restore")
    public ResponseEntity<Void> restoreBackup(@PathVariable String backupId) {
        securityService.restoreBackup(backupId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/backups/{backupId}")
    public ResponseEntity<Void> deleteBackup(@PathVariable String backupId) {
        securityService.deleteBackup(backupId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/backups")
    public ResponseEntity<Void> clearBackupHistory() {
        securityService.clearBackupHistory();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/backups/{backupId}/download")
    public ResponseEntity<byte[]> downloadBackup(@PathVariable String backupId) {
        return securityService.downloadBackup(backupId);
    }
}
