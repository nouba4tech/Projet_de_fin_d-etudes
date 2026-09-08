package com.mirador.hotel.util;

import java.util.List;
import java.util.Locale;

public final class RoleAccess {

    public static final String ADMIN = "Admin";
    public static final String COMPTABLE = "Comptable";
    public static final String RECEPTION = "Reception";
    public static final String SERVICE = "Service";

    private RoleAccess() {
    }

    public static String normalizeRole(String role) {
        String normalized = stripAccents(ValueUtils.coalesce(role, SERVICE)).toLowerCase(Locale.ROOT);
        if (normalized.contains("admin") || normalized.contains("directeur") || normalized.contains("manager")) {
            return ADMIN;
        }
        if (normalized.contains("comptable") || normalized.contains("caissier")) {
            return COMPTABLE;
        }
        if (normalized.contains("reception") || normalized.contains("accueil") || normalized.contains("concierge")) {
            return RECEPTION;
        }
        return SERVICE;
    }

    public static String resolveRole(Integer groupCode, String groupName, String roleName) {
        String profileRole = ValueUtils.trimToNull(roleName);
        if (profileRole != null) {
            return normalizeRole(profileRole);
        }
        if (groupCode != null) {
            if (groupCode == 1 || groupCode == 201 || groupCode == 206) {
                return ADMIN;
            }
            if (groupCode == 204 || groupCode == 212) {
                return COMPTABLE;
            }
            if (groupCode == 203 || groupCode == 219 || groupCode == 222) {
                return RECEPTION;
            }
        }
        return normalizeRole(groupName);
    }

    public static int mapGroupCode(String role) {
        return switch (normalizeRole(role)) {
            case ADMIN -> 201;
            case COMPTABLE -> 204;
            case RECEPTION -> 203;
            default -> 6;
        };
    }

    public static String groupNameForRole(String role) {
        return switch (normalizeRole(role)) {
            case ADMIN -> "ADMINISTRATEUR";
            case COMPTABLE -> "COMPTABLE";
            case RECEPTION -> "RECEPTIONNISTE";
            default -> "SERVICE";
        };
    }

    public static List<String> permissionsForRole(String role) {
        return switch (normalizeRole(role)) {
            case ADMIN -> List.of(
                    "dashboard", "security", "settings", "reception", "main-courante", "rooms", "bookings", "guests",
                    "accounting", "cash-workflow", "finances", "reports", "economat", "stock", "restaurant", "bar",
                    "employees", "services", "ai");
                case COMPTABLE -> List.of("dashboard", "main-courante", "accounting", "cash-workflow", "finances", "reports");
            case RECEPTION -> List.of("dashboard", "reception", "main-courante", "rooms", "bookings", "guests", "services");
            default -> List.of("dashboard");
        };
    }

    private static String stripAccents(String value) {
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .trim();
    }
}
