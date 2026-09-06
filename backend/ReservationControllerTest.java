package com.mirador.hotel.controller;

import static org.hamcrest.Matchers.equalTo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import io.restassured.module.mockmvc.RestAssuredMockMvc;
import static io.restassured.module.mockmvc.RestAssuredMockMvc.given;

@SpringBootTest
@AutoConfigureMockMvc
public class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        RestAssuredMockMvc.mockMvc(mockMvc);
    }

    @Test
    void testButtonClick_SaveReservation_ShouldReturnCreated() {
        given()
            .contentType("application/json")
            .body("{\"roomNumber\": \"101\", \"guestName\": \"Jean Dupont\"}")
        .when()
            .post("/api/reservations")
        .then()
            .statusCode(201);
    }

    @Test
    void testButtonClick_SaveReservation_WithEmptyName_ShouldReturnBadRequest() {
        given()
            .contentType("application/json")
            .body("{\"roomNumber\": \"101\", \"guestName\": \"\"}")
        .when()
            .post("/api/reservations")
        .then()
            .statusCode(400)
            .body("message", equalTo("Erreur de validation"));
    }
}