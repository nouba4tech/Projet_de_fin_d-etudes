package com.mirador.hotel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Le nom d'utilisateur ou l'email est obligatoire")
            String username,

            @NotBlank(message = "Le mot de passe est obligatoire")
            String password) {
    }

    public record RegisterRequest(
            @NotBlank(message = "Le nom d'utilisateur est obligatoire")
            String username,

            @NotBlank(message = "Le mot de passe est obligatoire")
            String password,

            @NotBlank(message = "Le nom complet est obligatoire")
            String name,

            @Email(message = "L'email doit etre valide")
            String email,

            String role) {
    }

    public record AuthResponse(
            String token,
            String username,
            String role,
            Integer groupCode,
            String groupName,
            java.util.List<String> permissions,
            String name,
            Long userId,
            String email,
            boolean active) {
    }

    public record UserSummaryResponse(
            Long id,
            String username,
            String firstName,
            String lastName,
            String email,
            String role,
            Integer groupCode,
            String groupName,
            boolean active) {
    }

    public record CreateUserRequest(
            @NotBlank(message = "Le nom d'utilisateur est obligatoire")
            String username,

            @NotBlank(message = "Le mot de passe est obligatoire")
            @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caracteres")
            String password,

            @NotBlank(message = "Le prenom est obligatoire")
            String firstName,

            @NotBlank(message = "Le nom est obligatoire")
            String lastName,

            @Email(message = "L'email doit etre valide")
            String email,

            String role,

            String status) {
    }

    public record UpdateUserRequest(
            @NotBlank(message = "Le nom d'utilisateur est obligatoire")
            String username,

            @NotBlank(message = "Le prenom est obligatoire")
            String firstName,

            @NotBlank(message = "Le nom est obligatoire")
            String lastName,

            @Email(message = "L'email doit etre valide")
            String email,

            String role,

            String status) {
    }

    public record ChangePasswordRequest(
            Long userId,

            @NotBlank(message = "Le mot de passe actuel est obligatoire")
            String currentPassword,

            @NotBlank(message = "Le nouveau mot de passe est obligatoire")
            @Size(min = 8, message = "Le nouveau mot de passe doit contenir au moins 8 caracteres")
            String newPassword,

            @NotBlank(message = "La confirmation du mot de passe est obligatoire")
            String confirmPassword) {
    }
}
