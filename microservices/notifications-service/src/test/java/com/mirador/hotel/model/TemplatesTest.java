package com.mirador.hotel.model;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TemplatesTest {

    @Test
    void replacesPlaceholdersWithAndWithoutSpaces() {
        assertEquals("Bonjour Awa, chambre 101",
                Templates.render("Bonjour {{name}}, chambre {{ room }}", Map.of("name", "Awa", "room", "101")));
    }

    @Test
    void unknownVariablesBecomeEmptyAndSpecialCharactersAreKeptLiterally() {
        assertEquals("a=, b=$1 \\ x", Templates.render("a={{missing}}, b={{b}}", Map.of("b", "$1 \\ x")));
        assertEquals("rien", Templates.render("rien", null));
    }

    @Test
    void everyCataloguedTemplateRendersCompletelyWhenAllVariablesAreGiven() {
        Map<String, String> vars = Map.of("name", "Awa", "reservationId", "12", "room", "101", "checkIn", "2026-10-20",
                "checkOut", "2026-10-22", "amount", "75000", "invoice", "RS1", "method", "ESPECES", "reference", "PAY1");
        Templates.CATALOG.forEach((code, tpl) -> {
            for (String text : new String[] {tpl.subject(), tpl.email(), tpl.sms()}) {
                String rendered = Templates.render(text, vars);
                assertFalse(rendered.contains("{{"), code + " contient un placeholder non remplace : " + rendered);
            }
        });
        assertTrue(Templates.CATALOG.containsKey("RESERVATION_CONFIRMATION"));
        assertTrue(Templates.CATALOG.containsKey("PAYMENT_RECEIPT"));
        assertTrue(Templates.CATALOG.containsKey("ARRIVAL_REMINDER"));
    }
}
