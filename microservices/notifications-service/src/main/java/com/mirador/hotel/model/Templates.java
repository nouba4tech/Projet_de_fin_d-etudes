package com.mirador.hotel.model;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Message templates ({{variable}} placeholders) and their rendering. */
public final class Templates {

    public record Template(String subject, String email, String sms) {
    }

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*([A-Za-z0-9_]+)\\s*}}");

    public static final Map<String, Template> CATALOG = new LinkedHashMap<>();

    static {
        CATALOG.put("RESERVATION_CONFIRMATION", new Template(
                "Confirmation de votre reservation n°{{reservationId}}",
                "Bonjour {{name}},\n\nNous avons bien enregistre votre reservation n°{{reservationId}} : chambre {{room}}, "
                        + "du {{checkIn}} au {{checkOut}}, pour un montant de {{amount}} FCFA.\n\nA bientot a l'Hotel Mirador.",
                "Mirador Hotel : reservation n°{{reservationId}} confirmee, chambre {{room}}, du {{checkIn}} au {{checkOut}}."));
        CATALOG.put("PAYMENT_RECEIPT", new Template(
                "Recu de paiement {{reference}}",
                "Bonjour {{name}},\n\nNous avons bien recu votre paiement de {{amount}} FCFA ({{method}}) pour la facture "
                        + "{{invoice}}. Reference : {{reference}}.\n\nMerci de votre confiance.",
                "Mirador Hotel : paiement de {{amount}} FCFA recu pour la facture {{invoice}} (ref {{reference}})."));
        CATALOG.put("RESERVATION_CANCELLATION", new Template(
                "Annulation de votre reservation n°{{reservationId}}",
                "Bonjour {{name}},\n\nVotre reservation n°{{reservationId}} (chambre {{room}}, du {{checkIn}} au {{checkOut}}) "
                        + "a ete annulee. Motif : {{reason}}.\n\nNous esperons vous accueillir prochainement.",
                "Mirador Hotel : reservation n°{{reservationId}} annulee ({{reason}})."));
        CATALOG.put("ARRIVAL_REMINDER", new Template(
                "Rappel : votre arrivee a l'Hotel Mirador",
                "Bonjour {{name}},\n\nNous avons le plaisir de vous accueillir le {{checkIn}} (chambre {{room}}, "
                        + "reservation n°{{reservationId}}).\n\nA tres bientot.",
                "Mirador Hotel : rappel, arrivee le {{checkIn}} (chambre {{room}}, reservation n°{{reservationId}})."));
    }

    private Templates() {
    }

    /** Replaces every {{key}} by its value; an unknown key becomes an empty string. */
    public static String render(String template, Map<String, String> variables) {
        if (template == null) {
            return null;
        }
        Map<String, String> vars = variables == null ? Map.of() : variables;
        Matcher matcher = PLACEHOLDER.matcher(template);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String value = vars.getOrDefault(matcher.group(1), "");
            matcher.appendReplacement(out, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(out);
        return out.toString();
    }
}
