package com.mirador.hotel.service;

import com.mirador.hotel.dto.AuthDtos;
import com.mirador.hotel.exception.InvalidCredentialsException;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.exception.UserAlreadyExistsException;
import com.mirador.hotel.repository.AuthRepository;
import com.mirador.hotel.util.PasswordUtils;
import com.mirador.hotel.util.RoleAccess;
import com.mirador.hotel.util.ValueUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.mirador.hotel.security.JwtUtils;

@Service
@Transactional
public class AuthService {

    private final AuthRepository authRepository;
    private final JwtUtils jwtUtils;

    public AuthService(AuthRepository authRepository, JwtUtils jwtUtils) {
        this.authRepository = authRepository;
        this.jwtUtils = jwtUtils;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        String username = request.username().trim();
        String email = ValueUtils.trimToNull(request.email());
        String role = RoleAccess.normalizeRole(request.role());

        if (authRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Le nom d'utilisateur " + username + " existe deja.");
        }

        if (email != null && authRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("L'email " + email + " est deja utilise.");
        }

        NameParts nameParts = splitName(request.name());
        long userId = authRepository.insertUser(request, nameParts.lastName(), nameParts.firstName(), role);
        authRepository.upsertProfile(userId, email, role);

        int groupCode = authRepository.findGroupCodeForRole(role);
        String token = jwtUtils.generateToken(username, userId, role);
        return new AuthDtos.AuthResponse(
            token,
            username,
            role,
            groupCode,
            RoleAccess.groupNameForRole(role),
            RoleAccess.permissionsForRole(role),
            buildDisplayName(nameParts.firstName(), nameParts.lastName()),
            userId,
            email,
            true);
    }

    @Transactional(readOnly = false)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        AuthRepository.AuthUserRow user = authRepository.findByUsernameOrEmail(request.username())
                .orElseThrow(() -> new InvalidCredentialsException("Identifiants invalides."));

        if (!PasswordUtils.matches(request.password(), user.passwordHash())) {
            throw new InvalidCredentialsException("Identifiants invalides.");
        }

        if (!isActive(user.status())) {
            throw new InvalidCredentialsException("Ce compte utilisateur est inactif.");
        }

        authRepository.touchLastLogin(user.id());

        String role = RoleAccess.resolveRole(user.groupCode(), user.groupName(), user.role());
        int groupCode = authRepository.findGroupCodeForRole(role);
        authRepository.updateUserGroup(user.id(), role);

        String token = jwtUtils.generateToken(user.username(), user.id(), role);
        return new AuthDtos.AuthResponse(
            token,
            user.username(),
            role,
            groupCode,
            RoleAccess.groupNameForRole(role),
            RoleAccess.permissionsForRole(role),
            buildDisplayName(user.firstName(), user.lastName()),
            user.id(),
            ValueUtils.trimToNull(user.email()),
            true);
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserSummaryResponse> listUsers() {
        return authRepository.findAllUsers();
    }

    public AuthDtos.UserSummaryResponse createUser(AuthDtos.CreateUserRequest request) {
        String username = request.username().trim();
        String email = ValueUtils.trimToNull(request.email());
        String role = RoleAccess.normalizeRole(request.role());
        String status = normalizeStatus(request.status());
        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();

        if (authRepository.existsByUsername(username)) {
            throw new UserAlreadyExistsException("Le nom d'utilisateur " + username + " existe deja.");
        }
        if (email != null && authRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("L'email " + email + " existe deja.");
        }

        long userId = authRepository.insertUser(request, lastName, firstName, role, status);
        authRepository.upsertProfile(userId, email, role);

        return toSummary(authRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable apres creation.")));
    }

    public AuthDtos.UserSummaryResponse updateUser(long userId, AuthDtos.UpdateUserRequest request) {
        AuthRepository.AuthUserRow existing = authRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        String username = request.username().trim();
        String email = ValueUtils.trimToNull(request.email());
        String role = RoleAccess.normalizeRole(request.role());
        String status = normalizeStatus(request.status());
        String firstName = request.firstName().trim();
        String lastName = request.lastName().trim();

        if (authRepository.existsByUsernameExcludingId(username, userId)) {
            throw new UserAlreadyExistsException("Le nom d'utilisateur " + username + " existe deja.");
        }
        if (email != null && authRepository.existsByEmailExcludingId(email, userId)) {
            throw new UserAlreadyExistsException("L'email " + email + " existe deja.");
        }

        authRepository.updateUser(existing.id(), request, lastName, firstName, role, status);
        authRepository.upsertProfile(existing.id(), email, role);

        return toSummary(authRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable apres mise a jour.")));
    }

    public void deleteUser(long userId) {
        AuthRepository.AuthUserRow existing = authRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        authRepository.deleteUser(existing.id());
    }

    public void changePassword(AuthDtos.ChangePasswordRequest request) {
        if (request.userId() == null) {
            throw new InvalidCredentialsException("Identifiant utilisateur manquant.");
        }
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new InvalidCredentialsException("La confirmation du mot de passe ne correspond pas.");
        }

        AuthRepository.AuthUserRow existing = authRepository.findById(request.userId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

        if (!PasswordUtils.matches(request.currentPassword(), existing.passwordHash())) {
            throw new InvalidCredentialsException("Le mot de passe actuel est incorrect.");
        }

        authRepository.updatePassword(existing.id(), request.newPassword());
    }

    private NameParts splitName(String rawName) {
        String normalized = ValueUtils.coalesce(rawName, "").trim();
        if (normalized.isEmpty()) {
            return new NameParts("Utilisateur", "Mirador");
        }

        String[] parts = normalized.split("\\s+");
        if (parts.length == 1) {
            return new NameParts(parts[0], parts[0]);
        }

        String firstName = parts[0];
        String lastName = normalized.substring(firstName.length()).trim();
        return new NameParts(firstName, lastName);
    }

    private String buildDisplayName(String firstName, String lastName) {
        return (ValueUtils.coalesce(firstName, "") + " " + ValueUtils.coalesce(lastName, "")).trim();
    }

    private boolean isActive(String status) {
        return !"Suspendu".equalsIgnoreCase(ValueUtils.coalesce(status, "Actif"));
    }

    private String normalizeStatus(String status) {
        return "Suspendu".equalsIgnoreCase(ValueUtils.coalesce(status, "Actif")) ? "Suspendu" : "Actif";
    }

    private AuthDtos.UserSummaryResponse toSummary(AuthRepository.AuthUserRow user) {
        String role = RoleAccess.resolveRole(user.groupCode(), user.groupName(), user.role());
        return new AuthDtos.UserSummaryResponse(
                user.id(),
                user.username(),
                ValueUtils.coalesce(user.firstName(), ""),
                ValueUtils.coalesce(user.lastName(), ""),
                ValueUtils.coalesce(user.email(), ""),
                role,
                authRepository.findGroupCodeForRole(role),
                RoleAccess.groupNameForRole(role),
                isActive(user.status()));
    }

    private record NameParts(String firstName, String lastName) {
    }
}
